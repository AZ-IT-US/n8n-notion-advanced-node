const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('🔍 COMPLEX HIERARCHY DEBUG');
console.log('================================================================================');

// Test user's complex embed example
const complexContent = `<h1>Embeds Knowledge Base Example</h1>
<p>This page provides examples of various embed blocks supported in Notion.</p>
<ul>
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>
<li><embed>https://soundcloud.com/forss/flickermood</embed></li>
<li><embed>https://www.figma.com/file/abcdef1234567890/Example-Design</embed></li>
<li><embed>https://gist.github.com/username/1234567890abcdef</embed></li>
<li><embed>https://docs.google.com/presentation/d/1a2b3c4d5e6f7g8h9i0jklmnopqrs</embed></li>
<li><embed>https://www.dropbox.com/s/xyz1234abcd/sample.pdf</embed></li>
<li><embed>https://airtable.com/shr1234567890abcdef</embed></li>
</ul>`;

console.log('📝 Testing just the list portion:');
const listContent = `<ul>
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>
<li><embed>https://soundcloud.com/forss/flickermood</embed></li>
<li><embed>https://www.figma.com/file/abcdef1234567890/Example-Design</embed></li>
<li><embed>https://gist.github.com/username/1234567890abcdef</embed></li>
<li><embed>https://docs.google.com/presentation/d/1a2b3c4d5e6f7g8h9i0jklmnopqrs</embed></li>
<li><embed>https://www.dropbox.com/s/xyz1234abcd/sample.pdf</embed></li>
<li><embed>https://airtable.com/shr1234567890abcdef</embed></li>
</ul>`;

console.log(listContent);

// Test list content processing
try {
    const result = NotionAITool.parseContentToBlocks(listContent);
    
    console.log(`\n📊 List Processing Result: ${result.length} blocks`);
    
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
    
    // Now test the full complex content
    console.log('\n🔍 Testing full complex content:');
    const fullResult = NotionAITool.parseContentToBlocks(complexContent);
    
    console.log(`\nFull Content Result: ${fullResult.length} blocks`);
    
    // Count different block types
    const blockTypes = {};
    let listItemsWithChildren = 0;
    let totalEmbedChildren = 0;
    
    fullResult.forEach((block) => {
        blockTypes[block.type] = (blockTypes[block.type] || 0) + 1;
        
        if (block.type === 'bulleted_list_item') {
            const children = block.bulleted_list_item?.children || [];
            if (children.length > 0) {
                listItemsWithChildren++;
                totalEmbedChildren += children.filter(child => child.type === 'embed').length;
            }
        }
    });
    
    console.log('\nBlock type summary:');
    Object.entries(blockTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    
    console.log(`\nList items with children: ${listItemsWithChildren}`);
    console.log(`Total embed children: ${totalEmbedChildren}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}