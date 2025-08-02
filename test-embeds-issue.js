const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('🔍 TESTING EMBEDS ISSUE - Debug Missing Embed Blocks');
console.log('================================================================================');

// User's exact AI input
const userContent = "<h1>Embeds Knowledge Base Example</h1>\n<p>This page provides examples of various embed blocks supported in Notion.</p>\n<ul>\n<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>\n<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>\n<li><embed>https://soundcloud.com/forss/flickermood</embed></li>\n<li><embed>https://www.figma.com/file/abcdef1234567890/Example-Design</embed></li>\n<li><embed>https://gist.github.com/username/1234567890abcdef</embed></li>\n<li><embed>https://docs.google.com/presentation/d/1a2b3c4d5e6f7g8h9i0jklmnopqrs</embed></li>\n<li><embed>https://www.dropbox.com/s/xyz1234abcd/sample.pdf</embed></li>\n<li><embed>https://airtable.com/shr1234567890abcdef</embed></li>\n</ul>";

console.log('📝 Original Content:');
console.log(userContent);
console.log('\n');

try {
    // Test the full processing
    const result = NotionAITool.parseContentToBlocks(userContent);
    
    console.log('📊 Result Summary:');
    console.log(`Total blocks: ${result.length}`);
    
    console.log('\n🔍 Block Analysis:');
    result.forEach((block, index) => {
        console.log(`Block ${index + 1}: ${block.type}`);
        if (block.type === 'bulleted_list_item') {
            console.log(`  Text: "${block.bulleted_list_item?.rich_text?.[0]?.plain_text || 'N/A'}"`);
            console.log(`  Children: ${block.children?.length || 0}`);
            if (block.children) {
                block.children.forEach((child, childIndex) => {
                    console.log(`    Child ${childIndex + 1}: ${child.type}`);
                    if (child.type === 'embed') {
                        console.log(`      URL: ${child.embed?.url || 'N/A'}`);
                    }
                });
            }
        }
    });
    
    // Test if embed tags are being detected at all
    console.log('\n🔍 EMBED TAG DETECTION TEST:');
    const embedRegex = /<embed>(.*?)<\/embed>/gi;
    const embedMatches = userContent.match(embedRegex);
    console.log(`Found ${embedMatches ? embedMatches.length : 0} embed tags in original content`);
    if (embedMatches) {
        embedMatches.forEach((match, index) => {
            console.log(`  ${index + 1}. ${match}`);
        });
    }
    
    // Test the supported child block types
    console.log('\n🔍 CHECKING SUPPORTED CHILD BLOCK TYPES:');
    const supportedTypes = [
        'paragraph', 'heading_1', 'heading_2', 'heading_3', 'callout', 'quote',
        'bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle',
        'code', 'image', 'video', 'file', 'pdf', 'bookmark', 'embed',
        'equation', 'divider', 'table_of_contents', 'breadcrumb', 'column_list',
        'column', 'link_preview', 'synced_block', 'template', 'link_to_page'
    ];
    
    console.log('Embed supported as child block:', supportedTypes.includes('embed'));
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}