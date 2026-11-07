const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SkyBrisk ERP Management System API',
    version: '1.0.0',
    description: 'Enterprise Resource Planning REST API built with Node.js, Express, MongoDB & JWT authentication.',
    contact: {
      name: 'Abdur Rahman',
      email: 'irshadhussain7881@gmail.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/api/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Sarah Connor' },
                  email: { type: 'string', example: 'sarah@erp.com' },
                  password: { type: 'string', example: 'secret123' },
                  role: { type: 'string', enum: ['admin', 'sales', 'purchase', 'inventory'], example: 'sales' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User successfully registered' },
          400: { description: 'Bad request or email already exists' }
        }
      }
    },
    '/api/login': {
      post: {
        summary: 'Login user and obtain JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@erp.com' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/users': {
      get: {
        summary: 'Get all users (Admin only)',
        tags: ['Users & Admin'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of users' },
          403: { description: 'Forbidden - requires admin role' }
        }
      }
    },
    '/api/products': {
      get: {
        summary: 'Get products with pagination & search',
        tags: ['Products'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['low', 'in', 'out'] } }
        ],
        responses: { 200: { description: 'Products retrieved' } }
      },
      post: {
        summary: 'Create a new product',
        tags: ['Products'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'SKU', 'price'],
                properties: {
                  title: { type: 'string', example: 'Industrial Sensor Pro X1' },
                  SKU: { type: 'string', example: 'SNS-PRO-01' },
                  category: { type: 'string', example: 'Electronics' },
                  price: { type: 'number', example: 149.99 },
                  costPrice: { type: 'number', example: 85.00 },
                  stock: { type: 'number', example: 45 },
                  reorderLevel: { type: 'number', example: 10 }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Product created' } }
      }
    },
    '/api/customers': {
      get: {
        summary: 'Get customers directory',
        tags: ['Customers'],
        responses: { 200: { description: 'Customers retrieved' } }
      },
      post: {
        summary: 'Add new customer',
        tags: ['Customers'],
        responses: { 201: { description: 'Customer created' } }
      }
    },
    '/api/suppliers': {
      get: {
        summary: 'Get suppliers directory',
        tags: ['Suppliers'],
        responses: { 200: { description: 'Suppliers retrieved' } }
      },
      post: {
        summary: 'Add new supplier',
        tags: ['Suppliers'],
        responses: { 201: { description: 'Supplier created' } }
      }
    },
    '/api/sales-orders': {
      get: {
        summary: 'Get sales orders',
        tags: ['Sales Orders'],
        responses: { 200: { description: 'Sales orders retrieved' } }
      },
      post: {
        summary: 'Create sales order',
        tags: ['Sales Orders'],
        responses: { 201: { description: 'Sales order created' } }
      }
    },
    '/api/purchase-orders': {
      get: {
        summary: 'Get purchase orders',
        tags: ['Purchase Orders'],
        responses: { 200: { description: 'Purchase orders retrieved' } }
      },
      post: {
        summary: 'Create purchase order',
        tags: ['Purchase Orders'],
        responses: { 201: { description: 'Purchase order created' } }
      }
    },
    '/api/grn': {
      get: {
        summary: 'Get Goods Receipt Notes',
        tags: ['GRN'],
        responses: { 200: { description: 'GRNs retrieved' } }
      },
      post: {
        summary: 'Create GRN and auto-update product inventory stock',
        tags: ['GRN'],
        responses: { 201: { description: 'GRN created and stock updated' } }
      }
    },
    '/api/invoices': {
      get: {
        summary: 'Get invoices list',
        tags: ['Invoices'],
        responses: { 200: { description: 'Invoices retrieved' } }
      },
      post: {
        summary: 'Generate invoice from sales order or custom items',
        tags: ['Invoices'],
        responses: { 201: { description: 'Invoice created' } }
      }
    },
    '/api/dashboard/stats': {
      get: {
        summary: 'Get aggregated ERP business dashboard KPIs and chart data',
        tags: ['Dashboard Analytics'],
        responses: { 200: { description: 'Dashboard metrics retrieved' } }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = { setupSwagger, swaggerDocument };

