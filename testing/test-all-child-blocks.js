const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Test content with ALL supported child block types in list items
const testContent = `
<ul>
<li><p>This is a paragraph child block</p></li>
<li><h1>Heading 1 child block</h1></li>
<li><h2>Heading 2 child block</h2></li>
<li><h3>Heading 3 child block</h3></li>
<li><quote>This is a quote child block</quote></li>
<li><callout type="info">This is a callout child block</callout></li>
<li><code language="javascript">console.log('code block');</code></li>
<li><todo checked="false">This is a todo child block</todo></li>
<li><toggle>This is a toggle child block</toggle></li>
<li><equation>E=mc^2</equation></li>
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><bookmark>https://www.example.com</bookmark></li>
<li><image src="https://example.com/image.jpg" alt="test image">Image caption</image></li>
<li><divider/></li>
</ul>
`;

console.log('🔍 COMPREHENSIVE CHILD BLOCK TYPE TEST');
console.log('================================================================================');
console.log('📝 Testing ALL supported child block types in list items:');
console.log(testContent.trim());
console.log('\n');

try {
  const blocks = NotionAITool.parseContentToBlocks(testContent);
  
  console.log(`📊 Result Summary:`);
  console.log(`Total blocks: ${blocks.length}`);
  console.log('\n');
  
  console.log('🔍 Block Analysis:');
  
  let totalChildBlocks = 0;
  const childBlockTypes = new Set();
  
  blocks.forEach((block, index) => {
    console.log(`Block ${index + 1}: ${block.type}`);
    
    if (block.type === 'bulleted_list_item') {
      const listData = block.bulleted_list_item;
      const textContent = listData.rich_text && listData.rich_text.length > 0 
        ? listData.rich_text.map(rt => rt.text?.content || '').join('') 
        : 'N/A';
      console.log(`  Text: "${textContent}"`);
      
      if (listData.children && listData.children.length > 0) {
        console.log(`  Children: ${listData.children.length}`);
        listData.children.forEach((child, childIndex) => {
          console.log(`    Child ${childIndex + 1}: ${child.type}`);
          childBlockTypes.add(child.type);
          totalChildBlocks++;
          
          // Show child block details
          switch (child.type) {
            case 'paragraph':
              const pText = child.paragraph.rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`      Text: "${pText}"`);
              break;
            case 'heading_1':
            case 'heading_2': 
            case 'heading_3':
              const hText = child[child.type].rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`      Text: "${hText}"`);
              break;
            case 'quote':
              const qText = child.quote.rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`      Text: "${qText}"`);
              break;
            case 'callout':
              const cText = child.callout.rich_text.map(rt => rt.text?.content || '').join('');
              const cEmoji = child.callout.icon?.emoji || '';
              console.log(`      Text: "${cText}" (${cEmoji})`);
              break;
            case 'code':
              const codeText = child.code.rich_text.map(rt => rt.text?.content || '').join('');
              const lang = child.code.language || '';
              console.log(`      Code: "${codeText}" (${lang})`);
              break;
            case 'to_do':
              const todoText = child.to_do.rich_text.map(rt => rt.text?.content || '').join('');
              const checked = child.to_do.checked ? 'checked' : 'unchecked';
              console.log(`      Todo: "${todoText}" (${checked})`);
              break;
            case 'toggle':
              const toggleText = child.toggle.rich_text.map(rt => rt.text?.content || '').join('');
              console.log(`      Toggle: "${toggleText}"`);
              break;
            case 'equation':
              console.log(`      Expression: "${child.equation.expression}"`);
              break;
            case 'embed':
              console.log(`      URL: ${child.embed.url}`);
              break;
            case 'bookmark':
              console.log(`      URL: ${child.bookmark.url}`);
              break;
            case 'image':
              console.log(`      URL: ${child.image.external.url}`);
              if (child.image.caption && child.image.caption.length > 0) {
                const caption = child.image.caption.map(rt => rt.text?.content || '').join('');
                console.log(`      Caption: "${caption}"`);
              }
              break;
            case 'divider':
              console.log(`      Divider block`);
              break;
          }
        });
      } else {
        console.log(`  Children: 0`);
      }
    }
    console.log('');
  });
  
  console.log('📈 COMPREHENSIVE SUMMARY:');
  console.log(`Total list items: ${blocks.length}`);
  console.log(`Total child blocks: ${totalChildBlocks}`);
  console.log(`Unique child block types: ${childBlockTypes.size}`);
  console.log(`Child block types found: ${Array.from(childBlockTypes).sort().join(', ')}`);
  
  // Expected child block types
  const expectedTypes = [
    'paragraph', 'heading_1', 'heading_2', 'heading_3', 
    'quote', 'callout', 'code', 'to_do', 'toggle', 
    'equation', 'embed', 'bookmark', 'image', 'divider'
  ];
  
  console.log(`\n🎯 COVERAGE ANALYSIS:`);
  console.log(`Expected types: ${expectedTypes.length}`);
  console.log(`Found types: ${childBlockTypes.size}`);
  
  const missingTypes = expectedTypes.filter(type => !childBlockTypes.has(type));
  const extraTypes = Array.from(childBlockTypes).filter(type => !expectedTypes.includes(type));
  
  if (missingTypes.length === 0 && extraTypes.length === 0) {
    console.log(`✅ PERFECT COVERAGE: All ${expectedTypes.length} expected child block types working!`);
  } else {
    if (missingTypes.length > 0) {
      console.log(`❌ Missing types: ${missingTypes.join(', ')}`);
    }
    if (extraTypes.length > 0) {
      console.log(`⚠️ Extra types: ${extraTypes.join(', ')}`);
    }
  }
  
} catch (error) {
  console.error('❌ Error during processing:', error);
  console.error('Stack:', error.stack);
}