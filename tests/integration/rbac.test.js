require("../setup");
const request = require('supertest');
const app = require('../../src/app');

describe('RBAC Access Control', () => {
  let adminToken, analystToken, viewerToken;

  beforeEach(async () => {
    // Create users with different roles
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    adminToken = adminRes.body.data.token;

    const analystRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Analyst', email: 'analyst@test.com', password: 'Analyst@123', role: 'analyst' });
    analystToken = analystRes.body.data.token;

    const viewerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Viewer', email: 'viewer@test.com', password: 'Viewer@123', role: 'viewer' });
    viewerToken = viewerRes.body.data.token;

    // Create a record as admin for testing
    await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 1000,
        type: 'income',
        category: 'Salary',
        date: '2025-01-15',
        description: 'Test record',
      });
  });

  describe('Record Creation (Admin only)', () => {
    it('should allow admin to create records', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 500,
          type: 'expense',
          category: 'Food',
          date: '2025-01-20',
        });

      expect(res.status).toBe(201);
    });

    it('should deny analyst from creating records', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 500,
          type: 'expense',
          category: 'Food',
          date: '2025-01-20',
        });

      expect(res.status).toBe(403);
    });

    it('should deny viewer from creating records', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 500,
          type: 'expense',
          category: 'Food',
          date: '2025-01-20',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Record Viewing (All roles)', () => {
    it('should allow viewer to list records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow analyst to list records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Dashboard Access', () => {
    it('should allow viewer to access summary', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny viewer from category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow analyst to access category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny viewer from monthly trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-trends')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow analyst to access monthly trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-trends')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('User Management (Admin only)', () => {
    it('should allow admin to list users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny analyst from listing users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });

    it('should deny viewer from listing users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Audit Logs (Admin only)', () => {
    it('should allow admin to view audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny analyst from viewing audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/audit-logs')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Export (Analyst + Admin)', () => {
    it('should allow admin to export', async () => {
      const res = await request(app)
        .get('/api/v1/export/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow analyst to export', async () => {
      const res = await request(app)
        .get('/api/v1/export/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny viewer from exporting', async () => {
      const res = await request(app)
        .get('/api/v1/export/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
