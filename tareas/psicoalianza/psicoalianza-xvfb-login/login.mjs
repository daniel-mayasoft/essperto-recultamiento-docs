import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const ENV_PATH = '/secrets/backend.env';
const PROFILE_DIR = '/profile';
const OUTPUT_DIR = '/output';
const ATTEMPTS_LOG = `${OUTPUT_DIR}/attempts.jsonl`;
const COOKIES_FILE = `${OUTPUT_DIR}/cookies.json`;
const CHROMIUM = '/usr/bin/chromium';
const DISPLAY = ':99';
const SCREEN = { width: 1920, height: 1080 };
const SITE_URL = 'https://ats.psicoalianza.com/';
const SITE_HOST = 'psicoalianza.com';
const LOGIN_URL = `${SITE_URL}login`;
const HARD_TIMEOUT_MS = 180_000;
const SUBMIT_WAIT_MS = 60_000;
const ACCOUNT_SECTION = `CUENTA ${(process.env.ACCOUNT ?? 'alterna').toUpperCase()}`;
const PROXY_ASN = process.env.PROXY_ASN ? `__asn.${process.env.PROXY_ASN}` : '';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const secondsSince = (from) => Number(((Date.now() - from) / 1000).toFixed(1));

function readCredentials() {
  const lines = readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  const valueAt = (pattern, fromIndex = 0) => {
    const line = lines.find((candidate, index) => index >= fromIndex && pattern.test(candidate));
    return line ? line.slice(line.search(/[:=]/) + 1).trim() : null;
  };
  const sectionIndex = lines.findIndex((line) => line.trim().toUpperCase() === ACCOUNT_SECTION);
  if (sectionIndex === -1) throw new Error(`No aparece el encabezado ${ACCOUNT_SECTION} en el .env del backend`);
  const credentials = {
    email: valueAt(/^\s*Usuario\s*:/i, sectionIndex),
    password: valueAt(/^\s*Contrase/i, sectionIndex),
    proxyLogin: valueAt(/^\s*PROXY_LOGIN\s*=/),
    proxyPass: valueAt(/^\s*PROXY_PASS\s*=/),
    proxyHost: valueAt(/^\s*PROXY_HOST\s*=/),
    proxyPort: valueAt(/^\s*PROXY_PORT\s*=/),
  };
  for (const [key, value] of Object.entries(credentials)) {
    if (!value) throw new Error(`Falta ${key} en el .env del backend`);
  }
  return credentials;
}

