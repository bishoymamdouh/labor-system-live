const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexReload = /if \(role === 'admin'\) \{\s*await this\.loadAdminData\(\);\s*await this\.loadEngineerData\(\);\s*await this\.generateReport\(\);\s*\} else if \(role === 'engineer'\) \{\s*await this\.loadEngineerData\(\);\s*await this\.generateReport\(\);\s*\}/g;

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

html = html.replace(regexReload, newReload);
console.log("Reload logic updated everywhere safely!");
fs.writeFileSync('index.html', html, 'utf8');
