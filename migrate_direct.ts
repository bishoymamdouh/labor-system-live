const kv = await Deno.openKv("./database.sqlite");
const baseUrl = 'https://curve.bishoymamdouh.deno.net/api';

for (const collection of ["users", "records", "workers", "worker_directory"]) {
    const entries = kv.list({ prefix: [collection] });
    let count = 0;
    for await (const entry of entries) {
        const id = entry.key[1];
        const payload = { id, ...entry.value };
        const res = await fetch(`${baseUrl}/${collection}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            console.error(`Failed to insert into ${collection}:`, await res.text());
        }
        count++;
    }
    console.log(`Imported ${count} items to ${collection}.`);
}
console.log('Done migrating data!');