function hoursSinceLastCountedAttempt() {
  if (!existsSync(ATTEMPTS_LOG)) return null;
  const counted = readFileSync(ATTEMPTS_LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((attempt) => attempt.counted);
  if (counted.length === 0) return null;
  const last = new Date(counted.at(-1).startedAt).getTime();
  return Number(((Date.now() - last) / 3_600_000).toFixed(2));
}

function readMemoryPeakMb() {
  try {
    return Math.round(Number(readFileSync('/sys/fs/cgroup/memory.peak', 'utf8')) / 1_048_576);
  } catch {
    return null;
  }
}

async function startXvfb() {
  rmSync('/tmp/.X99-lock', { force: true });
  const xvfb = spawn('Xvfb', [DISPLAY, '-screen', '0', `${SCREEN.width}x${SCREEN.height}x24`, '-nolisten', 'tcp'], {
    stdio: 'ignore',
  });
  const deadline = Date.now() + 10_000;
  while (!existsSync('/tmp/.X11-unix/X99')) {
    if (xvfb.exitCode !== null || Date.now() > deadline) throw new Error('Xvfb no arrancó');
    await sleep(50);
  }
  return xvfb;
}

async function siteCookies(cdp) {
  const { cookies } = await cdp.send('Network.getCookies', { urls: [SITE_URL] });
  return cookies.filter((cookie) => cookie.domain.includes(SITE_HOST));
}

async function removeSiteCookies(cdp) {
  const cookies = await siteCookies(cdp);
  for (const { name, domain, path } of cookies) {
    await cdp.send('Network.deleteCookies', { name, domain, path });
  }
  return cookies.length;
}

async function bodyText(page) {
  return page
    .evaluate(() => document.body?.innerText ?? '')
    .then((text) => text.replace(/\s+/g, ' ').toLowerCase())
    .catch(() => '');
}

function classifyByText(text) {
  if (text.includes('no hemos podido verificar')) return 'captcha_rejected';
  if (text.includes('demasiados') || text.includes('bloquead')) return 'locked';
  if (text.includes('credenciales') || text.includes('no coinciden')) return 'bad_credentials';
  return null;
}

async function attempt(record) {
  const credentials = readCredentials();

  let started = Date.now();
  record.xvfb = await startXvfb();
  record.xvfbSeconds = secondsSince(started);

  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    rmSync(`${PROFILE_DIR}/${name}`, { force: true });
  }

  started = Date.now();
  record.browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    headless: false,
    userDataDir: PROFILE_DIR,
    defaultViewport: null,
    env: { ...process.env, DISPLAY },
    args: [
      `--proxy-server=http://${credentials.proxyHost}:${credentials.proxyPort}`,
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      `--window-size=${SCREEN.width},${SCREEN.height}`,
      '--window-position=0,0',
    ],
  });
  const page = (await record.browser.pages())[0] ?? (await record.browser.newPage());
  record.chromiumSeconds = secondsSince(started);
  record.browserVersion = await record.browser.version();

  const cdp = await page.createCDPSession();
  record.removedSiteCookies = await removeSiteCookies(cdp);
  await page.authenticate({
    username: `${credentials.proxyLogin}${PROXY_ASN}__cr.co__sid.${randomInt(1, 1_000_000_000)}`,
    password: credentials.proxyPass,
  });

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 90_000 });
    await page.waitForSelector('#enviar_inicio_sesion', { timeout: 30_000 });
  } catch (error) {
    record.result = new URL(page.url()).pathname.startsWith('/login') ? 'network' : 'already_inside';
    record.detail = error.message.split('\n')[0];
    return page;
  }

  await page.click('#email');
  await page.type('#email', credentials.email, { delay: 90 });
  await sleep(400);
  await page.click('#password');
  await page.type('#password', credentials.password, { delay: 110 });
  await sleep(600);

  const remember = await page.$('#remember');
  record.rememberCheckedByDefault = remember ? await remember.evaluate((element) => element.checked) : null;
  if (remember && !record.rememberCheckedByDefault) await remember.click();

  let leftLoginTo = null;
  let loginReloaded = false;
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.isInterceptResolutionHandled()) return;
    const url = new URL(request.url());
    const isSiteNavigation =
      request.isNavigationRequest() &&
      request.frame() === page.mainFrame() &&
      url.hostname.endsWith(SITE_HOST) &&
      request.method() === 'GET';
    if (isSiteNavigation && !url.pathname.startsWith('/login')) {
      leftLoginTo = url.pathname;
      request.abort('aborted');
      return;
    }
    if (isSiteNavigation) loginReloaded = true;
    request.continue();
  });

  record.counted = true;
  const submittedAt = Date.now();
  await page.click('#enviar_inicio_sesion');

  let textResult = null;
  while (!leftLoginTo && Date.now() - submittedAt < SUBMIT_WAIT_MS) {
    await sleep(500);
    if (loginReloaded) await page.waitForNetworkIdle({ idleTime: 1000, timeout: 20_000 }).catch(() => null);
    textResult = classifyByText(await bodyText(page));
    if (textResult || loginReloaded) break;
  }
  record.submitSeconds = secondsSince(submittedAt);
  record.leftLoginTo = leftLoginTo;

  const cookies = await siteCookies(cdp);
  record.cookieNames = cookies.map(({ name }) => (name.startsWith('remember_web_') ? 'remember_web_<hash>' : name));
  const hasRememberCookie = cookies.some(({ name }) => name.startsWith('remember_web_'));

  if (leftLoginTo && hasRememberCookie) {
    record.result = 'passed';
    writeFileSync(
      COOKIES_FILE,
      JSON.stringify(
        cookies.map(({ name, value, domain, path, expires, httpOnly, secure }) => ({
          name,
          value,
          domain,
          path,
          expires,
          httpOnly,
          secure,
        })),
        null,
        2,
      ),
    );
    return page;
  }

  record.result = textResult ?? classifyByText(await bodyText(page)) ?? 'unknown';
  return page;
}

const startedAt = new Date();
const record = { startedAt: startedAt.toISOString(), hoursSinceLastAttempt: hoursSinceLastCountedAttempt(), counted: false, result: 'unknown' };
let page = null;

try {
  page = await Promise.race([
    attempt(record),
    sleep(HARD_TIMEOUT_MS).then(() => {
      throw new Error('Tiempo límite del intento agotado');
    }),
  ]);
} catch (error) {
  record.result = record.result === 'unknown' ? 'error' : record.result;
  record.detail = error.message.split('\n')[0];
} finally {
  if (page && record.result !== 'passed') {
    await page.screenshot({ path: `${OUTPUT_DIR}/attempt-${startedAt.getTime()}.png` }).catch(() => null);
  }
  await record.browser?.close().catch(() => null);
  record.xvfb?.kill();
  delete record.browser;
  delete record.xvfb;
  record.totalSeconds = secondsSince(startedAt.getTime());
  record.memoryPeakMb = readMemoryPeakMb();
  appendFileSync(ATTEMPTS_LOG, `${JSON.stringify(record)}\n`);
  console.log(JSON.stringify(record, null, 2));
}

process.exit(record.result === 'passed' ? 0 : 2);
