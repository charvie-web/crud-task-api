const { DatabaseSync } = require("node:sqlite");

function getReportData() {
  const db = new DatabaseSync("report.db");

  const totals = db.prepare(`
    SELECT
      COUNT(*) AS totalOrders,
      ROUND(SUM(amount), 2) AS totalRevenue
    FROM orders
  `).get();

  const topProducts = db.prepare(`
    SELECT
      product,
      COUNT(*) AS totalOrders,
      ROUND(SUM(amount), 2) AS revenue
    FROM orders
    GROUP BY product
    ORDER BY revenue DESC
    LIMIT 5
  `).all();

  const ordersPerDay = db.prepare(`
    SELECT
      DATE(created_at) AS day,
      COUNT(*) AS totalOrders
    FROM orders
    WHERE DATE(created_at) >= DATE('now', '-6 days')
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `).all();

  db.close();

  return { totals, topProducts, ordersPerDay };
}

module.exports = { getReportData };
