const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Exact user input from feedback
const userContent = `<h1>Different Format Types in Notion</h1><p>This page demonstrates various formatting types used in Notion with examples.</p><h2>Text Blocks</h2><ul><li>Paragraph: <p>This is a paragraph.</p></li><li>Headings: <h1>Main Title</h1>, <h2>Section Title</h2>, <h3>Subsection Title</h3></li><li>Blockquote: <blockquote>Quote text example.</blockquote></li></ul><h2>Lists</h2><ul><li>Unordered list with bullets.</li><li>Ordered list with numbers.</li></ul><h2>Callouts</h2><callout type="info">Information callout example.</callout><callout type="warning">Warning callout example.</callout><h2>Code Blocks</h2><code language="javascript">console.log('Hello, Notion!');</code><h2>Tasks</h2><todo checked="false">Task to be done.</todo><todo checked="true">Task completed.</todo><h2>Media Embeds</h2><embed>https://youtu.be/dQw4w9WgXcQ</embed><image src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React Icon"/><bookmark>https://github.com/facebook/react</bookmark><h2>Math and Equations</h2><equation>E=mc^2</equation><h2>Layout</h2><divider/><toggle>Toggle content example.</toggle>`;

console.log('🔍 DEBUG: Exact User Input Analysis');
console.log('='.repeat(80));

try {
    const result = NotionAITool.parseContentToBlocks(userContent);
    
    console.log(`📊 Total blocks: ${result.length}`);
    
    // Focus on the problematic section
    console.log('\n🎯 FOCUSING ON "Text Blocks" SECTION:');
    
    let textBlocksIndex = -1;
    let problemListStart = -1;
    
    result.forEach((block, index) => {
        const blockData = block[block.type];
        let text = '';
        
        if (blockData?.rich_text) {
            text = blockData.rich_text.map(rt => rt.plain_text || rt.text?.content || '').join('');
        }
        
        if (text === 'Text Blocks') {
            textBlocksIndex = index;
            console.log(`Found "Text Blocks" at index ${index}`);
        }
        
        if (textBlocksIndex >= 0 && block.type === 'bulleted_list_item' && problemListStart === -1) {
            problemListStart = index;
            console.log(`First list item after "Text Blocks" starts at index ${index}`);
        }
    });
    
    // Analyze the problematic list section
    if (problemListStart >= 0) {
        console.log('\n📋 PROBLEMATIC LIST ANALYSIS:');
        
        for (let i = problemListStart; i < result.length && result[i].type === 'bulleted_list_item'; i++) {
            const block = result[i];
            const blockData = block.bulleted_list_item;
            const text = blockData.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || '';
            
            console.log(`\nList Item ${i - problemListStart + 1} (Block ${i + 1}): "${text}"`);
            
            if (blockData.children && blockData.children.length > 0) {
                console.log(`  Children (${blockData.children.length}):`);
                blockData.children.forEach((child, childIndex) => {
                    const childData = child[child.type];
                    let childText = '';
                    if (childData?.rich_text) {
                        childText = childData.rich_text.map(rt => rt.plain_text || rt.text?.content || '').join('');
                    }
                    console.log(`    ${childIndex + 1}. ${child.type}: "${childText}"`);
                });
            } else {
                console.log('  Children: 0');
            }
        }
    }
    
    // Check what happens after the list
    console.log('\n🔍 BLOCKS AFTER THE PROBLEMATIC LIST:');
    let afterListStart = problemListStart;
    while (afterListStart < result.length && result[afterListStart].type === 'bulleted_list_item') {
        afterListStart++;
    }
    
    for (let i = afterListStart; i < Math.min(afterListStart + 5, result.length); i++) {
        const block = result[i];
        const blockData = block[block.type];
        let text = '';
        
        if (blockData?.rich_text) {
            text = blockData.rich_text.map(rt => rt.plain_text || rt.text?.content || '').join('');
        }
        
        console.log(`Block ${i + 1}: ${block.type} - "${text}"`);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}