const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexAlert = /alert\(\`تم \$\{status === 'approved' \? 'اعتماد' : status === 'pending' \? 'إعادة التقديم للمراجعة' : 'رفض'\} السركي بنجاح\`\);/;

const newAlert = `alert(\`تم \${status === 'approved' ? 'اعتماد' : status === 'pending' ? 'إعادة التقديم للمراجعة' : 'رفض'} السركي بنجاح\`);
                if (status === 'pending') {
                    window.location.reload();
                }`;

if (html.match(regexAlert)) {
    html = html.replace(regexAlert, newAlert);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Reload added!");
} else {
    console.log("Alert not found");
}
