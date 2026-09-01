const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /if\(dateInput\) \{[\s\S]*?pointerEvents = 'none';\r?\n\s*\}/;

const replacement = `if (dateInput) {
            if (auth.getRole() === 'admin') {
                dateInput.value = '';
                dateInput.readOnly = false;
                dateInput.removeAttribute('readonly');
                dateInput.style.pointerEvents = 'auto';
            } else {
                dateInput.value = new Date().toISOString().split('T')[0];
                dateInput.readOnly = true;
                dateInput.setAttribute('readonly', 'true');
                dateInput.style.pointerEvents = 'none';
            }
        }`;

if (html.match(regex)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('index.html', html);
    console.log("Fixed date logic block");
} else {
    // maybe today variable is used instead
    console.log("Regex not matched!");
}
