const { NotionAITool } = require('./dist/nodes/NotionAdvanced/NotionAITool.node.js');

console.log('🔍 DETAILED EXTRACTION DEBUG');
console.log('================================================================================');

// Test the exact content that's being passed to extractListItemsWithBranching
const listContent = `
<li><embed>https://www.youtube.com/watch?v=dQw4w9WgXcQ</embed></li>
<li><embed>https://twitter.com/Interior/status/463440424141459456</embed></li>
`;

console.log('📝 List Content Being Processed:');
console.log(JSON.stringify(listContent));
console.log('\nContent length:', listContent.length);
console.log('First <li position:', listContent.indexOf('<li'));
console.log('Contains <li?:', listContent.includes('<li'));

// Let's manually step through the logic
console.log('\n🔍 Manual stepping through extractListItemsWithBranching logic:');

let pos = 0;
let itemCount = 0;

console.log('Starting position:', pos);

while (pos < listContent.length) {
    console.log(`\n--- Iteration ${itemCount + 1} ---`);
    console.log('Current pos:', pos);
    console.log('Remaining content length:', listContent.length - pos);
    
    // Find next <li> tag at the current level
    const liStart = listContent.indexOf('<li', pos);
    console.log('liStart found at:', liStart);
    
    if (liStart === -1) {
        console.log('No more <li> tags found, breaking');
        break;
    }
    
    const liOpenEnd = listContent.indexOf('>', liStart);
    console.log('liOpenEnd found at:', liOpenEnd);
    
    if (liOpenEnd === -1) {
        console.log('No closing > found for <li>, breaking');
        break;
    }
    
    // Find the matching </li> using proper depth tracking for nested tags
    let depth = 0;
    let searchPos = liOpenEnd + 1; // Start after the opening <li> tag
    let liEnd = -1;
    
    console.log('Starting search for </li> from position:', searchPos);
    
    while (searchPos < listContent.length) {
        const nextLiOpen = listContent.indexOf('<li', searchPos);
        const nextLiClose = listContent.indexOf('</li>', searchPos);
        
        console.log(`  searchPos: ${searchPos}, nextLiOpen: ${nextLiOpen}, nextLiClose: ${nextLiClose}`);
        
        // Handle case where no more closing tags
        if (nextLiClose === -1) {
            console.log('  No more </li> tags found');
            break;
        }
        
        // If there's an opening tag before the next closing tag
        if (nextLiOpen !== -1 && nextLiOpen < nextLiClose) {
            depth++;
            searchPos = nextLiOpen + 3; // Move past '<li'
            console.log(`  Found nested <li>, depth now: ${depth}`);
        } else {
            // Found a closing tag
            if (depth === 0) {
                // This is our matching closing tag
                liEnd = nextLiClose;
                console.log(`  Found matching </li> at: ${liEnd}`);
                break;
            } else {
                // This closing tag belongs to a nested li
                depth--;
                searchPos = nextLiClose + 5; // Move past '</li>'
                console.log(`  Found nested </li>, depth now: ${depth}`);
            }
        }
    }
    
    if (liEnd === -1) {
        console.log('No matching closing tag found, skipping');
        pos = liOpenEnd + 1;
        continue;
    }
    
    // Extract the content between <li> and </li>
    const fullItemContent = listContent.substring(liOpenEnd + 1, liEnd);
    console.log('Full item content:', JSON.stringify(fullItemContent));
    
    if (!fullItemContent.trim()) {
        console.log('Empty content, skipping');
        pos = liEnd + 5;
        continue;
    }
    
    itemCount++;
    console.log(`✅ Found valid list item ${itemCount}`);
    
    pos = liEnd + 5; // Move past </li>
    console.log('Next pos will be:', pos);
    
    // Stop after finding 5 items to avoid infinite loop
    if (itemCount >= 5) {
        console.log('Stopping after 5 items for safety');
        break;
    }
}

console.log(`\n📊 Manual extraction found ${itemCount} items`);

// Now test the actual method
console.log('\n🔍 Testing actual extractListItemsWithBranching method:');
try {
    const result = NotionAITool.extractListItemsWithBranching(listContent);
    console.log(`Actual method found ${result.length} items`);
    
    result.forEach((item, index) => {
        console.log(`Item ${index + 1}:`);
        console.log(`  Text: "${item.text}"`);
        console.log(`  Children: ${item.children.length}`);
        console.log(`  extractedChildBlocks: ${item.extractedChildBlocks?.length || 0}`);
    });
} catch (error) {
    console.error('❌ Error in extractListItemsWithBranching:', error.message);
    console.error(error.stack);
}