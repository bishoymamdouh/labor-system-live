const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix date input pointer-events
const dateMatch = html.match(/if \(auth\.getRole\(\) === 'admin'\) \{[\s\S]*?dateInput\.readOnly = false;/);
if (dateMatch) {
    const newDate = `if (auth.getRole() === 'admin') {
                dateInput.value = '';
                dateInput.readOnly = false;
                dateInput.style.pointerEvents = 'auto';`;
    html = html.replace(dateMatch[0], newDate);
}

// 2. Fix submitRecord auto-approve for admin
const submitMatch = html.match(/async submitRecord\(\) \{([\s\S]*?)const role = auth\.getRole\(\);/);
if (submitMatch) {
    // We will inject the logic inside submitRecord
    // The exact string inside submitRecord is around line 2781.
}
fs.writeFileSync('index.html', html);
console.log("Updated date logic");
