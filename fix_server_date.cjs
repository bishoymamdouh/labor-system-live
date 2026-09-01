const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Server-side validation for record date\s*if \(collection === "records"\) \{\s*const today = [^;]+;\s*if \(body\.date !== today\) \{\s*return new Response\("Invalid date\. Only today's date is allowed\.", \{ status: 400 \}\);\s*\}\s*\}/m;

if (code.match(regex)) {
    code = code.replace(regex, '// Server-side validation removed to allow admin custom dates');
    fs.writeFileSync('server.ts', code);
    console.log("Validation removed");
} else {
    console.log("Regex not matched");
}
