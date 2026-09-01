const fs = require('fs');

const currentHtml = fs.readFileSync('index.html', 'utf8');
const backupJs = fs.readFileSync('temp_test.js', 'utf8');

const htmlBeforeScript = currentHtml.split('// API Wrapper for Deno Backend')[0];

const newHtml = htmlBeforeScript + '// API Wrapper for Deno Backend\n' + backupJs + '\n</script>\n</body>\n</html>\n';

fs.writeFileSync('index_recovered.html', newHtml, 'utf8');
console.log("Created index_recovered.html!");
