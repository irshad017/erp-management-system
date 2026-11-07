require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { seedInitialData } = require('./seedData');

const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const GRN = require('../models/GRN');
const Invoice = require('../models/Invoice');

const runSeeder = async () => {
  try {
    await connectDB();

    console.log('[Seeder CLI] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      SalesOrder.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      GRN.deleteMany({}),
      Invoice.deleteMany({})
    ]);

    await seedInitialData();

    console.log('[Seeder CLI] Finished. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder CLI Error]:', err);
    process.exit(1);
  }
};

runSeeder();
