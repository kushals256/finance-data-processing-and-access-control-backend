require("../setup");
const request = require('supertest');
const app = require('../../src/app');

describe('Financial Records Endpoints', () => {
  let adminToken;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    adminToken = res.body.data.token;
  });

  describe('POST /api/v1/records', () => {
    it('should create a record successfully', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1500.50,
          type: 'income',
          category: 'Salary',
          date: '2025-01-15',
          description: 'Monthly salary',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.record.amount).toBe(1500.5);
      expect(res.body.data.record.type).toBe('income');
      expect(res.body.data.record.flags).toBeDefined();
    });

    it('should reject negative amount', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -100, type: 'income', category: 'Test', date: '2025-01-15' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, type: 'invalid', category: 'Test', date: '2025-01-15' });

      expect(res.status).toBe(400);
    });

    it('should reject future dates', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
          type: 'income',
          category: 'Test',
          date: futureDate.toISOString(),
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/records', () => {
    beforeEach(async () => {
      // Create test records
      const records = [
        { amount: 1000, type: 'income', category: 'Salary', date: '2025-01-15' },
        { amount: 500, type: 'expense', category: 'Food', date: '2025-01-20' },
        { amount: 2000, type: 'income', category: 'Freelance', date: '2025-02-01' },
        { amount: 300, type: 'expense', category: 'Transport', date: '2025-02-10' },
        { amount: 150, type: 'expense', category: 'Food', date: '2025-02-15' },
      ];

      for (const rec of records) {
        await request(app)
          .post('/api/v1/records')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(rec);
      }
    });

    it('should return paginated records', async () => {
      const res = await request(app)
        .get('/api/v1/records?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.pagination.currentPage).toBe(1);
      expect(res.body.meta.pagination.totalItems).toBe(5);
      expect(res.body.meta.pagination.hasNextPage).toBe(true);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/v1/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((r) => expect(r.type).toBe('income'));
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get('/api/v1/records?category=Food')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get('/api/v1/records?startDate=2025-02-01&endDate=2025-02-28')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should sort records', async () => {
      const res = await request(app)
        .get('/api/v1/records?sortBy=amount&sortOrder=desc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const amounts = res.body.data.map((r) => r.amount);
      expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    });
  });

  describe('PATCH /api/v1/records/:id', () => {
    it('should update a record', async () => {
      const createRes = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, type: 'expense', category: 'Food', date: '2025-01-15' });

      const id = createRes.body.data.record._id;

      const res = await request(app)
        .patch(`/api/v1/records/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 200, category: 'Dining' });

      expect(res.status).toBe(200);
      expect(res.body.data.record.amount).toBe(200);
      expect(res.body.data.record.category).toBe('Dining');
    });
  });

  describe('DELETE /api/v1/records/:id', () => {
    it('should soft-delete a record', async () => {
      const createRes = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, type: 'expense', category: 'Food', date: '2025-01-15' });

      const id = createRes.body.data.record._id;

      const delRes = await request(app)
        .delete(`/api/v1/records/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Should not appear in normal listing
      const listRes = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`);

      const found = listRes.body.data.find((r) => r._id === id);
      expect(found).toBeUndefined();
    });

    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .delete('/api/v1/records/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
