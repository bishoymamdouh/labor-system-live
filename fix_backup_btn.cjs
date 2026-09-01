const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace(
    `<input type="file" id="backup-file-input" accept=".json" style="flex: 1;" class="input-field">`,
    `<input type="file" id="import-file-input" accept=".json" style="display: none;">`
);

content = content.replace(
    `<button class="btn btn-warning" onclick="app.restoreBackup()">استعادة</button>`,
    `<button type="button" class="btn btn-secondary" onclick="document.getElementById('import-file-input').click()"><i class="fas fa-file-import"></i> استعادة النظام (.json)</button>`
);

fs.writeFileSync("index.html", content);
console.log("Fixed the backup restore button!");
