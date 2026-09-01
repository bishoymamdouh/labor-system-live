const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `        });
    };
    }


</script>`;
const replacement = `        });
    }

</script>`;

html = html.replace(target, replacement);
fs.writeFileSync('index.html', html);
console.log("Fixed extra closing brace");
