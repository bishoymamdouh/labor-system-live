const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = /        \}\);\r?\n    \};\r?\n    \}\r?\n\r?\n\r?\n<\/script>/;
if (html.match(target)) {
    html = html.replace(target, '        });\n    }\n\n</script>');
    fs.writeFileSync('index.html', html);
    console.log("Fixed extra closing brace successfully");
} else {
    // try a more generic approach if that exact one fails
    const endStr = html.substring(html.length - 100);
    console.log("Did not match target. End is:", endStr);
}
