const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetMethod = html.match(/<input type="date" id="engineer-date-filter"[\s\S]*?onchange="app\.loadEngineerData\(\)">/);
if (targetMethod) {
    const newMethod = `<input type="text" placeholder="تاريخ السركي..." onfocus="(this.type='date')" onblur="(this.value == '' ? this.type='text' : this.type='date')" id="engineer-date-filter" class="modal-input" style="width: auto; margin-bottom: 0; padding: 5px 15px; font-family: inherit;" onchange="app.loadEngineerData()">`;
    html = html.replace(targetMethod[0], newMethod);
    fs.writeFileSync('index.html', html);
    console.log("Reverted date filter input to text-date hybrid with correct Arabic");
} else {
    console.log("Regex for date filter did not match");
}
