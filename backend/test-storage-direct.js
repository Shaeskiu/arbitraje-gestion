/**
 * Prueba directa al Storage API (ejecutar dentro del contenedor backend).
 * Uso: node test-storage-direct.js
 */
const STORAGE_URL = process.env.SUPABASE_STORAGE_DIRECT_URL || 'http://storage:5000';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'facturas';

async function main() {
  console.log('STORAGE_URL=', STORAGE_URL);
  console.log('SERVICE_KEY defined=', !!SERVICE_KEY);

  // 1. Crear bucket
  console.log('\n1. POST /bucket/');
  const bucketRes = await fetch(`${STORAGE_URL}/bucket/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ name: BUCKET, public: false })
  });
  const bucketText = await bucketRes.text();
  console.log('   status=', bucketRes.status, 'body=', bucketText?.slice(0, 300));

  // 2. Subir objeto de prueba
  const testPath = 'test-uuid/factura.pdf';
  const testBody = Buffer.from('test pdf content');
  console.log('\n2. POST /object/' + BUCKET + '/' + testPath);
  const objectRes = await fetch(`${STORAGE_URL}/object/${BUCKET}/${testPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf',
      Authorization: `Bearer ${SERVICE_KEY}`,
      'x-upsert': 'true'
    },
    body: testBody
  });
  const objectText = await objectRes.text();
  console.log('   status=', objectRes.status, 'body=', objectText?.slice(0, 300));
}

main().catch(e => {
  console.error('Error:', e.message, e.cause);
  process.exit(1);
});
