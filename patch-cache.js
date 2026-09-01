let dbJs = Deno.readTextFileSync('js/db.js');
dbJs = dbJs.replace(/const res = await fetch\(endpoint, \{ \.\.\.defaultOptions, \.\.\.options \}\);/,
`const res = await fetch(endpoint + (endpoint.includes('?') ? '&' : '?') + 't=' + Date.now(), { ...defaultOptions, ...options, cache: 'no-store' });`);
Deno.writeTextFileSync('js/db.js', dbJs);
console.log("Patched db.js to prevent caching.");
