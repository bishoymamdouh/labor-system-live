const fs = require("fs");
let content = fs.readFileSync("index.html", "utf8");

content = content.replace("document.getElementById('menu-notifications')?.addEventListener('click', async () => {", 
`document.body.addEventListener('click', async (e) => {
    const link = e.target.closest('[data-view="view-notifications"]');
    if (link) {`);

content = content.replace("app.switchView('view-notifications');", "/* handled by core logic */");
content = content.replace("document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));", "");
content = content.replace("document.getElementById('menu-notifications').classList.add('active');", "");

fs.writeFileSync("index.html", content);
console.log("Fixed JS listener!");
