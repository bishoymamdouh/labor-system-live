const html = Deno.readTextFileSync('index.html');
const css = Deno.readTextFileSync('css/styles.css');
let newHtml = html.replace(/<link rel="stylesheet" href="css\/styles\.css.*?>/, '<style>\n' + css + '\n</style>');

const db = Deno.readTextFileSync('js/db.js');
const auth = Deno.readTextFileSync('js/auth.js');
const ui = Deno.readTextFileSync('js/ui.js');
const app = Deno.readTextFileSync('js/app.js');

const combinedJs = '<script>\n' + db + '\n' + auth + '\n' + ui + '\n' + app + '\n</script>';

// Remove all individual script tags
newHtml = newHtml.replace(/<script src="js\/db\.js.*?<\/script>/g, '');
newHtml = newHtml.replace(/<script src="js\/auth\.js.*?<\/script>/g, '');
newHtml = newHtml.replace(/<script src="js\/ui\.js.*?<\/script>/g, '');
newHtml = newHtml.replace(/<script src="js\/app\.js.*?<\/script>/g, '');

// Clean up duplicate bundled scripts if any
newHtml = newHtml.replace(/<!-- Application Scripts -->[\s\S]*?<\/body>/, '<!-- Application Scripts -->\n' + combinedJs + '\n</body>');

Deno.writeTextFileSync('index.html', newHtml);
console.log('Inlined all CSS and JS into index.html');
