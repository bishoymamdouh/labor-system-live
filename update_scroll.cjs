const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

// Remove the setTimeout block from auth.init()
content = content.replace(
    /\/\/ Deep linking scroll[\s\S]*?1500\);/m,
    `// Deep linking scroll handled in render`
);

// Create the highlight function in App class
const highlightFunc = `
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

content = content.replace(
    /startNotificationPoller\(\) \{/,
    highlightFunc + '\n\n    startNotificationPoller() {'
);

// Call it at the end of loadEngineerData
content = content.replace(
    /UI\.renderEngineerFeed\(filteredRecords, workersMap, usersMap\);/,
    "UI.renderEngineerFeed(filteredRecords, workersMap, usersMap);\n            this.highlightRecordFromURL();"
);

// Call it at the end of loadSupervisorData
content = content.replace(
    /UI\.renderSupervisorFeed\(filteredRecords, workersMap, usersMap\);/,
    "UI.renderSupervisorFeed(filteredRecords, workersMap, usersMap);\n            this.highlightRecordFromURL();"
);

fs.writeFileSync("index.html", content);
console.log("Updated deep link scroll logic");
