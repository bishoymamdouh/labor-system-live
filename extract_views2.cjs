const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/Bishoy Heshmat/.gemini/antigravity/brain/86f54fac-b6c3-4eac-b4ba-d1c523ab99f9/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
          for(const tool of data.tool_calls) {
              const strArgs = JSON.stringify(tool.arguments || tool.tool_args);
              if (strArgs && strArgs.includes('index.html') && (tool.name === 'view_file' || tool.tool_name === 'view_file' || tool.name === 'default_api:view_file')) {
                  console.log('view_file call: ' + strArgs);
              }
          }
      }
    } catch(e) {}
  }
}
processLineByLine();
