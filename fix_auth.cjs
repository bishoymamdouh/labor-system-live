const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target1 = "if (window.engineerUsersCache && window.auth && window.auth.currentUser) {";
const replace1 = "if (window.engineerUsersCache && typeof auth !== 'undefined' && auth.currentUser) {";

const target2 = "window.engineerUsersCache.filter(u => String(u.id) !== String(window.auth.currentUser.id)).forEach(u => {";
const replace2 = "window.engineerUsersCache.filter(u => String(u.id) !== String(auth.currentUser.id)).forEach(u => {";

let changed = false;
if (html.includes(target1)) {
    html = html.replace(target1, replace1);
    changed = true;
}
if (html.includes(target2)) {
    html = html.replace(target2, replace2);
    changed = true;
}

if (changed) {
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Fixed auth reference!");
} else {
    console.log("Not found.");
}
