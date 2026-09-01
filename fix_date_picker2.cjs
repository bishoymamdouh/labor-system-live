const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const jsRegex = /dateInput\.removeAttribute\('readonly'\);\r?\n                dateInput\.style\.pointerEvents = 'auto';/g;
html = html.replace(jsRegex, 
    `dateInput.readOnly = false;
                dateInput.removeAttribute('readonly');
                dateInput.style.pointerEvents = 'auto';`);

const jsRegex2 = /dateInput\.setAttribute\('readonly', 'true'\);\r?\n                dateInput\.style\.pointerEvents = 'none';/g;
html = html.replace(jsRegex2, 
    `dateInput.readOnly = true;
                dateInput.setAttribute('readonly', 'true');
                dateInput.style.pointerEvents = 'none';`);

fs.writeFileSync('index.html', html);
console.log("Fixed readOnly property");
