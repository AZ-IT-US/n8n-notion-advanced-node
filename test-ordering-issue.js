const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Create test input matching user's reported issue
const testContent = `<h1>Different Format Types in Notion</h1><p>This page demonstrates various formatting types used in Notion with examples.</p><h2>Text Blocks</h2><ul><li>Paragraph: <p>This is a paragraph.</p></li><li>Headings: <h1>Main Title</h1>, <h2>Section Title</h2>, <h3>Subsection Title</h3></li><li>Blockquote: <blockquote>Quote text example.</blockquote></li></ul><h2>Lists</h2><ul><li>Unordered list with bullets.</li><li>Ordered list with numbers.</li></ul><h2>Callouts</h2><callout type="info">Information callout example.</callout><callout type="warning">Warning callout example.</callout>`;

console.log('🔍 Testing Ordering Issue - Block Elements Nested in List Items');
console.log('='.repeat(80));

try {
    // Process the content
    const result = NotionAITool.parseContentToBlocks(testContent);
    
    console.log('\n📊 PROCESSING RESULTS:');
    console.log('Total blocks created:', result.length);
    
    console.log('\n📋 BLOCK ORDER AND TYPES:');
    result.forEach((block, index) => {
        const type = block.type;
        let preview = '';
        
        if (block[type] && block[type].rich_text) {
            const text = block[type].rich_text.map(rt => rt.plain_text || '').join('');
            preview = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        } else if (block[type] && block[type].text) {
            const text = block[type].text.map(rt => rt.plain_text || '').join('');
            preview = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        }
        
        console.log(`${index + 1}. ${type}: "${preview}"`);
        
        // Show children count if any
        if (block.children && block.children.length > 0) {
            console.log(`   └─ Children: ${block.children.length}`);
        }
    });
    
    console.log('\n🔍 ANALYZING SPECIFIC ISSUE:');
    console.log('Looking for the problematic pattern...');
    
    // Look for the specific issue: list items followed by separate paragraph/heading blocks
    let issueFound = false;
    for (let i = 0; i < result.length - 1; i++) {
        const current = result[i];
        const next = result[i + 1];
        
        if (current.type === 'bulleted_list_item') {
            const currentText = current.bulleted_list_item.rich_text.map(rt => rt.plain_text || '').join('');
            
            // Check if this list item mentions paragraph/heading content
            if (currentText.includes('Paragraph:') && next.type === 'paragraph') {
                console.log(`❌ ISSUE FOUND: List item "${currentText}" followed by separate paragraph block`);
                issueFound = true;
            }
            
            if (currentText.includes('Headings:') && next.type === 'heading_1') {
                console.log(`❌ ISSUE FOUND: List item "${currentText}" followed by separate heading block`);
                issueFound = true;
            }
            
            if (currentText.includes('Blockquote:') && next.type === 'quote') {
                console.log(`❌ ISSUE FOUND: List item "${currentText}" followed by separate quote block`);
                issueFound = true;
            }
        }
    }
    
    if (!issueFound) {
        console.log('✅ No ordering issues detected');
    }

} catch (error) {
    console.error('❌ Error during processing:', error.message);
    console.error('Stack:', error.stack);
}