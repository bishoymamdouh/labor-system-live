const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetStr = `top: 15px; left: 15px; background: var(--primary-color); border: none; color: white; padding: 10px; border-radius: 50%; width: 40px; height: 40px; cursor: pointer;`;
const newStr = `top: 10px; left: 10px; background: var(--primary-color); border: none; color: white; border-radius: 50%; width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer;`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, newStr);
    fs.writeFileSync('index.html', html);
    console.log("Updated button size and position");
} else {
    console.log("Could not find the target string");
}
