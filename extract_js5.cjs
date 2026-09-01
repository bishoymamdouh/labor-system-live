const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const jsStart = html.lastIndexOf('<script>') + 8;
const jsEnd = html.lastIndexOf('</script>');
const js = html.substring(jsStart, jsEnd);
fs.writeFileSync('temp_check5.js', js);
