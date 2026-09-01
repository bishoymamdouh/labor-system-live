const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetMethod = html.match(/PullToRefresh\.init\(\{[\s\S]*?mainElement:\s*'body',[\s\S]*?\}\);/);
if (targetMethod) {
    let block = targetMethod[0];
    block = block.replace("mainElement: 'body',", "mainElement: '.main-content',\n            triggerElement: '.main-content',");
    html = html.replace(targetMethod[0], block);
    fs.writeFileSync('index.html', html);
    console.log("Updated PullToRefresh to use .main-content");
} else {
    console.log("Regex for ptr did not match");
}
