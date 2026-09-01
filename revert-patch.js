let js = Deno.readTextFileSync('js/app.js');
let updatedJs = js.replace(/if \(status === 'approved'\) \{[\s\S]*?record\.totalAmount = newTotalAmount;\s*\}/, 
`if (status === 'approved') {
                let newTotalAmount = 0;
                let prefix = window.currentCardPrefix || 'card';
                // Fetch actual workers from DB to be safe
                const workersRes = await fetch('/api/allRecordsDetails?t=' + Date.now(), {cache: 'no-store'});
                const allRecs = await workersRes.json();
                const currentRec = allRecs.find(r => String(r.id) === String(recordId));
                const workers = currentRec ? currentRec.workers : [];

                for (let worker of workers) {
                    const typeInput = document.getElementById(\`\${prefix}-type-\${worker.id}\`);
                    const amountInput = document.getElementById(\`\${prefix}-amount-\${worker.id}\`);
                    const locationInput = document.getElementById(\`\${prefix}-location-\${worker.id}\`);
                    const deductionInput = document.getElementById(\`\${prefix}-deduction-\${worker.id}\`);
                    const notesInput = document.getElementById(\`\${prefix}-notes-\${worker.id}\`);
                    
                    if (typeInput && amountInput) {
                        worker.type = typeInput.value;
                        worker.amount = Number(amountInput.value);
                        worker.location = locationInput ? locationInput.value : (worker.location || '');
                        worker.deduction = deductionInput ? Number(deductionInput.value) : 0;
                        worker.notes = notesInput ? notesInput.value : (worker.notes || '');
                        
                        await db.update('workers', worker.id, worker);
                    }
                    
                    // Calculate total
                    const netAmount = (Number(worker.amount) || 0) - (Number(worker.deduction) || 0);
                    newTotalAmount += netAmount > 0 ? netAmount : 0;
                }
                record.totalAmount = newTotalAmount;
            }`);
Deno.writeTextFileSync('js/app.js', updatedJs);
console.log("updateRecordStatus reverted to use prefix");
