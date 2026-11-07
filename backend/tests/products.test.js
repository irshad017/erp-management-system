const request = require('supertest');
const express = require('express');
const productRoutes = require('../routes/productRoutes');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

jest.mock('../models/Product');
jest.mock('../models/User');

const mockAdminToken = jwt.sign({ id: '67cb1a40001' }, process.env.JWT_SECRET || 'super_secret_jwt_erp_key_2026_xyz');

describe('Product CRUD Endpoints (/api/products)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: '67cb1a40001',
        name: 'Admin User',
        role: 'admin',
        isActive: true
      })
    });
  });

  it('should create a new product when authenticated as admin', async () => {
    Product.findOne.mockResolvedValue(null);
    Product.create.mockResolvedValue({
      _id: 'prod123',
      title: 'CNC Carbide Cutter',
      SKU: 'CNC-TEST-01',
      category: 'Tools',
      price: 120,
      stock: 25
    });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${mockAdminToken}`)
      .send({
        title: 'CNC Carbide Cutter',
        SKU: 'CNC-TEST-01',
        category: 'Tools',
        price: 120,
        costPrice: 60,
        stock: 25,
        reorderLevel: 5
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('CNC Carbide Cutter');
  });

  it('should fetch paginated products', async () => {
    Product.countDocuments.mockResolvedValue(1);
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([
            { _id: 'p1', title: 'Item A', SKU: 'SKU-A', price: 10, stock: 5 }
          ])
        })
      })
    });
    Product.distinct.mockResolvedValue(['General', 'Tools']);

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${mockAdminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Item A');
  });

  it('should prevent unauthorized access if token is missing', async () => {
    const res = await request(app)
      .get('/api/products');

    expect(res.statusCode).toEqual(401);
  });
});
