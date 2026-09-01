const https = require("https");
https.get("https://localtunnel.me/", (res) => {
  console.log("localtunnel.me status:", res.statusCode);
  res.on("data", d => process.stdout.write(d));
}).on("error", e => console.error(e));
