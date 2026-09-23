import { readFileSync, writeFileSync } from 'node:fs';

const ENV_PATH = 'C:/development/mayasoft/essperto-reclutamiento/esscoti-backend/.env';
const SITE = 'https://ats.psicoalianza.com';
const SOLVER = 'https://api.solvecaptcha.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const minScore = Number(process.argv[2] ?? '0.3');
const attempts = Number(process.argv[3] ?? '3');
let lastTaskId = null;

function readSecrets() {
  const lines = readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  const pick = (re) => {
    const line = lines.find((l) => re.test(l));
    if (!line) return null;
    const idx = line.search(/[:=]/);
    return line.slice(idx + 1).trim();
  };
  const secrets = {
    email: pick(/^\s*Usuario\s*:/i),
    password: pick(/^\s*Contrase/i),
    solverKey: pick(/^\s*SOLVE_CAPTCHA_TOKEN\s*=/),
  };
  for (const [k, v] of Object.entries(secrets)) {
    if (!v) throw new Error(`No se encontró ${k} en el .env`);
  }
  return secrets;
}

async function timedFetch(url, init = {}, ms = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function createJar() {
  const cookies = new Map();
  return {
    ingest(res) {
      for (const h of res.headers.getSetCookie?.() ?? []) {
        const [kv] = h.split(';');
        const i = kv.indexOf('=');
        if (i > 0) cookies.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
      }
    },
    header() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    },
    names() {
      return [...cookies.keys()];
    },
    solverPairs() {
      return [...cookies.entries()].map(([k, v]) => `${k}:${v};`).join('');
    },
    headerOnly(prefix) {
      return [...cookies.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => `${k}=${v}`).join('; ');
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function solveCaptcha(solverKey, siteKey, pageUrl, jar) {
  const started = Date.now();
  const body = new URLSearchParams({
    key: solverKey,
    method: 'userrecaptcha',
    version: 'v3',
    googlekey: siteKey,
    pageurl: pageUrl,
    action: 'submit',
    min_score: String(minScore),
    json: '1',
    ...(process.argv.includes('--enterprise') ? { enterprise: '1' } : {}),
    ...(process.argv.includes('--ua') ? { userAgent: UA } : {}),
    ...(process.argv.includes('--cookies') ? { cookies: jar.solverPairs(), userAgent: UA } : {}),
    ...(process.argv.includes('--recaptcha-net') ? { domain: 'www.recaptcha.net' } : {}),
  });
  const submit = await timedFetch(`${SOLVER}/in.php`, { method: 'POST', body });
  const submitText = await submit.text();
  let submitJson;
  try {
    submitJson = JSON.parse(submitText);
  } catch {
    return { ok: false, reason: `respuesta ilegible al encargar (HTTP ${submit.status}): ${submitText.slice(0, 80)}` };
  }
  if (submitJson.status !== 1) {
    return { ok: false, reason: `el servicio rechazó el encargo: ${submitJson.request} ${submitJson.error_text ?? ''}` };
  }
  const taskId = submitJson.request;

  await sleep(15000);
  while (Date.now() - started < 180000) {
    const q = new URLSearchParams({ key: solverKey, action: 'get', id: taskId, json: '1' });
    const res = await timedFetch(`${SOLVER}/res.php?${q}`);
    const text = await res.text();
    if (text.includes('CAPCHA_NOT_READY')) {
      await sleep(5000);
      continue;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, reason: `respuesta ilegible al preguntar (HTTP ${res.status}): ${text.slice(0, 80)}` };
    }
    if (json.status === 1) {
      lastTaskId = taskId;
      return { ok: true, token: json.request, seconds: Math.round((Date.now() - started) / 1000), taskId };
    }
    return { ok: false, reason: `el servicio devolvió error: ${json.request} ${json.error_text ?? ''}` };
  }
  return { ok: false, reason: 'tiempo agotado (3 min)' };
}

function extractAlert(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const known = [
    'No hemos podido verificar que eres una persona',
    'credenciales',
    'no coinciden',
    'Demasiados intentos',
    'bloquead',
  ];
  const flat = `${text} ${html.replace(/\s+/g, ' ')}`.toLowerCase();
  const hits = known.filter((k) => flat.includes(k.toLowerCase()));
  const alertMatch = html.match(/id="alerta"[^>]*>([\s\S]{0,300}?)</i);
  return { hits, alertText: alertMatch ? alertMatch[1].replace(/\s+/g, ' ').trim() : null };
}

async function attempt(n, secrets) {
  const jar = createJar();
  const pageUrl = `${SITE}/login`;
  const log = (m) => console.log(`[intento ${n}] ${m}`);

  const page = await timedFetch(pageUrl, { headers: { 'User-Agent': UA } });
  jar.ingest(page);
  const html = await page.text();
  const siteKey = html.match(/recaptcha\/api\.js\?render=([\w-]+)/)?.[1];
  if (!siteKey) return log('no se encontró la clave del sitio en la página de login');
  log(`login cargado (HTTP ${page.status}), cookies: ${jar.names().join(', ')}, clave de sitio encontrada`);

  lastTaskId = null;
  const solved = await solveCaptcha(secrets.solverKey, siteKey, pageUrl, jar);
  if (!solved.ok) {
    log(`captcha NO resuelto: ${solved.reason}`);
    return 'solver_error';
  }
  log(`token recibido: largo ${solved.token.length}, tardó ${solved.seconds}s`);

  const csrfRes = await timedFetch(`${SITE}/obtener-token-csrf`, {
    headers: { 'User-Agent': UA, Cookie: jar.header(), 'X-Requested-With': 'XMLHttpRequest', Referer: pageUrl },
  });
  jar.ingest(csrfRes);
  const csrfText = await csrfRes.text();
  let csrf;
  try {
    csrf = JSON.parse(csrfText).token;
  } catch {
    csrf = html.match(/name="_token" value="([^"]+)"/)?.[1];
  }
  if (!csrf) return log('sin token CSRF');
  log(`CSRF fresco (HTTP ${csrfRes.status})`);

  const form = new URLSearchParams({
    _token: csrf,
    email: secrets.email,
    password: secrets.password,
    remember: 'on',
    'g-recaptcha-response': solved.token,
  });
  const post = await timedFetch(pageUrl, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'User-Agent': UA,
      Cookie: jar.header(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: SITE,
      Referer: pageUrl,
    },
    body: form,
  });
  jar.ingest(post);
  const location = post.headers.get('location') ?? '';
  log(`envío del formulario: HTTP ${post.status}, redirige a ${location.replace(SITE, '') || '(nada)'}, cookies: ${jar.names().map((c) => (c.startsWith('remember_web_') ? 'remember_web_<hash>' : c)).join(', ')}`);

  const check = await timedFetch(pageUrl, {
    redirect: 'manual',
    headers: { 'User-Agent': UA, Cookie: jar.header() },
  });
  const checkLocation = check.headers.get('location') ?? '';
  if (check.status === 302 && checkLocation.includes('/inicio')) {
    log('✅ SESIÓN VIVA: /login redirige a /inicio');
    const rememberOnly = jar.headerOnly('remember_web_');
    if (!rememberOnly) {
      log('sin cookie de permanecer conectado: no se puede probar la reautenticación');
      return 'passed';
    }
    const reauth = await timedFetch(pageUrl, {
      redirect: 'manual',
      headers: { 'User-Agent': UA, Cookie: rememberOnly },
    });
    const reauthLocation = reauth.headers.get('location') ?? '';
    const newCookies = (reauth.headers.getSetCookie?.() ?? []).map((h) => h.split('=')[0]);
    log(
      reauth.status === 302 && reauthLocation.includes('/inicio')
        ? `✅ REAUTENTICA: solo con la cookie de permanecer conectado, /login redirige a /inicio y emite ${newCookies.join(', ') || 'ninguna cookie'}`
        : `❌ la cookie de permanecer conectado sola NO reautentica (HTTP ${reauth.status}, redirige a ${reauthLocation.replace(SITE, '') || '(nada)'})`,
    );
    return 'passed';
  }
  const checkHtml = await check.text();
  writeFileSync(`failed-login-${n}.html`, checkHtml);
  const { hits, alertText } = extractAlert(checkHtml);
  log(`❌ no autenticado (HTTP ${check.status}). Mensajes detectados: ${hits.join(' | ') || 'ninguno conocido'}${alertText ? ` · alerta: "${alertText}"` : ''}`);
  if (hits.some((h) => h.startsWith('No hemos podido'))) return 'captcha_rejected';
  if (hits.length) return 'other_rejection';
  return 'unknown';
}

