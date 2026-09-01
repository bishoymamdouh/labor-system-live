const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// We need to replace the exact broken string at line 3948
content = content.replace(/printHtml \+= '\r?\n\s*<!-- Theme Toggle FAB -->[\s\S]*?<\/button>\r?\n\r?\n<\/body>\r?\n<\/html>';/m, "printHtml += '</body></html>';");
content = content.replace(/printHtml \+= '\r?\n\s*<!-- Theme Toggle FAB -->[\s\S]*?<\/button>\r?\n\r?\n<\/body><\/html>';/m, "printHtml += '</body></html>';");
content = content.replace(/printHtml \+= '[\s\S]*?<\/button>[\s\S]*?<\/html>';/m, "printHtml += '</body></html>';");


// Make sure FAB is injected at the end of the real HTML
if (!content.includes('id="theme-toggle-fab"')) {
    content = content.replace(/<\/body>[\s\r\n]*<\/html>/m, `
    <!-- Theme Toggle FAB -->
    <button id="theme-toggle-fab" title="تغيير المظهر (ليلي/نهاري)" style="position: fixed; bottom: 20px; left: 20px; border-radius: 50%; width: 50px; height: 50px; z-index: 9999; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background-color: var(--primary-color); color: white; border: none; cursor: pointer; transition: var(--transition);">
        <i class="fas fa-sun"></i>
    </button>
</body>
</html>`);
}

fs.writeFileSync("index.html", content);
console.log("Fixed via regex");
