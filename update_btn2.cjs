const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `<button onclick="window.location.reload()"`;
const newStr = `<button onclick="this.querySelector('i').classList.add('fa-spin'); window.location.reload();"`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, newStr);
    fs.writeFileSync('index.html', html);
    console.log("Updated button to spin on click");
} else {
    console.log("Could not find the target string");
}
