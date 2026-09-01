const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let newHtml = html.replace(/\/\/ If approving, check if CC engineer is selected/, `// hide btn\n                if (btn) btn.style.display = 'none';\n                // If approving, check if CC engineer is selected`);

newHtml = newHtml.replace(/\} finally \{\s*if \(btn\) \{\s*btn\.disabled = false;\s*btn\.innerHTML = origHtml;\s*\}\s*\}/, `} finally {
            if (btn && status !== 'pending' && status !== 'approved') {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }`);

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log("Button fixed");
