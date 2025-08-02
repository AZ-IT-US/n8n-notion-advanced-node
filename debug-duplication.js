const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== DEBUGGING CONTENT DUPLICATION ===');

// Test the exact input that's causing duplication
const testInput = "Fruits\n  <ul>\n  <li>Apple</li>\n  </ul>";
console.log('Input:', JSON.stringify(testInput));

// Step by step debug of processNestedHtmlInListItem
let step1 = testInput.trim();
console.log('Step 1 - trim():', JSON.stringify(step1));

let step2 = step1.replace(/<[uo]l\s*[^>]*>[\s\S]*?<\/[uo]l>/gi, '');
console.log('Step 2 - remove nested lists:', JSON.stringify(step2));

let step3 = step2.replace(/<\/?li\s*[^>]*>/gi, '');
console.log('Step 3 - remove li tags:', JSON.stringify(step3));

let step4 = step3.replace(/<\/?[uo]l\s*[^>]*>/gi, '');
console.log('Step 4 - remove remaining ul/ol tags:', JSON.stringify(step4));

let step5 = step4.replace(/<[^>]*>/g, ' ');
console.log('Step 5 - remove all HTML tags:', JSON.stringify(step5));

let step6 = step5.replace(/\s+/g, ' ').trim();
console.log('Step 6 - clean whitespace:', JSON.stringify(step6));

// Now test the actual function
const actualResult = NotionAITool.processNestedHtmlInListItem(testInput);
console.log('Actual function result:', JSON.stringify(actualResult));