const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexCard = /<div class="half"><strong>المهندس:<\/strong> <span class="badge-glow badge-glow-engineer"><i class="fas fa-hard-hat"><\/i> \$\{r.engineerName === 'admin' \? 'Bishoy Mamdouh' : r.engineerName\}<\/span>[\s\S]*?<\/div>\s*<\/div>/;

const newCard = `<div class="half"><strong>المهندس:</strong> <span class="badge-glow badge-glow-engineer"><i class="fas fa-hard-hat"></i> \${r.engineerName === 'admin' ? 'Bishoy Mamdouh' : r.engineerName}</span>
                    \${r.forwardedBy ? \`<br><small style="color: #6366f1; font-weight: bold; display: inline-block; margin-top: 5px;"><i class="fas fa-share"></i> محول من: \${r.forwardedBy === 'admin' ? 'Bishoy Mamdouh' : r.forwardedBy}</small>\` : ''}
                    </div>
                </div>
                \${r.status === 'rejected' && r.rejectReason ? \`<div style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 10px; border-radius: 5px; margin-bottom: 10px; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> سبب الرفض: \${r.rejectReason}</div>\` : ''}`;

if (html.match(regexCard)) {
    html = html.replace(regexCard, newCard);
    console.log("Card updated with reject reason!");
} else {
    console.log("regexCard not found");
}

fs.writeFileSync('index.html', html, 'utf8');
