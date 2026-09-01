const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `            } else {
                dateInput.readOnly = true;
                dateInput.setAttribute('readonly', 'true');
                dateInput.style.pointerEvents = 'none';
                dateInput.style.backgroundColor = 'var(--bg-card)';
            }`;

const newStr = `            } else {
                dateInput.value = today || new Date().toISOString().split('T')[0];
                dateInput.readOnly = true;
                dateInput.setAttribute('readonly', 'true');
                dateInput.style.pointerEvents = 'none';
                dateInput.style.backgroundColor = 'var(--bg-card)';
            }`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, newStr);
    fs.writeFileSync('index.html', html);
    console.log("Fixed date value for non-admins");
} else {
    console.log("Could not find the target string!");
}
