const fs = require('fs');
const js = fs.readFileSync('script3.js', 'utf8');
const startIndex = js.indexOf('// 3. Create ExcelJS Workbook');
const endIndex = js.indexOf('// --- Notification System ---');
console.log(js.substring(startIndex, endIndex));
