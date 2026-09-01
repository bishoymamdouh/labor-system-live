let js = Deno.readTextFileSync('js/app.js');
let updatedJs = js.replace(/if \(status === 'approved' && window\.currentModalWorkers\) \{[\s\S]*?record\.totalAmount = newTotalAmount;\s*\}/, 
`if (status === 'approved') {
                let newTotalAmount = 0;
                
                // Fetch actual workers from DB to be safe
                const workersRes = await fetch('/api/allRecordsDetails');
                const allRecs = await workersRes.json();
                const currentRec = allRecs.find(r => String(r.id) === String(recordId));
                const workers = currentRec ? currentRec.workers : [];

                for (let worker of workers) {
                    // Try to find inputs from either card or modal
                    const typeInput = document.getElementById(\`card-type-\${worker.id}\`) || document.getElementById(\`modal-type-\${worker.id}\`);
                    const amountInput = document.getElementById(\`card-amount-\${worker.id}\`) || document.getElementById(\`modal-amount-\${worker.id}\`);
                    const locationInput = document.getElementById(\`card-location-\${worker.id}\`) || document.getElementById(\`modal-location-\${worker.id}\`);
                    const deductionInput = document.getElementById(\`card-deduction-\${worker.id}\`) || document.getElementById(\`modal-deduction-\${worker.id}\`);
                    const notesInput = document.getElementById(\`card-notes-\${worker.id}\`) || document.getElementById(\`modal-notes-\${worker.id}\`);
                    
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
console.log("updateRecordStatus patched to forcefully read inputs and save deductions!");
