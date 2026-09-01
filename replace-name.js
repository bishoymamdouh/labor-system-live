let uiJs = Deno.readTextFileSync('js/ui.js');
uiJs = uiJs.replace(/بيشوي حشمت/g, 'Bishoy Mamdouh');
Deno.writeTextFileSync('js/ui.js', uiJs);

let appJs = Deno.readTextFileSync('js/app.js');
appJs = appJs.replace(/بيشوي حشمت/g, 'Bishoy Mamdouh');
Deno.writeTextFileSync('js/app.js', appJs);

console.log("Replaced 'بيشوي حشمت' with 'Bishoy Mamdouh'");
