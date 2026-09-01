const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const listenerCode = `
    // Listen for instant jump messages from Service Worker
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'JUMP_TO_RECORD') {
                const viewRecordId = event.data.id;
                const target = document.getElementById('record-card-' + viewRecordId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.style.transition = "all 0.5s ease";
                    target.style.boxShadow = "0 0 20px 5px #ffd700";
                    target.style.border = "3px solid #ffd700";
                    target.style.transform = "scale(1.02)";
                    setTimeout(() => { target.style.transform = "scale(1)"; }, 1000);
                    setTimeout(() => { target.style.boxShadow = "var(--shadow)"; target.style.border = "none"; }, 5000);
                } else {
                    // Not in DOM, fallback to slow load
                    window.location.href = '/?view_record=' + viewRecordId;
                }
            }
        });
    }

    class App {
`;

content = content.replace("class App {", listenerCode);

content = content.replace(/setTimeout\(\(\) => \{[\s\n]*const activeView/m, "setTimeout(() => {\n                const activeView");
content = content.replace(/800\);/g, "100);");

fs.writeFileSync("index.html", content);
console.log("Updated index.html listener and timeouts");
