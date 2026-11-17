const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const { getReportData } = require("./reportData");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function generatePdf(outputPath = "reports/test.pdf") {
  const data = getReportData();

  const topRows = data.topProducts.map(item => `
    <tr>
      <td>${escapeHTML(item.product)}</td>
      <td>${item.totalOrders}</td>
      <td>₹${item.revenue.toFixed(2)}</td>
    </tr>
  `).join("");

  const orderRows = data.allOrders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${escapeHTML(order.customer)}</td>
      <td>${escapeHTML(order.product)}</td>
      <td>₹${Number(order.amount).toFixed(2)}</td>
      <td>${escapeHTML(order.created_at.slice(0, 10))}</td>
    </tr>
  `).join("");

  const dailyRows = data.ordersPerDay.map(item => `
    <tr><td>${item.day}</td><td>${item.totalOrders}</td></tr>
  `).join("");

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Sales Report</title>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: Arial, sans-serif; color: #263238; }
      h1 { color: #17365d; margin-bottom: 5px; }
      h2 { color: #24527a; margin-top: 28px; }
      .date { color: #666; margin-bottom: 25px; }
      .summary { display: flex; gap: 20px; margin: 20px 0; }
      .metric { background: #edf3f8; padding: 16px; flex: 1; }
      .metric strong { display: block; font-size: 22px; margin-top: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #d5dce3; padding: 8px; text-align: left; font-size: 11px; }
      th { background: #17365d; color: white; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      .footer { margin-top: 25px; color: #777; font-size: 10px; }
    </style>
  </head>
  <body>
    <h1>Sales Performance Report</h1>
    <p class="date">Generated on ${new Date().toLocaleDateString("en-IN")}</p>

    <div class="summary">
      <div class="metric">Total Orders<strong>${data.totals.totalOrders}</strong></div>
      <div class="metric">Total Revenue<strong>₹${Number(data.totals.totalRevenue).toFixed(2)}</strong></div>
    </div>

    <h2>Top 5 Products by Revenue</h2>
    <table>
      <thead><tr><th>Product</th><th>Orders</th><th>Revenue</th></tr></thead>
      <tbody>${topRows}</tbody>
    </table>

    <h2>Orders Per Day — Last 7 Days</h2>
    <table>
      <thead><tr><th>Date</th><th>Orders</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>

    <h2>Complete Order Details</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr>
      </thead>
      <tbody>${orderRows}</tbody>
    </table>

    <p class="footer">Generated automatically by the PDF Report Generator.</p>
  </body>
  </html>`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: '<div style="font-size:9px;width:100%;text-align:center;color:#777">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      headerTemplate: '<div></div>',
      margin: { top: "18mm", bottom: "22mm", left: "18mm", right: "18mm" }
    });
    console.log(`PDF generated successfully: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

module.exports = { generatePdf };

if (require.main === module) {
  generatePdf().catch(error => {
    console.error("PDF generation failed:", error);
    process.exitCode = 1;
  });
}
