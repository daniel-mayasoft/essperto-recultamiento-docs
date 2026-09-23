import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

const ENV_PATH = 'C:/development/mayasoft/essperto-reclutamiento/esscoti-backend/.env';
const ROUNDS = Number(process.argv[2] ?? 10);
const ASN = process.argv[3] ?? '26611';

function readEnv() {
  const lines = readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
  const pick = (name) => {
    const line = lines.find((l) => new RegExp(`^\\s*${name}\\s*=`).test(l));
    return line ? line.slice(line.indexOf('=') + 1).trim() : null;
  };
  const env = {
    host: pick('PROXY_HOST'),
    port: pick('PROXY_PORT'),
    login: pick('PROXY_LOGIN'),
    pass: pick('PROXY_PASS'),
  };
  for (const [k, v] of Object.entries(env)) if (!v) throw new Error(`Falta ${k}`);
  return env;
}

function exitIpThroughProxy(env, proxyUser) {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${proxyUser}:${env.pass}`).toString('base64');
    const req = http.request({
      host: env.host,
      port: Number(env.port),
      method: 'CONNECT',
      path: 'api.ipify.org:443',
      headers: { 'Proxy-Authorization': `Basic ${auth}` },
      timeout: 30000,
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        resolve({ status: 'connect_failed', code: res.statusCode });
        return;
      }
      const secure = tls.connect({ socket, servername: 'api.ipify.org' }, () => {
        secure.write(
          'GET /?format=json HTTP/1.1\r\nHost: api.ipify.org\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n',
        );
      });
      let raw = '';
      secure.on('data', (chunk) => (raw += chunk));
      secure.on('end', () => {
        const body = raw.slice(raw.indexOf('\r\n\r\n') + 4);
        try {
          resolve({ status: 'success', ip: JSON.parse(body).ip });
        } catch {
          resolve({ status: 'unparseable', body: body.slice(0, 120) });
        }
      });
      secure.on('error', (err) => resolve({ status: 'tls_error', message: err.message }));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'timeout' });
    });
    req.on('error', (err) => resolve({ status: 'error', message: err.message }));
    req.end();
  });
}

function lookupAsn(ip) {
  return new Promise((resolve) => {
    http
      .get(
        `http://ip-api.com/json/${ip}?fields=status,as,isp,org,mobile,countryCode&_=${Date.now()}`,
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve({ status: 'unparseable' });
            }
          });
        },
      )
      .on('error', (err) => resolve({ status: 'error', message: err.message }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runSeries(label, env, buildUser) {
  console.log(`\n=== ${label} ===`);
  const rows = [];
  for (let i = 1; i <= ROUNDS; i++) {
    const sid = Math.floor(Math.random() * 1e9);
    const exit = await exitIpThroughProxy(env, buildUser(sid));
    if (exit.status !== 'success') {
      console.log(`[${i}] ${exit.status} ${exit.message ?? exit.code ?? exit.body ?? ''}`);
      rows.push(exit);
      await sleep(1500);
      continue;
    }
    const info = await lookupAsn(exit.ip);
    rows.push({ ...exit, ...info });
    console.log(
      `[${i}] ip=${exit.ip} ${info.countryCode ?? '?'} mobile=${info.mobile} as="${info.as}" isp="${info.isp}"`,
    );
    await sleep(1500);
  }
  const ok = rows.filter((r) => r.status === 'success');
  const distinct = new Set(ok.map((r) => r.ip)).size;
  const mobile = ok.filter((r) => r.mobile === true).length;
  const claro = ok.filter((r) => /claro|comcel/i.test(`${r.as} ${r.isp} ${r.org}`)).length;
  console.log(
    `-- ${label}: ${ok.length}/${ROUNDS} respondieron; IPs distintas ${distinct}; móviles ${mobile}/${ok.length}; Claro/Comcel ${claro}/${ok.length}`,
  );
}

const env = readEnv();
await runSeries('SIN operador (control)', env, (sid) => `${env.login}__cr.co__sid.${sid}`);
await runSeries(`CON operador __asn.${ASN}`, env, (sid) => `${env.login}__cr.co__asn.${ASN}__sid.${sid}`);
