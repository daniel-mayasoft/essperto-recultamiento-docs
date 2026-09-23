import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const ENV_PATH = 'C:/development/mayasoft/essperto-reclutamiento/esscoti-backend/.env';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = new URL('./chrome-profile-proxy', import.meta.url).pathname.slice(1);
const LOGIN_URL = 'https://ats.psicoalianza.com/login';

function readEnv() {
  const lines = readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  const pick = (re) => {
    const line = lines.find((l) => re.test(l));
    if (!line) return null;
    const idx = line.search(/[:=]/);
    return line.slice(idx + 1).trim();
  };
  return {
    email: pick(/^\s*Usuario\s*:/i),
    password: pick(/^\s*Contrase/i),
    proxyLogin: pick(/^\s*PROXY_LOGIN\s*=/),
    proxyPass: pick(/^\s*PROXY_PASS\s*=/),
    proxyHost: pick(/^\s*PROXY_HOST\s*=/),
    proxyPort: pick(/^\s*PROXY_PORT\s*=/),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const env = readEnv();
for (const [k, v] of Object.entries(env)) if (!v) throw new Error(`Falta ${k} en el .env`);

async function attempt(n) {
  const sessionId = Math.floor(Math.random() * 1e9);
  const proxyUser = `${env.proxyLogin}__cr.co__sid.${sessionId}`;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    userDataDir: `${PROFILE}-${n}`,
    defaultViewport: null,
    args: [
      `--proxy-server=http://${env.proxyHost}:${env.proxyPort}`,
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
    ],
  });
  const page = await browser.newPage();
  await page.authenticate({ username: proxyUser, password: env.proxyPass });

  try {
    const exitIp = await page
      .goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 60000 })
      .then((r) => r.text())
      .catch((e) => `(IP ilegible: ${e.message})`);
    console.log(`[${n}] IP de salida: ${exitIp}`);

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('#email', { timeout: 30000 });
    await page.waitForSelector('#password', { timeout: 30000 });
    await page.waitForSelector('#enviar_inicio_sesion', { timeout: 30000 });

    await page.click('#email');
    await page.type('#email', env.email, { delay: 90 });
    await sleep(400);
    await page.click('#password');
    await page.type('#password', env.password, { delay: 110 });
    await sleep(600);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null),
      page.click('#enviar_inicio_sesion'),
    ]);
    await sleep(2000);

    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim()).catch(() => '');
    const flat = bodyText.toLowerCase();
    await page.screenshot({ path: `puppeteer-proxy-${n}.png` }).catch(() => null);

    if (/\/inicio|\/procesos/.test(url) || (!/\/login/.test(url) && url !== LOGIN_URL)) {
      console.log(`[${n}] ✅ LOGIN OK`);
      return 'passed';
    }
    if (flat.includes('no hemos podido verificar')) {
      console.log(`[${n}] ❌ captcha rechazado`);
      return 'captcha_rejected';
    }
    if (flat.includes('demasiados') || flat.includes('bloquead')) {
      console.log(`[${n}] ⛔ posible bloqueo de cuenta`);
      return 'locked';
    }
    if (flat.includes('credenciales') || flat.includes('no coinciden')) {
      console.log(`[${n}] ❌ credenciales rechazadas`);
      return 'bad_credentials';
    }
    console.log(`[${n}] ❓ desconocido (URL ${url})`);
    return 'unknown';
  } finally {
    await browser.close();
  }
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const r = await attempt(i);
  results.push(r);
  if (r === 'passed' || r === 'locked') break;
  if (i < 3) await sleep(15000);
}
console.log(`\n===== RESUMEN POR PROXY: ${results.join(', ')} =====`);
