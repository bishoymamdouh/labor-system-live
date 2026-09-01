const kv = await Deno.openKv("./database.sqlite");
const users = kv.list({ prefix: ["users"] });
for await (const user of users) {
    const subEntries = kv.list({ prefix: ["push_subscriptions", user.key[1]] });
    let hasSub = false;
    for await (const sub of subEntries) {
        hasSub = true;
        break;
    }
    if (hasSub) {
        console.log(`- ${user.value.fullName || user.value.username} (Role: ${user.value.role})`);
    }
}
Deno.exit(0);
