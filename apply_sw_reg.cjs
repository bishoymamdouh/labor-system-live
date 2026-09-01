const fs = require("fs");
try {
    let content = fs.readFileSync("index.html", "utf8");
    
    const swScript = `
// --- Offline Support ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('ServiceWorker registered:', reg.scope);
        }).catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}
</script>`;
    
    content = content.replace("// --- Offline Support ---\r\n</script>", swScript);
    content = content.replace("// --- Offline Support ---\n</script>", swScript);
    
    // just in case it didn't find the comment
    if (!content.includes("serviceWorker.register")) {
        content = content.replace("</script>\r\n</body>", swScript + "\r\n</body>");
        content = content.replace("</script>\n</body>", swScript + "\n</body>");
    }
    
    fs.writeFileSync("index.html", content);
    console.log("Success");
} catch(e) {
    console.log("Error: " + e.message);
}
