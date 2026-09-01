const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const badBlock1 = `        printHtml += '
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>
</body>
</html>';`;

const badBlock2 = `        printHtml += '\r
    <!-- Theme Toggle FAB -->\r
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">\r
        <i class="fas fa-sun"></i>\r
    </button>\r
</body>\r
</html>';`;

if (content.includes(badBlock1)) {
    content = content.replace(badBlock1, `        printHtml += '</body></html>';`);
} else if (content.includes(badBlock2)) {
    content = content.replace(badBlock2, `        printHtml += '</body></html>';`);
} else {
    // Brute force replacing the chunk between `printHtml += '` and `</html>';` near line 3948
    const idx = content.indexOf("printHtml += '");
    if (idx !== -1) {
        const endIdx = content.indexOf("</html>';", idx);
        if (endIdx !== -1) {
            content = content.substring(0, idx) + "printHtml += '</body></html>';" + content.substring(endIdx + 9);
        }
    }
}

fs.writeFileSync("index.html", content);
console.log("Bulletproof fix applied");
