const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

content = content.replace(
    /if \(collection === "records" && body\.status === "pending"\) \{\s*const targetIds = new Set\(\);/g,
    `if (collection === "records" && body.status === "pending") {
                let supervisorName = "مشرف";
                if (body.supervisorId) {
                    const usersIter = kv.list({ prefix: ["users"] });
                    for await (const u of usersIter) {
                        if (u.key[1] === String(body.supervisorId)) {
                            supervisorName = u.value.username;
                            break;
                        }
                    }
                }
                const targetIds = new Set();`
);

fs.writeFileSync("server.ts", content);
console.log("Fixed ReferenceError");
