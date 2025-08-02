const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('🔍 SIMPLE EMBED DEBUG TEST');
console.log('================================================================================');

// Test simple list with embeds
const simpleContent = `<ul>
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>
</ul>`;

console.log('📝 Simple Content:');
console.log(simpleContent);
console.log('\n');

try {
    const result = NotionAITool.parseContentToBlocks(simpleContent);
    
    console.log('📊 Result Summary:');
    console.log(`Total blocks: ${result.length}`);
    
    console.log('\n🔍 Block Analysis:');
    result.forEach((block, index) => {
        console.log(`Block ${index + 1}: ${block.type}`);
        if (block.type === 'bulleted_list_item') {
            console.log(`  Text: "${block.bulleted_list_item?.rich_text?.[0]?.plain_text || 'N/A'}"`);
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
    
    // Test if embed tags are detected
    console.log('\n🔍 EMBED TAG DETECTION:');
    const embedRegex = /<embed>(.*?)<\/embed>/gi;
    const embedMatches = simpleContent.match(embedRegex);
    console.log(`Found ${embedMatches ? embedMatches.length : 0} embed tags in simple content`);
    if (embedMatches) {
        embedMatches.forEach((match, index) => {
            console.log(`  ${index + 1}. ${match}`);
        });
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}