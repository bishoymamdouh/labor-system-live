const fs = require("fs");
let lines = fs.readFileSync("index.html", "utf8").split("\n");

// Force fix line 3948 to just be printHtml += '</body></html>';
// And delete the extra injected lines from 3949 to 3954
if (lines[3947].includes("printHtml += '")) {
    lines[3947] = "        printHtml += '</body></html>';";
    lines.splice(3948, 7);
}

let content = lines.join("\n");

const fabHtml = `
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>
</body>
</html>`;

content = content.replace(/<\/body>[\s\r\n]*<\/html>/m, fabHtml);

fs.writeFileSync("index.html", content);
console.log("Force fixed line 3948");
