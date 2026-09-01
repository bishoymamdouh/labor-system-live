const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexAlert = /alert\(\`تم \$\{status === 'approved' \? 'اعتماد' : 'رفض'\} السركي بنجاح\`\);/;

const newAlert = `alert(\`تم \${status === 'approved' ? 'اعتماد' : status === 'pending' ? 'إعادة التقديم للمراجعة' : 'رفض'} السركي بنجاح\`);`;

if (html.match(regexAlert)) {
    html = html.replace(regexAlert, newAlert);
    console.log("alert logic updated!");
    fs.writeFileSync('index.html', html, 'utf8');
} else {
    console.log("alert logic not found");
}
