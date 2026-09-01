const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetMethod = html.match(/<input type="text" placeholder=".*?" onfocus="\(this\.type='date'\)"[\s\S]*?onchange="app\.loadEngineerData\(\)">/);
if (targetMethod) {
    const newMethod = `<input type="date" id="engineer-date-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px; font-family: 'Cairo', sans-serif;" onchange="app.loadEngineerData()">`;
    html = html.replace(targetMethod[0], newMethod);
    fs.writeFileSync('index.html', html);
    console.log("Reverted date filter input to type date with proper font");
} else {
    console.log("Regex for date filter did not match");
}