const secrets = readSecrets();
console.log(`Medición: puntaje mínimo ${minScore}, ${attempts} intento(s), variantes: ${process.argv.slice(4).join(' ') || 'ninguna'}\n`);
const results = [];
for (let i = 1; i <= attempts; i++) {
  let r;
  try {
    r = await attempt(i, secrets);
  } catch (err) {
    console.log(`[intento ${i}] excepción: ${err.name}: ${err.message}`);
    r = 'exception';
  }
  if (process.argv.includes('--report') && lastTaskId && (r === 'passed' || r === 'captcha_rejected')) {
    const reportAction = r === 'passed' ? 'reportgood' : 'reportbad';
    const q = new URLSearchParams({ key: secrets.solverKey, action: reportAction, id: lastTaskId, json: '1' });
    const reportText = await timedFetch(`${SOLVER}/res.php?${q}`).then((res) => res.text()).catch((e) => `falló: ${e.message}`);
    console.log(`[intento ${i}] reporte ${reportAction}: ${reportText.slice(0, 120)}`);
  }
  results.push(r);
  if (r === 'passed' && process.argv.includes('--until-pass')) {
    console.log(`Se para: primer éxito en el intento ${i}.`);
    break;
  }
  const gapArg = process.argv.find((a) => a.startsWith('--gap='));
  const gapSeconds = gapArg ? Number(gapArg.slice('--gap='.length)) : 20;
  if (i < attempts && gapSeconds > 0) {
    await sleep(gapSeconds * 1000);
  }
  if (r === 'other_rejection' || r === 'solver_error') {
    console.log('Se para: el fallo no es de captcha y repetir no ayuda (o podría bloquear la cuenta).');
    break;
  }
  console.log('');
}
console.log(`\nResumen: ${results.join(', ')}`);
