const kv = await Deno.openKv("./database.sqlite");
const exportData = { items: [] };

const iter = kv.list({ prefix: [] });
for await (const res of iter) {
    exportData.items.push({ key: res.key, value: res.value });
}

await Deno.writeTextFile("kv_backup.json", JSON.stringify(exportData));
console.log("Exported " + exportData.items.length + " items to kv_backup.json");
kv.close();
