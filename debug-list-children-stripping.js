const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Create test input with specific focus on list items with nested blocks
const testContent = `<ul><li>Paragraph: <p>This is a paragraph.</p></li><li>Headings: <h1>Main Title</h1>, <h2>Section Title</h2>, <h3>Subsection Title</h3></li><li>Blockquote: <blockquote>Quote text example.</blockquote></li></ul>`;

console.log('🔍 DEBUG: List Children Stripping Issue');
console.log('='.repeat(80));
console.log('Input XML:', testContent);
console.log('='.repeat(80));

try {
    const result = NotionAITool.parseContentToBlocks(testContent);
    
    console.log('\n📊 PROCESSING RESULTS:');
    console.log('Total blocks created:', result.length);
    
    result.forEach((block, index) => {
        console.log(`\nBlock ${index + 1}: ${block.type}`);
        
        const blockData = block[block.type];
        if (blockData) {
            // Show text content
            if (blockData.rich_text) {
                const text = blockData.rich_text.map(rt => rt.plain_text || rt.text?.content || '').join('');
                console.log(`  Text: "${text}"`);
            }
            
            // Show children
            if (blockData.children) {
                console.log(`  Children: ${blockData.children.length}`);
                blockData.children.forEach((child, childIndex) => {
                    const childData = child[child.type];
                    let childText = '';
                    if (childData?.rich_text) {
                        childText = childData.rich_text.map(rt => rt.plain_text || rt.text?.content || '').join('');
                    }
                    console.log(`    Child ${childIndex + 1}: ${child.type} - "${childText}"`);
                });
            } else {
                console.log('  Children: 0');
            }
        }
    });
    
    console.log('\n❌ ISSUE ANALYSIS:');
    
    // Check each list item for expected child blocks
    const listItems = result.filter(block => block.type === 'bulleted_list_item');
    
    listItems.forEach((item, index) => {
        const itemData = item.bulleted_list_item;
        const text = itemData.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || '';
        
        console.log(`\nList Item ${index + 1}: "${text}"`);
        
        if (text.includes('Paragraph:')) {
            if (!itemData.children || !itemData.children.find(child => child.type === 'paragraph')) {
                console.log('  ❌ MISSING: Should have paragraph child block');
            } else {
                console.log('  ✅ FOUND: Has paragraph child block');
            }
        }
        
        if (text.includes('Headings:')) {
            if (!itemData.children || !itemData.children.find(child => child.type.startsWith('heading_'))) {
                console.log('  ❌ MISSING: Should have heading child blocks');
            } else {
                console.log('  ✅ FOUND: Has heading child blocks');
            }
        }
        
        if (text.includes('Blockquote:')) {
            if (!itemData.children || !itemData.children.find(child => child.type === 'quote')) {
                console.log('  ❌ MISSING: Should have quote child block');
            } else {
                console.log('  ✅ FOUND: Has quote child block');
            }
        }
    });

} catch (error) {
    console.error('❌ Error during processing:', error.message);
    console.error('Stack:', error.stack);
}