const kv = await Deno.openKv();
const res = await kv.list({prefix: []});
let count = 0;
for await (const entry of res) {
    console.log(entry.key, entry.value);
    count++;
}
console.log("Total records: " + count);
