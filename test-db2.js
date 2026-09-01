const kv = await Deno.openKv();
const workers = [];
for await (const entry of kv.list({ prefix: ["workers"] })) {
  workers.push({ id: entry.key[1], ...entry.value });
}
console.log("Workers in KV:", JSON.stringify(workers.slice(0, 2), null, 2));

const records = [];
for await (const entry of kv.list({ prefix: ["records"] })) {
  records.push(entry.value);
}
console.log("Records in KV:", JSON.stringify(records.slice(0, 2), null, 2));
kv.close();
