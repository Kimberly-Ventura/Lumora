const fs = require('fs');
const readline = require('readline');
const path = 'C:\\Users\\COMPUTER 26\\.gemini\\antigravity\\brain\\7be8ef99-9f6e-4cf4-84b7-d666bf9c67af\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(path),
  output: process.stdout,
  terminal: false
});

let lines = [];
rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.source === 'MODEL' && data.content) {
      lines.push(data);
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log(`Found ${lines.length} model lines with content.`);
  lines.forEach((l) => {
    console.log(`\n--- Step ${l.step_index} (${l.type}) ---`);
    console.log(l.content.substring(0, 1000));
  });
});
