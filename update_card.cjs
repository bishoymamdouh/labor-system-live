const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `                    <div class="half"><strong>المهندس:</strong> <span class="badge-glow badge-glow-engineer"><i class="fas fa-hard-hat"></i> \${r.engineerName === 'admin' ? 'Bishoy Mamdouh' : r.engineerName}</span></div>`;

const newStr = `                    <div class="half"><strong>المهندس:</strong> <span class="badge-glow badge-glow-engineer"><i class="fas fa-hard-hat"></i> \${r.engineerName === 'admin' ? 'Bishoy Mamdouh' : r.engineerName}</span>
                    \${r.forwardedBy ? \`<br><small style="color: #6366f1; font-weight: bold; display: inline-block; margin-top: 5px;"><i class="fas fa-share"></i> محول من: \${r.forwardedBy === 'admin' ? 'Bishoy Mamdouh' : r.forwardedBy}</small>\` : ''}
                    </div>`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, newStr);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Record Card HTML updated!");
} else {
    console.log("Could not find the target string.");
}
