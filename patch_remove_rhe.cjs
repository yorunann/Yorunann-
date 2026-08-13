const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');

// Find the start of RHE & Inning Scores Editor and the end of it
const searchStart = '{/* RHE & Inning Scores Editor */}';
const searchEnd = '{/* Pitcher Editor */}';

const startIndex = content.indexOf(searchStart);
const endIndex = content.indexOf(searchEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    fs.writeFileSync('components/ScoreboardControls.tsx', before + after);
    console.log("Removed RHE & Inning Scores Editor from TeamEditor");
} else {
    console.log("Could not find start or end bounds.");
}
