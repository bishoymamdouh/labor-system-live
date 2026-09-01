const kv = await Deno.openKv("./database.sqlite");
const users = [];
for await (const entry of kv.list({ prefix: ["users"] })) {
    users.push({ id: entry.key[1], role: entry.value.role, name: entry.value.username });
}
console.log(JSON.stringify(users, null, 2));
