const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

const oldCode = `
            if (role === 'admin' || role === 'engineer') {
                if (role === 'admin') UI.showView('view-engineer');
`;

const newCode = `
            if (role === 'admin' || role === 'engineer') {
                if (role === 'admin') {
                    UI.showView('view-engineer');
                    document.querySelectorAll('#nav-links a').forEach(l => l.classList.remove('active'));
                    const targetLink = document.querySelector('a[data-view="view-engineer"]');
                    if (targetLink) targetLink.classList.add('active');
                }
`;

content = content.replace(oldCode.trim(), newCode.trim());

const oldCode2 = `
            } else if (role === 'supervisor') {
                UI.showView('view-supervisor');
                // loadSupervisorData already loads everything
            }
`;

const newCode2 = `
            } else if (role === 'supervisor') {
                UI.showView('view-supervisor');
                document.querySelectorAll('#nav-links a').forEach(l => l.classList.remove('active'));
                const targetLink = document.querySelector('a[data-view="view-supervisor"]');
                if (targetLink) targetLink.classList.add('active');
                // loadSupervisorData already loads everything
            }
`;

content = content.replace(oldCode2.trim(), newCode2.trim());

fs.writeFileSync("index.html", content);
console.log("Fixed tab highlighting");
