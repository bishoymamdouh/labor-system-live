const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /document\.getElementById\('record-date'\)\.value = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];/g;
html = html.replace(regex, 
    `document.getElementById('record-date').value = (auth.getRole() === 'admin') ? '' : new Date().toISOString().split('T')[0];`);

fs.writeFileSync('index.html', html);
console.log("Updated date reset logic");
