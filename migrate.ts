const localKv = await Deno.openKv("./database.sqlite");

const exportData = {};
for await (const entry of localKv.list({ prefix: [] })) {
    const collection = entry.key[0];
    if (!exportData[collection]) exportData[collection] = [];
    exportData[collection].push({ key: entry.key, value: entry.value });
}

console.log("Exported collections:", Object.keys(exportData));
console.log("Uploading to cloud...");

const res = await fetch("https://labor-system-live.bishoymamdouh.deno.net/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exportData)
});

console.log("Cloud Response:", res.status, await res.text());
