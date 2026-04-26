// Quick test script for POST endpoints (avoids Windows curl JSON escaping issues)
const BASE = 'http://localhost:5000/api';
const ADMIN_ID = '5dc7ac90-c08b-4be4-a9aa-32d83cfbec28';
const ANALYST_ID = '4e3013bb-51e8-4a53-8fd2-c010882c2df5';
const VIEWER_ID = 'c7f1e39b-7cf9-4d92-a783-924a657a319e';

const headers = (userId: string) => ({
  'Content-Type': 'application/json',
  'x-user-id': userId,
});

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

async function run() {
  console.log('\n🧪 Testing Finance Backend API\n');

  // 1. Health Check
  await test('Health check returns 200', async () => {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    if (!data.success) throw new Error('Health check failed');
  });

  // 2. Auth - no header
  await test('No auth header returns 401', async () => {
    const res = await fetch(`${BASE}/users`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 2b. Auth - login
  let jwtToken = '';
  await test('POST /auth/login generates token', async () => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@zorvyn.com' })
    });
    const data = await res.json();
    if (!data.success || !data.data?.token) throw new Error('Missing token in response');
    jwtToken = data.data.token;
  });

  // Modify headers to use JWT for subsequent requests if available (or use legacy x-user-id for simplicity in this script, wait, we'll test JWT directly)
  const jwtHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`,
  };

  await test('GET /users with JWT returns user list', async () => {
    const res = await fetch(`${BASE}/users`, { headers: jwtHeaders });
    const data = await res.json();
    if (!data.success) throw new Error('JWT Authentication failed');
  });

  // 3. Users - list
  await test('GET /users returns user list', async () => {
    const res = await fetch(`${BASE}/users`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data) || data.data.length < 3) throw new Error(`Expected 3+ users, got ${data.data?.length}`);
  });

  // 4. Users - create (ADMIN)
  await test('POST /users creates user (ADMIN)', async () => {
    const res = await fetch(`${BASE}/users`, {
      method: 'POST',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ email: `test-${Date.now()}@zorvyn.com`, name: 'Test User', role: 'VIEWER' }),
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
  });

  // 5. Users - create (VIEWER should fail)
  await test('POST /users blocked for VIEWER (403)', async () => {
    const res = await fetch(`${BASE}/users`, {
      method: 'POST',
      headers: headers(VIEWER_ID),
      body: JSON.stringify({ email: 'fail@zorvyn.com', name: 'Fail', role: 'VIEWER' }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 17. Security: IDOR - VIEWER trying to delete ADMIN record
  await test('Security: IDOR - VIEWER cannot delete ADMIN record (403)', async () => {
    // Get an admin record ID
    const adminRes = await fetch(`${BASE}/records?limit=1`, { headers: headers(ADMIN_ID) });
    const adminData = await adminRes.json();
    const adminRecordId = adminData.data.records[0].id;

    // Try to delete it as Viewer — VIEWER role is blocked at middleware level (403)
    const res = await fetch(`${BASE}/records/${adminRecordId}`, { 
      method: 'DELETE',
      headers: headers(VIEWER_ID) 
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 18. Security: Mass Assignment - Change owner
  await test('Security: Mass Assignment - cannot inject userId into update', async () => {
    // Create a record as ADMIN (POST /records requires ADMIN role)
    const createRes = await fetch(`${BASE}/records`, {
      method: 'POST',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ amount: 10, type: 'EXPENSE', category: 'Safe', date: '2026-04-04T00:00:00.000Z' })
    });
    const createData = await createRes.json();
    const recordId = createData.data.id;

    // Attempt to inject a different userId via PUT — should be ignored by service
    const updateRes = await fetch(`${BASE}/records/${recordId}`, {
      method: 'PUT',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ userId: VIEWER_ID })
    });
    const updateData = await updateRes.json();
    // The userId in the record should still belong to ADMIN, not VIEWER
    if (updateData.data && updateData.data.userId === VIEWER_ID) throw new Error('VULNERABILITY: Ownership stolen via Mass Assignment!');
  });

  // 6. Users - validation error
  await test('POST /users with bad email returns 400', async () => {
    const res = await fetch(`${BASE}/users`, {
      method: 'POST',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ email: 'not-an-email', name: 'X' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 7. Records - create (ADMIN)
  await test('POST /records creates record (ADMIN)', async () => {
    const res = await fetch(`${BASE}/records`, {
      method: 'POST',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ amount: 999, type: 'INCOME', category: 'Bonus', date: '2026-04-04T00:00:00.000Z', notes: 'API test' }),
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
  });

  // 8. Records - create blocked for ANALYST
  await test('POST /records blocked for ANALYST (403)', async () => {
    const res = await fetch(`${BASE}/records`, {
      method: 'POST',
      headers: headers(ANALYST_ID),
      body: JSON.stringify({ amount: 100, type: 'INCOME', category: 'Test', date: '2026-04-04T00:00:00.000Z' }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 9. Records - validation (negative amount)
  await test('POST /records with negative amount returns 400', async () => {
    const res = await fetch(`${BASE}/records`, {
      method: 'POST',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ amount: -50, type: 'INCOME', category: 'Bad', date: '2026-04-04T00:00:00.000Z' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 10. Records - validation (bad type)
  await test('POST /records with invalid type returns 400', async () => {
    const res = await fetch(`${BASE}/records`, {
      method: 'POST',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ amount: 100, type: 'SALARY', category: 'Test', date: '2026-04-04T00:00:00.000Z' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 11. Records - list with pagination
  await test('GET /records returns paginated results', async () => {
    const res = await fetch(`${BASE}/records?limit=5`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    if (!data.data?.pagination) throw new Error('Missing pagination metadata');
    if (data.data.records.length > 5) throw new Error(`Expected max 5, got ${data.data.records.length}`);
    if (data.data.pagination.nextCursor === undefined) throw new Error('Missing nextCursor in pagination');
  });

  // 12. Records - filter by type
  await test('GET /records?type=EXPENSE filters correctly', async () => {
    const res = await fetch(`${BASE}/records?type=EXPENSE`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    const allExpense = data.data.records.every((r: any) => r.type === 'EXPENSE');
    if (!allExpense) throw new Error('Non-EXPENSE record found in filtered results');
  });

  // 12b. Records - search filter
  await test('GET /records?search=Rent filters correctly', async () => {
    const res = await fetch(`${BASE}/records?search=Rent`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    const hasSearchTerm = data.data.records.every((r: any) => 
      r.category.toLowerCase().includes('rent') || (r.notes && r.notes.toLowerCase().includes('rent'))
    );
    if (!hasSearchTerm) throw new Error('Record found without search term');
  });

  // 13. Records - VIEWER blocked
  await test('GET /records blocked for VIEWER (403)', async () => {
    const res = await fetch(`${BASE}/records`, { headers: headers(VIEWER_ID) });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 14. Analytics - summary
  await test('GET /analytics/summary returns aggregated data', async () => {
    const res = await fetch(`${BASE}/analytics/summary`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    if (data.data.totalIncome === undefined) throw new Error('Missing totalIncome');
    if (data.data.recentActivity === undefined) throw new Error('Missing recentActivity');
  });

  // 15. Analytics - breakdown
  await test('GET /analytics/breakdown returns category data', async () => {
    const res = await fetch(`${BASE}/analytics/breakdown`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    if (!Array.isArray(data.data)) throw new Error('Expected array');
  });

  // 16. Analytics - trends
  await test('GET /analytics/trends returns monthly data', async () => {
    const res = await fetch(`${BASE}/analytics/trends`, { headers: headers(ADMIN_ID) });
    const data = await res.json();
    if (!Array.isArray(data.data)) throw new Error('Expected array');
    if (!data.data[0]?.month) throw new Error('Missing month field');
  });

  // 17. Analytics - VIEWER blocked
  await test('GET /analytics/summary blocked for VIEWER (403)', async () => {
    const res = await fetch(`${BASE}/analytics/summary`, { headers: headers(VIEWER_ID) });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 18. User role update
  await test('PATCH /users/:id/role updates role (ADMIN)', async () => {
    const res = await fetch(`${BASE}/users/${VIEWER_ID}/role`, {
      method: 'PATCH',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ role: 'ANALYST' }),
    });
    const data = await res.json();
    if (data.data.role !== 'ANALYST') throw new Error(`Expected ANALYST, got ${data.data.role}`);
    // Revert
    await fetch(`${BASE}/users/${VIEWER_ID}/role`, {
      method: 'PATCH',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ role: 'VIEWER' }),
    });
  });

  // 19. User status toggle
  await test('PATCH /users/:id/status toggles status (ADMIN)', async () => {
    const res = await fetch(`${BASE}/users/${VIEWER_ID}/status`, {
      method: 'PATCH',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ isActive: false }),
    });
    const data = await res.json();
    if (data.data.isActive !== false) throw new Error('Expected isActive=false');
    // Revert
    await fetch(`${BASE}/users/${VIEWER_ID}/status`, {
      method: 'PATCH',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ isActive: true }),
    });
  });

  // 20. Inactive user blocked
  await test('Deactivated user is blocked (401)', async () => {
    // Deactivate first
    await fetch(`${BASE}/users/${VIEWER_ID}/status`, {
      method: 'PATCH',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ isActive: false }),
    });
    const res = await fetch(`${BASE}/users`, { headers: headers(VIEWER_ID) });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    // Revert
    await fetch(`${BASE}/users/${VIEWER_ID}/status`, {
      method: 'PATCH',
      headers: headers(ADMIN_ID),
      body: JSON.stringify({ isActive: true }),
    });
  });

  console.log('\n✅ All tests completed!\n');
}

run();
