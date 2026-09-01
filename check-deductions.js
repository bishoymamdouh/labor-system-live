const res = await fetch('http://127.0.0.1:8000/api/allRecordsDetails');
const records = await res.json();
console.log("Records length:", records.length);
let totalDeductions = 0;
records.forEach(r => {
    r.workers.forEach(w => {
        if (w.deduction > 0) {
            console.log(`Worker ${w.name} in record ${r.id} has deduction: ${w.deduction}`);
            totalDeductions++;
        }
    });
});
console.log(`Found ${totalDeductions} workers with deductions > 0`);
