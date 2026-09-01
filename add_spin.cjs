const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexBtnClick = /btn\.onclick = \(e\) => \{\s*if \(hasMoved\) \{\s*e\.preventDefault\(\);\s*e\.stopPropagation\(\);\s*\} else \{\s*location\.reload\(\);\s*\}\s*\};/;

const newBtnClick = `btn.onclick = (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-spin');
                }
                location.reload();
            }
        };`;

if (html.match(regexBtnClick)) {
    html = html.replace(regexBtnClick, newBtnClick);
    
    // Make sure the inline onclick is removed so it doesn't fire before the spinning class is added!
    html = html.replace('id="floating-refresh" onclick="location.reload()"', 'id="floating-refresh"');
    
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Spinning icon logic added!");
} else {
    console.log("btn click logic not found");
}
