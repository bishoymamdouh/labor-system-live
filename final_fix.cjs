const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split("\n");

// 1. Fix the broken JS string
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("printHtml +=") && lines[i].includes("<!-- Theme Toggle FAB -->") == false && lines[i+1] && lines[i+1].includes("<!-- Theme Toggle FAB -->")) {
        // We found the broken string start
        lines[i] = "        printHtml += '</body></html>';";
        // Remove the next lines until we hit the end of the broken string
        let j = i + 1;
        while (j < lines.length && !lines[j].includes("</html>';")) {
            j++;
        }
        lines.splice(i + 1, j - i);
        break;
    }
}

// 2. Add the FAB right before the REAL closing body tag
let bodyIndex = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes("</body>")) {
        bodyIndex = i;
        break;
    }
}

if (bodyIndex !== -1) {
    const fabHtml = `
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>`;
    
    // Make sure we haven't already added it at the end
    let alreadyHasFab = false;
    for (let i = Math.max(0, bodyIndex - 10); i < bodyIndex; i++) {
        if (lines[i].includes("theme-toggle-fab")) {
            alreadyHasFab = true;
            break;
        }
    }
    
    if (!alreadyHasFab) {
        lines.splice(bodyIndex, 0, fabHtml);
    }
}

fs.writeFileSync("index.html", lines.join("\n"));
console.log("Properly fixed and injected.");
