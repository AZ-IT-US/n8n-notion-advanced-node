const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Exact user AI input content
const userContent = `<h1>Complete Guide to All Notion Block Types with Examples</h1>
<p>This knowledge base page provides comprehensive descriptions and usage examples of every block type available in Notion as of 2024.</p>
<h2>Text Blocks</h2>
<ul>
<li><strong>Paragraph:</strong> <p>This is a paragraph block used for general text content.</p></li>
<li><strong>Heading 1:</strong> <h1>Heading level 1</h1></li>
<li><strong>Heading 2:</strong> <h2>Heading level 2</h2></li>
<li><strong>Heading 3:</strong> <h3>Heading level 3</h3></li>
<li><strong>Quote:</strong> <blockquote>This is a quote block highlighting important text.</blockquote></li>
<li><strong>Callout:</strong> <callout type="info">This is a callout block to emphasize information.</callout></li>
</ul>
<h2>List Blocks</h2>
<ul>
<li><strong>Bulleted List:</strong>
<ul>
<li>Item one</li>
<li>Item two</li>
<li>Item three</li>
</ul>
</li>
<li><strong>Numbered List:</strong>
<ol>
<li>First item</li>
<li>Second item</li>
<li>Third item</li>
</ol>
</li>
<li><strong>To-do List:</strong>
<todo checked="false">Incomplete task</todo>
<todo checked="true">Completed task</todo>
</li>
<li><strong>Toggle List:</strong>
<toggle>Click to expand for details</toggle>
</li>
</ul>
<h2>Media Blocks</h2>
<ul>
<li><strong>Image:</strong> <image src="https://www.notion.so/images/page-cover/notion-cover.png" alt="Notion Logo"/></li>
<li><strong>Video:</strong> <embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><strong>Audio:</strong> <embed>https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3</embed></li>
<li><strong>File:</strong> <bookmark>https://example.com/sample.pdf</bookmark></li>
</ul>
<h2>Database Blocks</h2>
<ul>
<li><strong>Inline Table:</strong> Example of a table database can be created in Notion UI but shown here as a note.</li>
<li><strong>Board View:</strong> Boards categorize content by status or groups (Kanban style).</li>
<li><strong>List View:</strong> Simple list representation of database items.</li>
<li><strong>Gallery View:</strong> Displays database items as cards with images.</li>
<li><strong>Calendar View:</strong> Shows database entries on a calendar timeline.</li>
</ul>
<h2>Advanced Blocks</h2>
<ul>
<li><strong>Code Block:</strong>
<code language="javascript">console.log('Hello, Notion blocks!');</code>
</li>
<li><strong>Equation:</strong> <equation>E = mc^2</equation></li>
<li><strong>Divider:</strong> <divider/></li>
<li><strong>Breadcrumb:</strong> Used for navigation breadcrumbs (not showable in content).</li>
<li><strong>Synced Block:</strong> Allows syncing content across pages (not shown here as static).</li>
<li><strong>Template Button:</strong> Creates new blocks when clicked (not shown here statically).</li>
</ul>
<h2>Embed & Link Blocks</h2>
<ul>
<li><strong>Bookmark:</strong> <bookmark>https://www.notion.so</bookmark></li>
<li><strong>Embed:</strong> <embed>https://twitter.com/Twitter/status/1354143047324299264</embed></li>
</ul>
<h2>Interactive Blocks</h2>
<ul>
<li><strong>To-Do:</strong> <todo checked="false">Task to complete</todo></li>
<li><strong>Toggle:</strong> <toggle>Expandable block content</toggle></li>
</ul>
<callout type="tip">Note: Some blocks like Breadcrumb, Synced Block, and Template Button are interactive UI elements and cannot be fully shown as static examples here but are available in Notion.</callout>`;

console.log('🔍 TESTING USER AI INPUT - Formatting Fix Validation');
console.log('='.repeat(80));

try {
    const result = NotionAITool.parseContentToBlocks(userContent);
    
    console.log(`📊 Total blocks: ${result.length}`);
    
    // Focus on Text Blocks section for formatting validation
    console.log('\n🎯 FOCUSING ON TEXT BLOCKS SECTION:');
    
    let textBlocksFound = false;
    for (let i = 0; i < result.length; i++) {
        const block = result[i];
        const blockData = block[block.type];
        
        if (blockData?.rich_text) {
            const text = blockData.rich_text.map(rt => rt.text?.content || rt.plain_text || '').join('');
            
            if (text === 'Text Blocks') {
                textBlocksFound = true;
                console.log(`Found "Text Blocks" heading at block ${i + 1}`);
                
                // Check the list that follows
                for (let j = i + 1; j < Math.min(i + 8, result.length); j++) {
                    const listBlock = result[j];
                    if (listBlock.type === 'bulleted_list_item') {
                        const listData = listBlock.bulleted_list_item;
                        console.log(`\nList Item ${j - i}: ${listBlock.type}`);
                        
                        if (listData.rich_text) {
                            console.log('  Rich text segments:');
                            listData.rich_text.forEach((rt, rtIndex) => {
                                console.log(`    ${rtIndex + 1}. "${rt.text?.content || rt.plain_text}"`);
                                if (rt.annotations && Object.values(rt.annotations).some(v => v === true)) {
                                    console.log(`       Formatting: ${JSON.stringify(rt.annotations)}`);
                                }
                            });
                        }
                        
                        if (listData.children && listData.children.length > 0) {
                            console.log(`  Children: ${listData.children.length}`);
                            listData.children.forEach((child, childIndex) => {
                                const childData = child[child.type];
                                if (childData?.rich_text) {
                                    const childText = childData.rich_text.map(rt => rt.text?.content || rt.plain_text).join('');
                                    console.log(`    Child ${childIndex + 1}: ${child.type} - "${childText}"`);
                                }
                            });
                        }
                    } else if (listBlock.type !== 'bulleted_list_item') {
                        break; // End of list
                    }
                }
                break;
            }
        }
    }
    
    if (!textBlocksFound) {
        console.log('❌ Could not find "Text Blocks" section');
    }
    
    // Test specific formatting cases
    console.log('\n🔍 TESTING SPECIFIC FORMATTING SCENARIOS:');
    
    const testCases = [
        '<strong>Paragraph:</strong> This is a paragraph block used for general text content.',
        '<strong>Heading 1:</strong> Heading level 1',
        '<strong>Quote:</strong> This is a quote block highlighting important text.'
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\nTest Case ${index + 1}: ${testCase}`);
        
        const processed = NotionAITool.processNestedHtmlInListItem(testCase);
        console.log(`  After processNestedHtmlInListItem(): "${processed}"`);
        
        const richText = NotionAITool.parseBasicMarkdown(processed);
        console.log(`  Rich text segments: ${richText.length}`);
        richText.forEach((rt, rtIndex) => {
            console.log(`    ${rtIndex + 1}. "${rt.text?.content}" - Bold: ${rt.annotations?.bold || false}`);
        });
    });

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}