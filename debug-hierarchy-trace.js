const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('🔍 HIERARCHY PROCESSING TRACE');
console.log('================================================================================');

// Test simple list with embeds
const simpleContent = `<ul>
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>
</ul>`;

console.log('📝 Input Content:');
console.log(simpleContent);
console.log('\n');

// Test the processXmlTags method directly
console.log('🔍 Testing processXmlTags directly:');
try {
    const blocks = [];
    const processedContent = NotionAITool.processXmlTags(simpleContent, blocks);
    
    console.log(`Blocks created by processXmlTags: ${blocks.length}`);
    blocks.forEach((block, index) => {
        console.log(`Block ${index + 1}: ${block.type}`);
        if (block.type === 'bulleted_list_item') {
            console.log(`  Text: "${block.bulleted_list_item?.rich_text?.[0]?.text?.content || 'N/A'}"`);
            console.log(`  Children: ${block.bulleted_list_item?.children?.length || 0}`);
            if (block.bulleted_list_item?.children) {
                block.bulleted_list_item.children.forEach((child, childIndex) => {
                    console.log(`    Child ${childIndex + 1}: ${child.type}`);
                    if (child.type === 'embed') {
                        console.log(`      URL: ${child.embed?.url || 'N/A'}`);
                    }
                });
            }
        }
    });
    
    console.log(`\nProcessed content: "${processedContent}"`);
    console.log(`Processed content length: ${processedContent.length}`);
    
} catch (error) {
    console.error('❌ Error in processXmlTags:', error.message);
    console.error(error.stack);
}

console.log('\n🔍 Testing parseContentToBlocks full flow:');
try {
    const result = NotionAITool.parseContentToBlocks(simpleContent);
    
    console.log('📊 Result Summary:');
    console.log(`Total blocks: ${result.length}`);
    
    result.forEach((block, index) => {
        console.log(`\nBlock ${index + 1}: ${block.type}`);
        if (block.type === 'bulleted_list_item') {
            console.log(`  Text: "${block.bulleted_list_item?.rich_text?.[0]?.text?.content || 'N/A'}"`);
            console.log(`  Children: ${block.bulleted_list_item?.children?.length || 0}`);
            if (block.bulleted_list_item?.children) {
                block.bulleted_list_item.children.forEach((child, childIndex) => {
                    console.log(`    Child ${childIndex + 1}: ${child.type}`);
                    if (child.type === 'embed') {
                        console.log(`      URL: ${child.embed?.url || 'N/A'}`);
                    }
                });
            }
        }
    });
    
} catch (error) {
    console.error('❌ Error in parseContentToBlocks:', error.message);
    console.error(error.stack);
}