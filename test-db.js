const kv = await Deno.openKv();
const records = [];
for await (const entry of kv.list({ prefix: ["records"] })) {
  records.push(entry.value);
}
console.log("Records:", JSON.stringify(records, null, 2));

const workers = [];
for await (const entry of kv.list({ prefix: ["workers"] })) {
  workers.push(entry.value);
}
console.log("Workers:", JSON.stringify(workers, null, 2));

kv.close();
