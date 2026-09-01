const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const dateHtmlRegex = /<input type="date" id="record-date" required readonly style="pointer-events: none; background-color: var\(--bg-card\); color: var\(--text-main\); font-weight: bold;">/g;
html = html.replace(dateHtmlRegex, 
    `<input type="date" id="record-date" required readonly style="pointer-events: none; background-color: var(--bg-card); color: var(--text-main); font-weight: bold;" onclick="if(!this.readOnly && this.showPicker) this.showPicker();">`);

fs.writeFileSync('index.html', html);
console.log("Added showPicker() to date input");
