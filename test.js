const html = Deno.readTextFileSync('js/app.js');
console.log(html.match(/async updateRecordStatus[\s\S]*?alert\(\`تم/)[0]);
