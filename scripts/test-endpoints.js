const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('../src/config');
const app = require('../src/server');

const OUTPUT_DIR = path.resolve(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let server;
const TEST_PORT = 5099;

function makeRequest({ method, path: reqPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(postData && {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      }),
    };

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: reqPath,
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          let json = null;
          try {
            json = JSON.parse(buffer.toString('utf8'));
          } catch {
            // Not a JSON response (e.g. PDF/Image binary)
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            buffer,
            json,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Microservice Verification Tests ---');

  // Start test server instance
  server = app.listen(TEST_PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('\n--- 1. Testing Health Endpoint ---');
    const healthRes = await makeRequest({ method: 'GET', path: '/api/health' });
    assert(healthRes.statusCode === 200, 'GET /api/health returns 200');
    assert(healthRes.json?.status === 'healthy', 'Health payload status is "healthy"');

    // 2. Auth Middleware: Missing Token
    console.log('\n--- 2. Testing Authentication Middleware ---');
    const noAuthRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-certificate',
      body: { name: 'Alice Smith', referralCode: 'ALICE2026', level: 'Platinum' },
    });
    assert(noAuthRes.statusCode === 401, 'Rejects request without Authorization header with 401');

    // 3. Auth Middleware: Invalid Token
    const invalidAuthRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-certificate',
      headers: { Authorization: 'Bearer wrong-key-here' },
      body: { name: 'Alice Smith', referralCode: 'ALICE2026', level: 'Platinum' },
    });
    assert(invalidAuthRes.statusCode === 401, 'Rejects request with invalid Bearer token with 401');

    const authHeaders = {
      Authorization: `Bearer ${config.apiSecretKey}`,
    };

    // 4. Validation: Missing Fields
    console.log('\n--- 3. Testing Input Validation ---');
    const missingCertFieldRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-certificate',
      headers: authHeaders,
      body: { name: 'Alice Smith' }, // Missing required 'date'
    });
    assert(missingCertFieldRes.statusCode === 400, 'Rejects certificate missing required date with 400');
    assert(missingCertFieldRes.json?.details?.length > 0, 'Returns validation details in error response');

    const missingPosterFieldRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-poster',
      headers: authHeaders,
      body: { collegeName: 'RGUKT' }, // Missing required 'referralLink'
    });
    assert(missingPosterFieldRes.statusCode === 400, 'Rejects poster missing required referralLink with 400');

    const missingOfferFieldRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-offer-letter',
      headers: authHeaders,
      body: {}, // Missing required 'name'
    });
    assert(missingOfferFieldRes.statusCode === 400, 'Rejects offer letter missing required name with 400');

    // 5. Validation: Character Limit Exceeded (> 60 chars)
    const longName = 'A'.repeat(65);
    const charLimitRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-certificate',
      headers: authHeaders,
      body: { name: longName, date: 'October 8, 2026' },
    });
    assert(charLimitRes.statusCode === 400, 'Rejects payload exceeding maximum character length with 400');

    // 6. Generate Certificate (Landscape A4 PDF)
    console.log('\n--- 4. Testing Certificate Generation ---');
    const certRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-certificate',
      headers: authHeaders,
      body: {
        name: 'Sarah Connor',
        date: 'October 8, 2026',
        referralCode: 'SARAH-LEAD-2026',
        level: 'Diamond Ambassador',
      },
    });
    assert(certRes.statusCode === 200, 'POST /api/generate-certificate returns 200');
    assert(
      certRes.headers['content-type'] === 'application/pdf',
      'Certificate response Content-Type is application/pdf'
    );
    assert(certRes.buffer.length > 50000, `Certificate PDF generated (${certRes.buffer.length} bytes)`);

function safeWriteFile(filePath, buffer) {
  try {
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (err) {
    if (err.code === 'EBUSY') {
      const altPath = filePath.replace(/(\.[^.]+)$/, `-latest$1`);
      try {
        fs.writeFileSync(altPath, buffer);
        return altPath;
      } catch {
        return filePath;
      }
    }
    throw err;
  }
}

    const certFilePath = safeWriteFile(path.join(OUTPUT_DIR, 'sample-certificate.pdf'), certRes.buffer);
    console.log(`Saved sample certificate to: ${certFilePath}`);

    // 7. Generate Offer Letter (Portrait A4 PDF)
    console.log('\n--- 5. Testing Offer Letter Generation ---');
    const offerRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-offer-letter',
      headers: authHeaders,
      body: {
        name: 'Sarah Connor',
        role: 'Campus Ambassador',
        startDate: 'October 10, 2026',
        referralCode: 'SARAH-LEAD-2026',
      },
    });
    assert(offerRes.statusCode === 200, 'POST /api/generate-offer-letter returns 200');
    assert(
      offerRes.headers['content-type'] === 'application/pdf',
      'Offer letter response Content-Type is application/pdf'
    );
    assert(offerRes.buffer.length > 50000, `Offer Letter PDF generated (${offerRes.buffer.length} bytes)`);

    const offerFilePath = safeWriteFile(path.join(OUTPUT_DIR, 'sample-offer-letter.pdf'), offerRes.buffer);
    console.log(`Saved sample offer letter to: ${offerFilePath}`);

    // 8. Generate Poster (Overlay dynamic text on base PNG)
    console.log('\n--- 6. Testing Poster Generation ---');
    const posterRes = await makeRequest({
      method: 'POST',
      path: '/api/generate-poster',
      headers: authHeaders,
      body: {
        collegeName: 'RGUKT - SRIKAKULAM',
        referralLink: 'https://qffrguktsklm.in/ref/SARAH-2026',
      },
    });
    assert(posterRes.statusCode === 200, 'POST /api/generate-poster returns 200');
    assert(
      posterRes.headers['content-type'] === 'image/png',
      'Poster response Content-Type is image/png'
    );
    assert(posterRes.buffer.length > 500000, `Poster PNG generated (${posterRes.buffer.length} bytes)`);

    const posterFilePath = safeWriteFile(path.join(OUTPUT_DIR, 'sample-poster.png'), posterRes.buffer);
    console.log(`Saved sample poster to: ${posterFilePath}`);

    console.log('\n========================================');
    console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
    console.log('========================================');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
