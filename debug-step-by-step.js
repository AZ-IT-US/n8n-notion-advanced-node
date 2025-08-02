const content = '<li>Main Item 1<ul><li>Sub Item 1</li><li>Sub Item 2</li></ul></li><li>Main Item 2<ol><li>Sub Step 1</li><li>Sub Step 2</li></ol></li>';

console.log('=== MANUAL STEP-BY-STEP PARSING ===');
console.log('Content:', content);
console.log('Length:', content.length);

let pos = 0;
let itemCount = 0;

while (pos < content.length) {
  console.log(`\n--- Processing from position ${pos} ---`);
  
  // Find next <li> tag
  const liStart = content.indexOf('<li', pos);
  if (liStart === -1) {
    console.log('No more <li> tags found');
    break;
  }
  
  console.log(`Found <li> at position ${liStart}`);
  
  const liOpenEnd = content.indexOf('>', liStart);
  if (liOpenEnd === -1) {
    console.log('Malformed <li> tag');
    break;
  }
  
  console.log(`<li> opening tag ends at position ${liOpenEnd}`);
  
  // Now let's manually trace the depth tracking
  let depth = 0;
  let searchPos = liOpenEnd + 1;
  let liEnd = -1;
  
  console.log(`Starting depth tracking from position ${searchPos}`);
  
  while (searchPos < content.length) {
    const nextLiOpen = content.indexOf('<li', searchPos);
    const nextLiClose = content.indexOf('</li>', searchPos);
    
    console.log(`  Search pos: ${searchPos}, next <li>: ${nextLiOpen}, next </li>: ${nextLiClose}, depth: ${depth}`);
    
    if (nextLiClose === -1) {
      console.log('  No more closing tags');
      break;
    }
    
    if (nextLiOpen !== -1 && nextLiOpen < nextLiClose) {
      depth++;
      console.log(`  Found nested <li> at ${nextLiOpen}, depth now: ${depth}`);
      searchPos = nextLiOpen + 3;
    } else {
      if (depth === 0) {
        liEnd = nextLiClose;
        console.log(`  Found matching </li> at ${nextLiClose}`);
        break;
      } else {
        depth--;
        console.log(`  Found nested </li> at ${nextLiClose}, depth now: ${depth}`);
        searchPos = nextLiClose + 5;
      }
    }
  }
  
  if (liEnd === -1) {
    console.log('No matching </li> found');
    pos = liOpenEnd + 1;
    continue;
  }
  
  const fullItemContent = content.substring(liOpenEnd + 1, liEnd);
  console.log(`Item ${++itemCount} content: "${fullItemContent}"`);
  console.log(`Moving to position ${liEnd + 5}`);
  
  pos = liEnd + 5;
}