const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// Fix the broken JS string
const brokenJS = `printHtml += '
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>

</body></html>';`;

if (content.includes(brokenJS)) {
    content = content.replace(brokenJS, `printHtml += '</body></html>';`);
}

// Now insert the FAB at the ACTUAL end of the document
const actualBodyEnd = `</body>\r\n</html>`; // Or \n depending on file format
const fabHtml = `
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>
`;

if (!content.includes('id="theme-toggle-fab"')) {
    content = content.replace(/<\/body>\s*<\/html>/, fabHtml + '\n</body>\n</html>');
}

fs.writeFileSync("index.html", content);
console.log("Fixed the syntax error");
