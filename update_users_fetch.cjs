const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldStr = `const engineers = (window.app && window.app.users) ? window.app.users.filter(u => u.role === 'engineer' && u.id !== window.app.currentUser.id) : [];`;
const newStr = `let engineers = [];
                try {
                    const users = await window.app.db.getAll('users');
                    engineers = users.filter(u => u.role === 'engineer' && String(u.id) !== String(window.app.currentUser.id));
                } catch(e) {}`;

if (html.includes(oldStr)) {
    html = html.replace(oldStr, newStr);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("index.html updated with async user fetching!");
} else {
    console.log("Could not find the string in index.html to replace.");
}
