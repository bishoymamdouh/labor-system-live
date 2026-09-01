const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldLoadEng = `async loadEngineerData() {
        const role = auth.getRole();`;

const newLoadEng = `async loadEngineerData() {
        try {
            const users = await db.getAll('users');
            window.engineerUsersCache = users.filter(u => u.role === 'engineer' || u.role === 'admin');
        } catch(e) { console.error(e); }
        
        const role = auth.getRole();`;

if (html.includes(oldLoadEng)) {
    html = html.replace(oldLoadEng, newLoadEng);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("loadEngineerData updated with cache logic!");
} else {
    console.log("Could not find loadEngineerData to update");
}
