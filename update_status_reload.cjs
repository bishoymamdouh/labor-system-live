const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexReload = /if \(role === 'admin'\) \{[\s\S]*?await this\.loadEngineerData\(\);[\s\S]*?await this\.generateReport\(\);[\s\S]*?\} else if \(role === 'engineer'\) \{[\s\S]*?\}/;

const newReload = `if (role === 'admin') {
                    await this.loadAdminData();
                    await this.loadEngineerData();
                    await this.generateReport();
                } else if (role === 'engineer') {
                    await this.loadEngineerData();
                    await this.generateReport();
                } else if (role === 'supervisor') {
                    await this.loadSupervisorData();
                }`;

if (html.match(regexReload)) {
    html = html.replace(regexReload, newReload);
    console.log("updateRecordStatus reload logic updated!");
    fs.writeFileSync('index.html', html, 'utf8');
} else {
    console.log("reload logic not found");
}
