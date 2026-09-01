const kv = await Deno.openKv("./database.sqlite");
const entries = kv.list({ prefix: ["users"] });
for await (const entry of entries) {
  console.log(entry.key, entry.value);
}
