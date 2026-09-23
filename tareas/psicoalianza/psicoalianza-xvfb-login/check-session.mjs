import { readFileSync } from 'node:fs';

const COOKIES_FILE = new URL('./output/cookies.json', import.meta.url);
const ACTIVE_VACANCIES_URL = 'https://ats.psicoalianza.com/procesos-listado-tabla?activo=true&estado_id=2';

const cookies = JSON.parse(readFileSync(COOKIES_FILE, 'utf8'));
const remember = cookies.find(({ name }) => name.startsWith('remember_web_'));
if (!remember) {
  console.log('No hay cookie remember_web_ en el archivo de cookies');
  process.exit(1);
}

const response = await fetch(ACTIVE_VACANCIES_URL, {
  redirect: 'manual',
  headers: {
    Cookie: `${remember.name}=${remember.value}`,
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
});
const location = response.headers.get('location');
const redirectPath = location ? new URL(location, ACTIVE_VACANCIES_URL).pathname : null;
console.log(`Código de respuesta: ${response.status}${redirectPath ? ` → ${redirectPath}` : ''}`);

const rawBody = await response.text();
let body = null;
try {
  body = JSON.parse(rawBody);
} catch {}

if (response.status !== 200 || !Array.isArray(body?.data)) {
  console.log('La respuesta no trae el listado de vacantes');
  process.exitCode = 1;
} else {
  console.log(`Vacantes activas: ${body.recordsTotal} (filas recibidas: ${body.data.length})`);
  for (const vacancy of body.data.slice(0, 5)) console.log(`- ${vacancy.nombre}`);
}
