const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldFunc = `
    highlightRecordFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewRecordId = urlParams.get('view_record');
        if (viewRecordId) {
            const target = document.getElementById('record-card-' + viewRecordId);
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.style.boxShadow = "0 0 15px var(--primary-color)";
                    target.style.border = "2px solid var(--primary-color)";
                    
                    // Reset URL so it doesn't happen again on normal navigation
                    window.history.replaceState({}, document.title, "/");
                }, 500);
            }
        }
    }
`;

const newFunc = `
    highlightRecordFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewRecordId = urlParams.get('view_record');
        if (viewRecordId) {
            // Wait for auth to be fully loaded so we know our role
            setTimeout(() => {
                const readOnly = (auth.getRole() === 'supervisor');
                this.viewRecordDetails(viewRecordId, readOnly);
                
                // Reset URL so it doesn't happen again on normal navigation
                window.history.replaceState({}, document.title, "/");
            }, 800);
        }
    }
`;

content = content.replace(oldFunc.trim(), newFunc.trim());
fs.writeFileSync("index.html", content);
console.log("Updated to open modal directly");
