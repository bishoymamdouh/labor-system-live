const kv = await Deno.openKv();
// create a fake record
await kv.set(["records", "test-rec"], { id: "test-rec", totalAmount: 0, status: "pending" });
await kv.set(["workers", "test-work"], { id: "test-work", recordId: "test-rec", amount: 350, deduction: 0 });

// mimic updateRecordStatus
const record = (await kv.get(["records", "test-rec"])).value;
const worker = (await kv.get(["workers", "test-work"])).value;

worker.deduction = 50;
const netAmount = worker.amount - worker.deduction;
let newTotalAmount = netAmount > 0 ? netAmount : 0;
record.totalAmount = newTotalAmount;
record.status = "approved";

await kv.set(["workers", worker.id], worker);
await kv.set(["records", record.id], record);

// fetch them back
console.log("Updated record:", (await kv.get(["records", "test-rec"])).value);
console.log("Updated worker:", (await kv.get(["workers", "test-work"])).value);

kv.close();
