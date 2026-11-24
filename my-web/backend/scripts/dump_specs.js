const fs = require('fs');
const content = fs.readFileSync(__dirname + '/generate-100-restaurants.js', 'utf8');
const match = content.match(/const remainingSpecs = \[([\s\S]*?)\];/);
const specs = eval('[' + match[1] + ']');

console.log('Total specs:', specs.length);
// Check specs grouped by ID
for (const s of specs) {
  console.log(`ID ${s.id}: ${s.name} | Cuisines: ${s.cui}`);
}
