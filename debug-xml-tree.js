const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('=== DEBUGGING XML TREE STRUCTURE ===\n');

const content = '<ul><li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li></ul>';

console.log('Input content:');
console.log(content);
console.log();

// Mock the tagProcessors to get the same ones used in processXmlTags
const tagProcessors = [
  // Bulleted lists
  {
    regex: /<ul\s*[^>]*>(.*?)<\/ul>/gis,
    blockCreator: (listContent) => null,
    listProcessor: (listContent, blocks) => {
      console.log(`UL processor called with: "${listContent.substring(0, 100)}..."`);
    }
  },
  // Numbered lists  
  {
    regex: /<ol\s*[^>]*>(.*?)<\/ol>/gis,
    blockCreator: (listContent) => null,
    listProcessor: (listContent, blocks) => {
      console.log(`OL processor called with: "${listContent.substring(0, 100)}..."`);
    }
  }
];

console.log('=== BUILDING XML TREE ===');
const xmlTree = NotionAITool.buildXMLTree(content, tagProcessors);

console.log(`\nBuilt XML tree with ${xmlTree.length} root nodes:`);
xmlTree.forEach((node, index) => {
  console.log(`\nRoot Node ${index + 1}:`);
  console.log(`  Tag: ${node.tagName}`);
  console.log(`  Start: ${node.start}, End: ${node.end}`);
  console.log(`  Depth: ${node.depth}`);
  console.log(`  Children: ${node.children.length}`);
  console.log(`  Content: "${node.match.substring(0, 100)}..."`);
  
  if (node.children.length > 0) {
    console.log(`  Child nodes:`);
    node.children.forEach((child, childIndex) => {
      console.log(`    Child ${childIndex + 1}: ${child.tagName} (depth: ${child.depth})`);
      console.log(`      Start: ${child.start}, End: ${child.end}`);
      console.log(`      Content: "${child.match.substring(0, 50)}..."`);
    });
  }
});

console.log('\n=== ANALYSIS ===');
console.log('Expected structure:');
console.log('  1 root node (ul) containing all content');
console.log('  Nested ul and ol should be children, not separate roots');

console.log('\nActual structure:');
console.log(`  ${xmlTree.length} root nodes found`);
if (xmlTree.length > 1) {
  console.log('  ❌ ISSUE: Multiple root nodes means nested lists are being treated as separate trees');
} else {
  console.log('  ✅ Single root node as expected');
}