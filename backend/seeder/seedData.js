const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const GRN = require('../models/GRN');
const Invoice = require('../models/Invoice');

const seedInitialData = async () => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('[Seeder] Database already contains records. Skipping auto-seed.');
      return;
    }

    console.log('[Seeder] Seeding initial ERP business data...');

    // 1. Users
    const users = await User.create([
      {
        name: 'Alex Rivera (Admin)',
        email: 'admin@erp.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Sarah Connor (Sales Manager)',
        email: 'sales@erp.com',
        password: 'sales123',
        role: 'sales'
      },
      {
        name: 'Marcus Vance (Procurement)',
        email: 'purchase@erp.com',
        password: 'purchase123',
        role: 'purchase'
      },
      {
        name: 'Elena Rostova (Warehouse Head)',
        email: 'inventory@erp.com',
        password: 'inventory123',
        role: 'inventory'
      }
    ]);

    const adminUser = users[0];
    const salesUser = users[1];
    const purchaseUser = users[2];
    const inventoryUser = users[3];

    // 2. Products
    const products = await Product.create([
      {
        title: 'Precision CNC Milling Bit (10mm)',
        SKU: 'PRD-CNC-001',
        category: 'Industrial Tools',
        description: 'Tungsten carbide precision bit for heavy industrial cutting.',
        price: 85.00,
        costPrice: 42.00,
        stock: 50,
        reorderLevel: 15,
        unit: 'Pieces'
      },
      {
        title: 'Hydraulic Pressure Valve HP-400',
        SKU: 'PRD-HYD-002',
        category: 'Hydraulics',
        description: 'High-durability stainless steel pressure relief valve.',
        price: 240.00,
        costPrice: 130.00,
        stock: 8, // Low stock!
        reorderLevel: 12,
        unit: 'Units'
      },
      {
        title: 'Digital Thermal Sensor Module',
        SKU: 'PRD-SNS-003',
        category: 'Electronics',
        description: 'IoT-compatible wireless temperature and humidity sensor.',
        price: 65.00,
        costPrice: 28.00,
        stock: 120,
        reorderLevel: 25,
        unit: 'Pieces'
      },
      {
        title: 'Industrial Heavy Duty Lubricant (20L)',
        SKU: 'PRD-LUB-004',
        category: 'Raw Materials',
        description: 'Synthetic high-temperature machinery lubricant drum.',
        price: 110.00,
        costPrice: 65.00,
        stock: 22,
        reorderLevel: 10,
        unit: 'Drums'
      },
      {
        title: 'Optical Laser Distance Gauge',
        SKU: 'PRD-OPT-005',
        category: 'Electronics',
        description: 'High-precision laser distance meter for plant inspections.',
        price: 320.00,
        costPrice: 195.00,
        stock: 3, // Low stock!
        reorderLevel: 5,
        unit: 'Units'
      },
      {
        title: 'Steel Reinforced Conveyor Belt (50m)',
        SKU: 'PRD-BELT-006',
        category: 'Machinery Parts',
        description: 'Abrasion-resistant rubber conveyor belt with inner wire mesh.',
        price: 890.00,
        costPrice: 520.00,
        stock: 14,
        reorderLevel: 5,
        unit: 'Rolls'
      },
      {
        title: 'Pneumatic Actuator Cylinder 50x200',
        SKU: 'PRD-PNE-007',
        category: 'Pneumatics',
        description: 'Double acting pneumatic cylinder with magnetic ring.',
        price: 175.00,
        costPrice: 95.00,
        stock: 0, // Out of stock!
        reorderLevel: 8,
        unit: 'Pieces'
      },
      {
        title: 'Safety Eye Protection Goggles (Pack of 10)',
        SKU: 'PRD-SFT-008',
        category: 'Safety & PPE',
        description: 'Anti-fog UV400 certified industrial workshop goggles.',
        price: 45.00,
        costPrice: 18.00,
        stock: 85,
        reorderLevel: 20,
        unit: 'Packs'
      }
    ]);

    // 3. Customers
    const customers = await Customer.create([
      {
        name: 'David Sterling',
        company: 'Sterling Aerospace Components',
        email: 'david@sterlingaero.com',
        phone: '+1 (555) 234-5678',
        address: {
          street: '742 Aviation Way',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'USA'
        },
        notes: 'Priority aerospace client. Prefers Net 30.'
      },
      {
        name: 'Rachel Green',
        company: 'Apex Robotics Inc.',
        email: 'rachel@apexrobotics.io',
        phone: '+1 (555) 345-6789',
        address: {
          street: '100 Innovation Blvd',
          city: 'San Jose',
          state: 'CA',
          postalCode: '95112',
          country: 'USA'
        },
        notes: 'High-frequency order cadence for electronic sensors.'
      },
      {
        name: 'Thomas Wright',
        company: 'Wright Automotive & Machine',
        email: 'twright@wrightauto.com',
        phone: '+1 (555) 456-7890',
        address: {
          street: '88 Industrial Parkway',
          city: 'Detroit',
          state: 'MI',
          postalCode: '48201',
          country: 'USA'
        },
        notes: 'Monthly bulk lubricant and hydraulic orders.'
      },
      {
        name: 'Linda Martinez',
        company: 'Horizon Renewable Energy',
        email: 'l.martinez@horizonclean.org',
        phone: '+1 (555) 567-8901',
        address: {
          street: '45 Sunstone Rd',
          city: 'Denver',
          state: 'CO',
          postalCode: '80202',
          country: 'USA'
        }
      }
    ]);

    // 4. Suppliers
    const suppliers = await Supplier.create([
      {
        name: 'Vanguard Industrial Supply Corp',
        company: 'Vanguard Industrial',
        email: 'procurement@vanguardindustrial.com',
        phone: '+1 (555) 890-1234',
        paymentTerms: 'Net 30',
        address: {
          street: '500 Foundry Ave',
          city: 'Pittsburgh',
          state: 'PA',
          postalCode: '15201',
          country: 'USA'
        },
        notes: 'Direct manufacturer of valves and cutting bits.'
      },
      {
        name: 'Precision Sensor Tech Ltd',
        company: 'Precision Sensors',
        email: 'orders@precisionsensors.co',
        phone: '+1 (555) 901-2345',
        paymentTerms: 'Net 15',
        address: {
          street: '12 Silicon Alley',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA'
        },
        notes: 'Key electronics sensor partner.'
      },
      {
        name: 'Global Petrochemicals & Lubricants',
        company: 'Global Petro Chem',
        email: 'sales@globalpetrochem.com',
        phone: '+1 (555) 012-3456',
        paymentTerms: 'Net 45',
        address: {
          street: '330 Refinery Blvd',
          city: 'Houston',
          state: 'TX',
          postalCode: '77002',
          country: 'USA'
        }
      }
    ]);

    // 5. Purchase Orders
    const po1 = await PurchaseOrder.create({
      poNumber: 'PO-20261101-0001',
      supplier: suppliers[0]._id,
      items: [
        {
          product: products[0]._id,
          title: products[0].title,
          SKU: products[0].SKU,
          quantity: 40,
          unitCost: products[0].costPrice,
          subtotal: 40 * products[0].costPrice
        },
        {
          product: products[1]._id,
          title: products[1].title,
          SKU: products[1].SKU,
          quantity: 20,
          unitCost: products[1].costPrice,
          subtotal: 20 * products[1].costPrice
        }
      ],
      totalCost: (40 * products[0].costPrice) + (20 * products[1].costPrice),
      status: 'Received',
      expectedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdBy: purchaseUser._id,
      notes: 'Urgent restocking order for manufacturing line.'
    });

    const po2 = await PurchaseOrder.create({
      poNumber: 'PO-20261105-0002',
      supplier: suppliers[1]._id,
      items: [
        {
          product: products[2]._id,
          title: products[2].title,
          SKU: products[2].SKU,
          quantity: 50,
          unitCost: products[2].costPrice,
          subtotal: 50 * products[2].costPrice
        }
      ],
      totalCost: 50 * products[2].costPrice,
      status: 'Issued',
      expectedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: purchaseUser._id,
      notes: 'Scheduled monthly sensor resupply.'
    });

    // 6. Goods Receipt Note (GRN) linked to PO1
    const grn1 = await GRN.create({
      grnNumber: 'GRN-20261102-0001',
      purchaseOrder: po1._id,
      supplier: suppliers[0]._id,
      deliveryNoteNumber: 'DN-VAN-98214',
      receivedItems: [
        {
          product: products[0]._id,
          title: products[0].title,
          SKU: products[0].SKU,
          orderedQuantity: 40,
          receivedQuantity: 40,
          unitCost: products[0].costPrice,
          remarks: 'All 40 units verified and inspected.'
        },
        {
          product: products[1]._id,
          title: products[1].title,
          SKU: products[1].SKU,
          orderedQuantity: 20,
          receivedQuantity: 20,
          unitCost: products[1].costPrice,
          remarks: 'Pressure tests passed.'
        }
      ],
      receivedBy: inventoryUser._id,
      status: 'Completed',
      notes: 'Shipment arrived in excellent condition at Dock 3.'
    });

    // 7. Sales Orders
    const so1Subtotal = (10 * products[0].price) + (2 * products[5].price);
    const so1Tax = so1Subtotal * 0.08;
    const so1Total = so1Subtotal + so1Tax;

    const so1 = await SalesOrder.create({
      orderNumber: 'SO-20261102-0001',
      customer: customers[0]._id,
      items: [
        {
          product: products[0]._id,
          title: products[0].title,
          SKU: products[0].SKU,
          quantity: 10,
          unitPrice: products[0].price,
          subtotal: 10 * products[0].price
        },
        {
          product: products[5]._id,
          title: products[5].title,
          SKU: products[5].SKU,
          quantity: 2,
          unitPrice: products[5].price,
          subtotal: 2 * products[5].price
        }
      ],
      subtotal: so1Subtotal,
      taxRate: 8,
      taxAmount: so1Tax,
      discount: 0,
      totalPrice: so1Total,
      status: 'Delivered',
      paymentStatus: 'Paid',
      isInvoiced: true,
      createdBy: salesUser._id,
      notes: 'Shipped via Express Freight.'
    });

    const so2Subtotal = (15 * products[2].price) + (1 * products[4].price);
    const so2Tax = so2Subtotal * 0.08;
    const so2Total = so2Subtotal + so2Tax;

    const so2 = await SalesOrder.create({
      orderNumber: 'SO-20261104-0002',
      customer: customers[1]._id,
      items: [
        {
          product: products[2]._id,
          title: products[2].title,
          SKU: products[2].SKU,
          quantity: 15,
          unitPrice: products[2].price,
          subtotal: 15 * products[2].price
        },
        {
          product: products[4]._id,
          title: products[4].title,
          SKU: products[4].SKU,
          quantity: 1,
          unitPrice: products[4].price,
          subtotal: 1 * products[4].price
        }
      ],
      subtotal: so2Subtotal,
      taxRate: 8,
      taxAmount: so2Tax,
      discount: 50,
      totalPrice: so2Total - 50,
      status: 'Confirmed',
      paymentStatus: 'Unpaid',
      isInvoiced: true,
      createdBy: salesUser._id,
      notes: 'Client requested invoice for accounting department.'
    });

    // 8. Invoices linked to Sales Orders
    const inv1 = await Invoice.create({
      invoiceNumber: 'INV-20261102-0001',
      salesOrder: so1._id,
      customer: customers[0]._id,
      items: so1.items.map(i => ({
        product: i.product,
        title: i.title,
        SKU: i.SKU,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal
      })),
      subtotal: so1.subtotal,
      taxRate: 8,
      taxAmount: so1.taxAmount,
      discount: 0,
      totalAmount: so1.totalPrice,
      status: 'Paid',
      paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paymentMethod: 'Bank Transfer',
      issuedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      createdBy: salesUser._id
    });

    const inv2 = await Invoice.create({
      invoiceNumber: 'INV-20261104-0002',
      salesOrder: so2._id,
      customer: customers[1]._id,
      items: so2.items.map(i => ({
        product: i.product,
        title: i.title,
        SKU: i.SKU,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal
      })),
      subtotal: so2.subtotal,
      taxRate: 8,
      taxAmount: so2.taxAmount,
      discount: 50,
      totalAmount: so2.totalPrice,
      status: 'Unpaid',
      issuedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdBy: salesUser._id
    });

    so1.invoiceId = inv1._id;
    await so1.save();

    so2.invoiceId = inv2._id;
    await so2.save();

    console.log('[Seeder] Initial ERP business data successfully seeded!');
  } catch (err) {
    console.error('[Seeder Error] Error during seeding:', err.message);
  }
};

module.exports = { seedInitialData };

