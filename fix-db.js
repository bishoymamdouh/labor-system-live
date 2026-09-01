let js = Deno.readTextFileSync('js/db.js');

const regexBad = /const users = await this\.getAll\('users'\);\s*if \(users\.length === 0\) \{\s*await this\.add\('users', \{ username: 'Admin', password: '123', role: 'admin' \}\);\s*\}\s*const res = await fetch\(url, options\);/g;
js = js.replace(regexBad, 'const res = await fetch(url, options);');

// Now we need to find where the actual init logic was (if any) or put it back.
// Since init() is:
//     async init() {
//         console.log("API Database Initialized");
//         return true;
//     }
// It seems the original file didn't actually have the users initialization in db.js!
// Wait! Let me check the original db.js!

Deno.writeTextFileSync('js/db.js', js);
console.log("Fixed db.js");
