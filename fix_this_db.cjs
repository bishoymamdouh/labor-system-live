const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex1 = /await this\.db\.getById/g;
const regex2 = /await this\.db\.update/g;

html = html.replace(regex1, 'await db.getById');
html = html.replace(regex2, 'await db.update');

fs.writeFileSync('index.html', html, 'utf8');
console.log("Fixed this.db references!");
