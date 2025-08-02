/**
 * Test for double processing fix - ensuring all XML content is caught and processed hierarchically
 */

// Simulated test content that was causing double processing
const testContent = `
Headers: <h1>Main Title</h1>, <h2>Section Title</h2>, <h3>Subsection Title</h3>

<p>Headers: <h1>Main Title</h1>, <h2>Section Title</h2>, <h3>Subsection Title</h3></p>

Blockquote: <blockquote>Quote text here</blockquote>

<p>Blockquote: <blockquote>Quote text here</blockquote></p>

Some regular text with <strong>bold</strong> and <em>italic</em> formatting.

<callout type="info">This is an info callout</callout>

<ul>
  <li>First list item</li>
  <li>Second list item</li>
</ul>

Mixed content with <code>inline code</code> and normal text.
`;

console.log('Testing double processing fix...');
console.log('Original content:', testContent);
console.log('\n--- Testing XML detection patterns ---');

// Test the enhanced XML tag detection from the parseContentToBlocks function
function testXmlDetection(line) {
  const hasAnyXmlTags = (
    // Basic XML/HTML tag detection
    /<[^>]+>/.test(line) ||
    // HTML-encoded tags
    /&lt;[^&]+&gt;/.test(line) ||
    // Any opening or closing XML/HTML tags
    /<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/.test(line) ||
    // Self-closing tags
    /<[a-zA-Z][a-zA-Z0-9]*[^>]*\/>/.test(line) ||
    // Common XML/HTML tag names (comprehensive list)
    /<\/?(?:h[1-6]|p|div|span|ul|ol|li|strong|b|em|i|code|pre|blockquote|callout|todo|image|embed|bookmark|equation|toggle|quote|divider|br|a|u|s|del|mark)\b[^>]*>/i.test(line) ||
    // Specific attribute patterns
    /(?:type|src|href|alt|language|checked)="[^"]*"/.test(line) ||
    // Any line that looks like it contains XML structure
    /^\s*<[^>]+>.*<\/[^>]+>\s*$/.test(line) ||
    // Lines that start or end with XML tags
    /^\s*<[^>]+>/.test(line) ||
    /<\/[^>]+>\s*$/.test(line)
  );
  
  return hasAnyXmlTags;
}

const lines = testContent.split('\n');
lines.forEach((line, index) => {
  const trimmedLine = line.trim();
  if (trimmedLine) {
    const hasXml = testXmlDetection(trimmedLine);
    console.log(`Line ${index + 1}: ${hasXml ? 'SKIP (XML detected)' : 'PROCESS'} - "${trimmedLine}"`);
  }
});

console.log('\n--- Testing generic XML regex ---');

// Test the generic XML regex that catches anything not processed by specific processors
const genericXmlRegex = /<[^>]+>[\s\S]*?<\/[^>]+>|<[^>]+\/>/gis;
let match;
const matches = [];
while ((match = genericXmlRegex.exec(testContent)) !== null) {
  matches.push({
    match: match[0],
    start: match.index,
    end: match.index + match[0].length
  });
}

console.log('Generic XML matches found:', matches.length);
matches.forEach((match, index) => {
  console.log(`Match ${index + 1}: "${match.match.substring(0, 50)}..." at position ${match.start}-${match.end}`);
});

console.log('\n--- Test completed ---');
console.log('The enhanced XML detection should catch ALL XML content and prevent double processing.');
console.log('Lines with XML tags should be skipped in traditional markdown processing.');
console.log('Generic XML regex should catch any remaining XML content not handled by specific processors.');