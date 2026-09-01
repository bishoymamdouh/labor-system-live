const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the onclick I added
const onclickRegex = / onclick="if\(!this\.readOnly && this\.showPicker\) this\.showPicker\(\);"/g;
html = html.replace(onclickRegex, '');

// 2. Fix the styling applied dynamically in JS for admin
const jsRegex = /dateInput\.style\.backgroundColor = 'var\(--bg-main\)';\r?\n                dateInput\.style\.border = '1px solid var\(--border-color\)';/g;
html = html.replace(jsRegex, 
    `dateInput.style.backgroundColor = '';
                dateInput.style.color = '';
                dateInput.style.fontWeight = '';
                dateInput.style.pointerEvents = '';
                dateInput.style.border = '';`);

fs.writeFileSync('index.html', html);
console.log("Reverted to standard input style for admin");
