const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    /attachEventListeners\(\) \{/,
    `attachEventListeners() {
        window.addEventListener('online', () => {
            console.log("Network came online. Attempting offline sync...");
            this.syncOfflineRecords();
        });
        // Try on load just in case
        setTimeout(() => this.syncOfflineRecords(), 3000);
        `
);

fs.writeFileSync("index.html", content);
console.log("Added offline sync listeners");
