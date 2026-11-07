const Product = require('../models/Product');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const GRN = require('../models/GRN');

// @desc    Get dashboard metrics & chart data
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalSalesOrders,
      totalPurchaseOrders,
      totalInvoices,
      totalGRNs
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments(),
      Supplier.countDocuments(),
      SalesOrder.countDocuments(),
      PurchaseOrder.countDocuments(),
      Invoice.countDocuments(),
      GRN.countDocuments()
    ]);

    // Low stock count & list
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).select('title SKU stock reorderLevel category price').limit(5);

    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    });

    // Revenue calculations
    const revenueAggregate = await SalesOrder.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].total : 0;

    // Purchase cost calculations
    const purchaseCostAggregate = await PurchaseOrder.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalPurchaseCost = purchaseCostAggregate.length > 0 ? purchaseCostAggregate[0].total : 0;

    // Monthly revenue & expense chart data (past 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [salesMonthly, purchaseMonthly] = await Promise.all([
        SalesOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: d, $lt: nextMonth },
              status: { $ne: 'Cancelled' }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        PurchaseOrder.aggregate([
          {
            $match: {
              createdAt: { $gte: d, $lt: nextMonth },
              status: { $ne: 'Cancelled' }
            }
          },
          { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ])
      ]);

      const salesAmount = salesMonthly.length > 0 ? salesMonthly[0].total : 0;
      const purchaseAmount = purchaseMonthly.length > 0 ? purchaseMonthly[0].total : 0;

      monthlyData.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        sales: Math.round(salesAmount),
        purchases: Math.round(purchaseAmount),
        profit: Math.round(salesAmount - purchaseAmount)
      });
    }

    // Category distribution
    const categoryDistribution = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } },
      { $project: { category: '$_id', count: 1, totalStock: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Order status breakdown
    const orderStatuses = await SalesOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    // Recent Sales Orders
    const recentOrders = await SalesOrder.find()
      .populate('customer', 'name company')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent GRNs
    const recentGRNs = await GRN.find()
      .populate('supplier', 'name company')
      .populate('purchaseOrder', 'poNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalPurchaseCost,
          netMargin: totalRevenue - totalPurchaseCost,
          totalProducts,
          totalCustomers,
          totalSuppliers,
          totalSalesOrders,
          totalPurchaseOrders,
          totalInvoices,
          totalGRNs,
          lowStockCount
        },
        monthlyData,
        categoryDistribution,
        orderStatuses,
        lowStockProducts,
        recentOrders,
        recentGRNs
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats
};
