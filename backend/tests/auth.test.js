const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api', authRoutes);

jest.mock('../models/User');

describe('Auth Endpoints (POST /api/register & POST /api/login)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    User.findOne.mockResolvedValue(null);
    User.countDocuments.mockResolvedValue(0);
    User.create.mockResolvedValue({
      _id: '67cb1a40001',
      name: 'Test Admin',
      email: 'testadmin@erp.com',
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Test Admin',
        email: 'testadmin@erp.com',
        password: 'password123',
        role: 'admin'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('testadmin@erp.com');
  });

  it('should reject registration if email is duplicate', async () => {
    User.findOne.mockResolvedValue({ _id: '123', email: 'dup@erp.com' });

    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Existing User',
        email: 'dup@erp.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate user and return token on valid login', async () => {
    const mockUser = {
      _id: '67cb1a40002',
      name: 'Login User',
      email: 'login@erp.com',
      role: 'sales',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'login@erp.com',
        password: 'mypassword'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@erp.com');
  });

  it('should reject invalid credentials with 401', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'nobody@erp.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
