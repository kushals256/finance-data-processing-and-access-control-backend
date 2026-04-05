require("../setup");
const request = require('supertest');
const app = require('../../src/app');

describe('Dashboard Endpoints', () => {
  let adminToken;

  beforeEach(async () => {
    // Register admin
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
    adminToken = res.body.data.token;

    // Seed records
    const records = [
      { amount: 5000, type: 'income', category: 'Salary', date: '2025-01-15' },
      { amount: 3000, type: 'income', category: 'Freelance', date: '2025-01-20' },
      { amount: 800, type: 'expense', category: 'Food', date: '2025-01-22' },
      { amount: 1500, type: 'expense', category: 'Rent', date: '2025-01-25' },
      { amount: 200, type: 'expense', category: 'Food', date: '2025-02-01' },
      { amount: 4000, type: 'income', category: 'Salary', date: '2025-02-15' },
    ];

    for (const rec of records) {
      await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rec);
    }
  });

  describe('GET /api/v1/dashboard/summary', () => {
    it('should return correct income, expense, and net balance', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.income.total).toBe(12000);
      expect(res.body.data.expense.total).toBe(2500);
      expect(res.body.data.netBalance).toBe(9500);
      expect(res.body.data.totalRecords).toBe(6);
    });

    it('should support date range filtering', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary?startDate=2025-01-01&endDate=2025-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.income.total).toBe(8000);
    });
  });

  describe('GET /api/v1/dashboard/category-breakdown', () => {
    it('should return category-wise totals', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((cat) => {
        expect(cat.category).toBeDefined();
        expect(cat.total).toBeDefined();
        expect(cat.percentage).toBeDefined();
      });
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/category-breakdown?type=expense')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((cat) => {
        expect(cat.type).toBe('expense');
      });
    });
  });

  describe('GET /api/v1/dashboard/monthly-trends', () => {
    it('should return 12 months of data', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/monthly-trends?year=2025')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.year).toBe(2025);
      expect(res.body.data.months).toHaveLength(12);
      expect(res.body.data.months[0].monthName).toBe('January');
    });
  });

  describe('GET /api/v1/dashboard/recent-activity', () => {
    it('should return recent transactions', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/recent-activity?limit=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });
  });

  describe('GET /api/v1/dashboard/anomaly-stats', () => {
    it('should return anomaly statistics', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/anomaly-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalFlaggedRecords).toBeDefined();
      expect(res.body.data.flagBreakdown).toBeDefined();
    });
  });
});
