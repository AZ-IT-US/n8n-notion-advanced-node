const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Test the specific formatting issue from user feedback
const testContent = `<ul><li><strong>Paragraph:</strong> <p>This is a paragraph block used for general text content.</p></li><li><strong>Heading 1:</strong> <h1>Heading level 1</h1></li></ul>`;

console.log('🔍 DEBUG: Text Formatting Issue in List Items');
console.log('='.repeat(80));
console.log('Input XML:', testContent);
console.log('='.repeat(80));

try {
    const result = NotionAITool.parseContentToBlocks(testContent);
    
    console.log(`📊 Total blocks: ${result.length}`);
    
    result.forEach((block, index) => {
        console.log(`\nBlock ${index + 1}: ${block.type}`);
        
        const blockData = block[block.type];
        if (blockData?.rich_text) {
            console.log('  Rich text content:');
            blockData.rich_text.forEach((rt, rtIndex) => {
                console.log(`    ${rtIndex + 1}. Text: "${rt.text?.content || rt.plain_text}"`);
                if (rt.annotations) {
                    console.log(`       Annotations: ${JSON.stringify(rt.annotations)}`);
                }
            });
        }
        
        if (blockData?.children) {
            console.log(`  Children: ${blockData.children.length}`);
            blockData.children.forEach((child, childIndex) => {
                const childData = child[child.type];
                if (childData?.rich_text) {
                    const childText = childData.rich_text.map(rt => rt.text?.content || rt.plain_text).join('');
                    console.log(`    Child ${childIndex + 1}: ${child.type} - "${childText}"`);
                }
            });
        }
    });

    // Specifically test the text processing functions
    console.log('\n🔍 TESTING TEXT PROCESSING FUNCTIONS:');
    
    const rawListText = '<strong>Paragraph:</strong> This is a paragraph block used for general text content.';
    console.log('Raw list text:', rawListText);
    
    const cleanedText = NotionAITool.processNestedHtmlInListItem(rawListText);
    console.log('After processNestedHtmlInListItem():', cleanedText);
    
    const richText = NotionAITool.parseBasicMarkdown(cleanedText);
    console.log('After parseBasicMarkdown():', JSON.stringify(richText, null, 2));

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}