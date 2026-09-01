const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetMethod = html.match(/<input type="text" placeholder="\?\?\?\?\?\?\?\? \?\?\?\?..."[\s\S]*?onchange="app.loadEngineerData\(\)">/);
if (targetMethod) {
    const newMethod = `<input type="date" id="engineer-date-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px; font-family: inherit; color: var(--text-color); cursor: pointer;" onchange="app.loadEngineerData()">`;
    html = html.replace(targetMethod[0], newMethod);
    fs.writeFileSync('index.html', html);
    console.log("Reverted date filter input to type date");
} else {
    console.log("Regex for date filter did not match");
}
