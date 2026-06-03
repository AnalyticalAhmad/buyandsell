const Product = require("../models/Product");
const User = require("../models/User");

async function getDashboardStats(req, res, next) {
  try {
    const [productCount, userCount] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: "user" }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders: 0,
        totalProducts: productCount,
        totalUsers: userCount,
        totalRevenue: 0,
        orderChange: 0,
        productChange: 0,
        userChange: 0,
        revenueChange: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardStats };
