import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const ENV_PATH = 'C:/development/mayasoft/essperto-reclutamiento/esscoti-backend/.env';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = new URL('./chrome-profile-bw', import.meta.url).pathname.slice(1);
const LOGIN_URL = 'https://ats.psicoalianza.com/login';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const BLOCK_TYPES = new Set(['image', 'font', 'media', 'stylesheet']);

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

const env = readEnv();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

async function measure(label, block) {
  const sessionId = Math.floor(Math.random() * 1e9);
  const proxyUser = `${env.proxyLogin}__cr.co__sid.${sessionId}`;
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: `${PROFILE}-${block ? 'blocked' : 'full'}`,
    args: [
      `--proxy-server=http://${env.proxyHost}:${env.proxyPort}`,
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  const page = await browser.newPage();
  await page.authenticate({ username: proxyUser, password: env.proxyPass });
  await page.setUserAgent(UA);

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  const typeById = new Map();
  const byType = {};
  let received = 0;
  let sent = 0;
  let requests = 0;
  client.on('Network.responseReceived', (e) => typeById.set(e.requestId, e.type));
  client.on('Network.requestWillBeSent', (e) => {
    requests += 1;
    if (e.request.postData) sent += Buffer.byteLength(e.request.postData);
  });
  client.on('Network.loadingFinished', (e) => {
    const t = typeById.get(e.requestId) ?? 'other';
    received += e.encodedDataLength;
    byType[t] = (byType[t] ?? 0) + e.encodedDataLength;
  });

  if (block) {
    await page.setRequestInterception(true);
    page.on('request', (req) => (BLOCK_TYPES.has(req.resourceType()) ? req.abort() : req.continue()));
  }

  let result = 'unknown';
  try {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('#enviar_inicio_sesion', { timeout: 30000 });
    await page.click('#email');
    await page.type('#email', env.email, { delay: 60 });
    await page.click('#password');
    await page.type('#password', env.password, { delay: 60 });
    await (await page.$('#remember'))?.click();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null),
      page.click('#enviar_inicio_sesion'),
    ]);
    await sleep(1500);
    result = /\/login/.test(page.url()) ? 'rechazado' : 'login OK';
  } finally {
    await browser.close();
  }

  console.log(`\n=== ${label} (${result}) ===`);
  console.log(`Total recibido: ${kb(received)}  |  enviado: ${kb(sent)}  |  requests: ${requests}`);
  const rows = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  for (const [t, b] of rows) console.log(`  ${t.padEnd(12)} ${kb(b)}`);
  return { received, sent, result };
}

const full = await measure('FLUJO COMPLETO', false);
await sleep(20000);
const blocked = await measure('BLOQUEANDO imagen/fuente/media/css', true);

const perLoginMB = full.received / 1048576;
const perLoginBlockedMB = blocked.received / 1048576;
console.log('\n===== RESUMEN =====');
console.log(`Completo:  ${perLoginMB.toFixed(3)} MB/login  ->  ~${Math.floor(1024 / perLoginMB)} logins por GB`);
if (blocked.result === 'login OK') {
  console.log(`Bloqueado: ${perLoginBlockedMB.toFixed(3)} MB/login  ->  ~${Math.floor(1024 / perLoginBlockedMB)} logins por GB`);
  console.log(`Ahorro: ${(100 * (1 - blocked.received / full.received)).toFixed(0)}%`);
} else {
  console.log(`Bloqueado: ${blocked.result} — bloquear esos recursos rompió el login, no usar esa variante.`);
}
