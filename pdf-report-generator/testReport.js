const { getReportData } = require("./reportData");

const report = getReportData();

console.log(JSON.stringify(report, null, 2));
