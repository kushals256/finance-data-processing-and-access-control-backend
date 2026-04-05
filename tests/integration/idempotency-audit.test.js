require("../setup");
const request = require('supertest');
const app = require('../../src/app');

describe('Idempotency Middleware', () => {
  let adminToken;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    adminToken = res.body.data.token;
  });

  it('should allow record creation without idempotency key', async () => {
    const res = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-15' });

    expect(res.status).toBe(201);
  });

  it('should return same response for duplicate idempotency key', async () => {
    const key = 'unique-key-123';

    const res1 = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 500, type: 'income', category: 'Salary', date: '2025-01-15' });

    expect(res1.status).toBe(201);

    // Same key should return cached response
    const res2 = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: 500, type: 'income', category: 'Salary', date: '2025-01-15' });

    expect(res2.status).toBe(201);
    expect(res2.body.data.record._id).toBe(res1.body.data.record._id);
  });

  it('should create different records for different keys', async () => {
    const res1 = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', 'key-1')
      .send({ amount: 100, type: 'income', category: 'Salary', date: '2025-01-15' });

    const res2 = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', 'key-2')
      .send({ amount: 200, type: 'expense', category: 'Food', date: '2025-01-16' });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.data.record._id).not.toBe(res2.body.data.record._id);
  });
});

describe('Audit Trail', () => {
  let adminToken;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    adminToken = res.body.data.token;
  });

  it('should create audit log on record creation', async () => {
    await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-15' });

    const res = await request(app)
      .get('/api/v1/dashboard/audit-logs?action=CREATE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].action).toBe('CREATE');
    expect(res.body.data[0].entity).toBe('FinancialRecord');
  });

  it('should create audit log on record update', async () => {
    const createRes = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-15' });

    const id = createRes.body.data.record._id;

    await request(app)
      .patch(`/api/v1/records/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 200 });

    const res = await request(app)
      .get('/api/v1/dashboard/audit-logs?action=UPDATE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const updateLog = res.body.data.find((l) => l.action === 'UPDATE');
    expect(updateLog).toBeDefined();
    expect(updateLog.before).toBeDefined();
    expect(updateLog.after).toBeDefined();
  });

  it('should create audit log on record soft-delete', async () => {
    const createRes = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'income', category: 'Test', date: '2025-01-15' });

    const id = createRes.body.data.record._id;

    await request(app)
      .delete(`/api/v1/records/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get('/api/v1/dashboard/audit-logs?action=SOFT_DELETE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
