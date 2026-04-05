const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Finance Dashboard API',
    version: '1.0.0',
    description:
      'A comprehensive Finance Data Processing and Access Control Backend with RBAC, audit trails, anomaly detection, idempotency keys, bulk CSV import, and MongoDB aggregation pipelines.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/v1`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
          correlationId: { type: 'string' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer', example: 1 },
          totalPages: { type: 'integer', example: 10 },
          totalItems: { type: 'integer', example: 100 },
          limit: { type: 'integer', example: 10 },
          hasNextPage: { type: 'boolean' },
          hasPrevPage: { type: 'boolean' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'john@example.com' },
          role: { type: 'string', enum: ['viewer', 'analyst', 'admin'] },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FinancialRecord: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          amount: { type: 'number', example: 1500.5 },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string', example: 'Salary' },
          date: { type: 'string', format: 'date' },
          description: { type: 'string' },
          notes: { type: 'string' },
          createdBy: { type: 'string' },
          flags: { type: 'array', items: { type: 'string' } },
          isDeleted: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'LOGIN', 'EXPORT', 'IMPORT'] },
          entity: { type: 'string' },
          entityId: { type: 'string' },
          performedBy: { type: 'string' },
          correlationId: { type: 'string' },
          before: { type: 'object' },
          after: { type: 'object' },
          metadata: { type: 'object' },
          ipAddress: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
