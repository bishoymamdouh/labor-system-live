const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const engineerRegex = /            if \(role === 'engineer' \|\| role === 'admin'\) \{\r?\n                select\.disabled = true;\r?\n            \}/g;
html = html.replace(engineerRegex, 
    `            if (role === 'engineer') {
                select.disabled = true;
            }`);

const dateRegex = /        const dateInput = document\.getElementById\('record-date'\);\r?\n        if\(dateInput\) dateInput\.value = today;/g;
html = html.replace(dateRegex,
    `        const dateInput = document.getElementById('record-date');
        if(dateInput) {
            dateInput.value = today;
            if (auth.getRole() === 'admin') {
                dateInput.removeAttribute('readonly');
                dateInput.style.pointerEvents = 'auto';
                dateInput.style.backgroundColor = 'var(--bg-main)';
                dateInput.style.border = '1px solid var(--border-color)';
            } else {
                dateInput.setAttribute('readonly', 'true');
                dateInput.style.pointerEvents = 'none';
                dateInput.style.backgroundColor = 'var(--bg-card)';
            }
        }`);

fs.writeFileSync('index.html', html);
console.log("Updated date and engineer fields access for admin");
