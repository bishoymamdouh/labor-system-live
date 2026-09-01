const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /        const dateInput = document\.getElementById\('record-date'\);\r?\n        if\(dateInput\) \{\r?\n            dateInput\.value = today;\r?\n            if \(auth\.getRole\(\) === 'admin'\) \{/g;

html = html.replace(regex, 
    `        const dateInput = document.getElementById('record-date');
        if(dateInput) {
            if (auth.getRole() === 'admin') {
                dateInput.value = ''; // Leave empty for admin to show dd/mm/yyyy
                dateInput.readOnly = false;`);

fs.writeFileSync('index.html', html);
console.log("Updated date logic for admin to show empty picker");
