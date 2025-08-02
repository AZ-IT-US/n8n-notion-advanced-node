const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('🔍 EMBED TRACE DEBUG');
console.log('================================================================================');

// Test simple list with embeds
const simpleContent = `<ul>
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>
</ul>`;

console.log('📝 Input Content:');
console.log(simpleContent);
console.log('\n');

// Test the extractListItemsWithBranching method directly
console.log('🔍 Testing extractListItemsWithBranching directly:');
try {
    // Extract just the list content (without <ul> tags)
    const listContent = simpleContent.match(/<ul[^>]*>(.*?)<\/ul>/s)?.[1] || '';
    console.log('List content extracted:', JSON.stringify(listContent));
    
    const listItems = NotionAITool.extractListItemsWithBranching(listContent);
    console.log(`Found ${listItems.length} list items`);
    
    listItems.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log(`  Text: "${item.text}"`);
        console.log(`  Children: ${item.children.length}`);
        console.log(`  Extracted child blocks: ${item.extractedChildBlocks?.length || 0}`);
        
        if (item.extractedChildBlocks) {
            item.extractedChildBlocks.forEach((block, blockIndex) => {
                console.log(`    Block ${blockIndex + 1}: ${block.type}`);
                if (block.type === 'embed') {
                    console.log(`      URL: ${block.embed?.url}`);
                }
            });
        }
    });
    
} catch (error) {
    console.error('❌ Error in extractListItemsWithBranching:', error.message);
}

console.log('\n🔍 Testing full parseContentToBlocks:');
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