const request = require('supertest');
const express = require('express');
const grnRoutes = require('../routes/grnRoutes');
const GRN = require('../models/GRN');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/grn', grnRoutes);

jest.mock('../models/GRN');
jest.mock('../models/PurchaseOrder');
jest.mock('../models/Product');
jest.mock('../models/User');

const mockAdminToken = jwt.sign({ id: '67cb1a40001' }, process.env.JWT_SECRET || 'super_secret_jwt_erp_key_2026_xyz');

describe('GRN and Inventory Integration', () => {
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

  it('should create GRN against PurchaseOrder and increase product stock', async () => {
    const mockPO = {
      _id: 'po123',
      poNumber: 'PO-20261101-0001',
      supplier: 'sup123',
      status: 'Issued',
      save: jest.fn().mockResolvedValue(true)
    };
    PurchaseOrder.findById.mockResolvedValue(mockPO);

    const mockProduct = {
      _id: 'prod123',
      title: 'Titanium Rod 20mm',
      SKU: 'ROD-TI-20',
      stock: 10,
      save: jest.fn().mockResolvedValue(true)
    };
    Product.findById.mockResolvedValue(mockProduct);

    GRN.countDocuments.mockResolvedValue(0);
    GRN.create.mockResolvedValue({
      _id: 'grn123',
      grnNumber: 'GRN-20261101-0001',
      purchaseOrder: 'po123',
      supplier: 'sup123'
    });

    GRN.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'grn123',
            grnNumber: 'GRN-20261101-0001',
            status: 'Completed'
          })
        })
      })
    });

    const res = await request(app)
      .post('/api/grn')
      .set('Authorization', `Bearer ${mockAdminToken}`)
      .send({
        purchaseOrderId: 'po123',
        deliveryNoteNumber: 'DN-TEST-999',
        receivedItems: [
          {
            product: 'prod123',
            orderedQuantity: 30,
            receivedQuantity: 30,
            unitCost: 100,
            remarks: 'All received perfectly'
          }
        ]
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    // Stock increment verified: 10 + 30 = 40
    expect(mockProduct.stock).toBe(40);
    expect(mockProduct.save).toHaveBeenCalled();
    // PO updated to Received
    expect(mockPO.status).toBe('Received');
    expect(mockPO.save).toHaveBeenCalled();
  });
});
