let js = Deno.readTextFileSync('js/ui.js');

// Replace any existing "Bishoy Mamdouh" logic
js = js.replace(/let displayName = eng\.username;\s*if \(eng\.role === 'admin'\) \{\s*displayName = 'Bishoy Mamdouh';\s*\}/g, "let displayName = eng.username === 'admin' ? 'بيشوي حشمت' : eng.username;");

// Update users table display
js = js.replace(/<td>\$\{user\.username\}<\/td>/g, "<td>${user.username === 'admin' ? 'بيشوي حشمت' : user.username}</td>");

// Update record card engineer name
js = js.replace(/\$\{r\.engineerName\}/g, "${r.engineerName === 'admin' ? 'بيشوي حشمت' : r.engineerName}");

// Update record card supervisor name
js = js.replace(/\$\{r\.supervisorName\}/g, "${r.supervisorName === 'admin' ? 'بيشوي حشمت' : r.supervisorName}");

// In app.js, for the sidebar name
let appJs = Deno.readTextFileSync('js/app.js');
appJs = appJs.replace(/auth\.currentUser\.username/g, "(auth.currentUser.username === 'admin' ? 'بيشوي حشمت' : auth.currentUser.username)");

Deno.writeTextFileSync('js/ui.js', js);
Deno.writeTextFileSync('js/app.js', appJs);

console.log("Replaced 'admin' with 'بيشوي حشمت' for display purposes.");
