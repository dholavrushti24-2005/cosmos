const assert = require('assert');

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE ENDPOINT TESTS ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`✗ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health', async () => {
    const res = await fetch('http://localhost:5000/api/health');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.database, 'connected');
  });

  // 2. Products listing
  let sampleProductId = null;
  await test('GET /api/products', async () => {
    const res = await fetch('http://localhost:5000/api/products');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.products), 'products must be array');
    assert(data.products.length > 0, 'products must not be empty');
    sampleProductId = data.products[0].id;
    console.log(`    Found ${data.products.length} products. Sample: ${sampleProductId} (${data.products[0].name})`);
  });

  // 3. Single Product lookup
  await test('GET /api/products/:id', async () => {
    const res = await fetch(`http://localhost:5000/api/products/${sampleProductId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.product.id, sampleProductId);
  });

  // 4. Brands listing
  await test('GET /api/brands', async () => {
    const res = await fetch('http://localhost:5000/api/brands');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.brands), 'brands must be array');
    assert(data.brands.length >= 4, 'brands must have at least 4');
    console.log(`    Found ${data.brands.length} brands.`);
  });

  // 5. Admin Login
  let adminToken = null;
  await test('POST /api/auth/admin-login', async () => {
    const res = await fetch('http://localhost:5000/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cosmos.com', password: 'admin123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.token, 'token must be returned');
    assert.strictEqual(data.admin.email, 'admin@cosmos.com');
    adminToken = data.token;
  });

  // 6. User Login
  let userToken = null;
  await test('POST /api/auth/login', async () => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@cosmos.com', password: 'demo123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.token, 'token must be returned');
    assert.strictEqual(data.user.email, 'demo@cosmos.com');
    userToken = data.token;
  });

  // 7. Coupon application
  await test('POST /api/orders/apply-coupon (COSMOS20)', async () => {
    const res = await fetch('http://localhost:5000/api/orders/apply-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'COSMOS20', subtotal: 1000 })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.valid, true);
    assert.strictEqual(data.discount, 200);
    assert.strictEqual(data.finalTotal, 800);
  });

  // 8. User authenticated profile
  await test('GET /api/users/me', async () => {
    const res = await fetch('http://localhost:5000/api/users/me', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.email, 'demo@cosmos.com');
  });

  // 9. Admin listing all orders
  await test('GET /api/orders (admin)', async () => {
    const res = await fetch('http://localhost:5000/api/orders', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.orders));
  });

  // 10. Admin redirect test
  await test('GET /admin (redirect to /admin/login.html)', async () => {
    const res = await fetch('http://localhost:5000/admin', { redirect: 'manual' });
    assert([301, 302].includes(res.status), `Expected 301/302 redirect, got ${res.status}`);
    const location = res.headers.get('location');
    assert(location.includes('/admin/login.html'), `Redirect target should be login.html, got ${location}`);
  });

  // 11. Static brand image loading
  await test('GET /assets/brands/luna-threads.svg', async () => {
    const res = await fetch('http://localhost:5000/assets/brands/luna-threads.svg');
    assert.strictEqual(res.status, 200);
    assert(res.headers.get('content-type').includes('svg'));
  });

  // 12. Static product image loading
  await test('GET /assets/products/denim-jacket.svg', async () => {
    const res = await fetch('http://localhost:5000/assets/products/denim-jacket.svg');
    assert.strictEqual(res.status, 200);
    assert(res.headers.get('content-type').includes('svg'));
  });

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runTests();
