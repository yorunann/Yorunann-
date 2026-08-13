const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace('26.8.13.2', '26.8.13.3');
fs.writeFileSync(filePath, content, 'utf8');

const fp2 = path.join(__dirname, 'src/App.tsx');
if (fs.existsSync(fp2)) {
    let c = fs.readFileSync(fp2, 'utf8');
    c = c.replace('26.8.13.2', '26.8.13.3');
    fs.writeFileSync(fp2, c, 'utf8');
}

console.log('Version updated');
