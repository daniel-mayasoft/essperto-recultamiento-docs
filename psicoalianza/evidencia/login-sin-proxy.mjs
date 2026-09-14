import { readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const ENV_PATH = 'C:/development/mayasoft/essperto-reclutamiento/esscoti-backend/.env';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = new URL('./chrome-profile', import.meta.url).pathname.slice(1);
const LOGIN_URL = 'https://ats.psicoalianza.com/login';

function readSecrets() {
  const lines = readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  const pick = (re) => {
    const line = lines.find((l) => re.test(l));
    if (!line) return null;
    const idx = line.search(/[:=]/);
    return line.slice(idx + 1).trim();
  };
  const email = pick(/^\s*Usuario\s*:/i);
  const password = pick(/^\s*Contrase/i);
  if (!email || !password) throw new Error('No se encontraron credenciales en el .env');
  return { email, password };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { email, password } = readSecrets();

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  userDataDir: PROFILE,
  defaultViewport: null,
  args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
});

const page = await browser.newPage();

try {
  console.log('Abriendo login...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('#email', { timeout: 20000 });
  await page.waitForSelector('#password', { timeout: 20000 });
  await page.waitForSelector('#enviar_inicio_sesion', { timeout: 20000 });

  console.log('Escribiendo credenciales como un humano...');
  await page.click('#email');
  await page.type('#email', email, { delay: 90 });
  await sleep(400);
  await page.click('#password');
  await page.type('#password', password, { delay: 110 });
  await sleep(600);

  console.log('Enviando...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }).catch(() => null),
    page.click('#enviar_inicio_sesion'),
  ]);

  await sleep(1500);
  const url = page.url();
  const alertText = await page
    .$eval('#alerta', (el) => el.textContent.replace(/\s+/g, ' ').trim())
    .catch(() => null);

  const ok = /\/inicio/.test(url) || (!/\/login/.test(url) && url !== LOGIN_URL);
  console.log('\n===== RESULTADO =====');
  console.log('URL final:', url);
  if (alertText) console.log('Alerta:', alertText);
  console.log(ok ? '✅ LOGIN OK — el token del navegador real pasó el captcha' : '❌ NO autenticado');

  await page.screenshot({ path: 'puppeteer-result.png', fullPage: false }).catch(() => null);
  console.log('Captura guardada en puppeteer-result.png');
  console.log('Dejo la ventana abierta 20s para que la veas.');
  await sleep(20000);
} finally {
  await browser.close();
}
