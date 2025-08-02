 const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

const listChildrenTestContent = `<h1>Comprehensive List Children Block Types Test</h1>
<p>This test validates all supported child block types within list items.</p>

<callout type="info">Testing all possible block types that can be children of list items in Notion.</callout>

<h2>Bulleted List with All Child Block Types</h2>
<ul>
<li>List item with paragraph child
  <p>This is a paragraph child block with <strong>bold</strong> and <em>italic</em> formatting.</p>
</li>
<li>List item with heading children
  <h1>Heading 1 Child</h1>
  <h2>Heading 2 Child</h2>
  <h3>Heading 3 Child</h3>
</li>
<li>List item with nested lists
  <ul>
    <li>Nested bulleted item</li>
    <li>Another nested item</li>
  </ul>
  <ol>
    <li>Nested numbered item</li>
    <li>Another numbered item</li>
  </ol>
</li>
<li>List item with to-do children
  <todo checked="false">Incomplete task child</todo>
  <todo checked="true">Completed task child</todo>
</li>
<li>List item with toggle child
  <toggle>Expandable toggle child content</toggle>
</li>
<li>List item with code block child
  <code language="javascript">
function childFunction() {
  return "This is a code block child";
}
  </code>
</li>
<li>List item with quote child
  <quote>This is a quote block child with important information.</quote>
</li>
<li>List item with callout child
  <callout type="warning">This is a callout child block with warning styling.</callout>
</li>
<li>List item with divider child
  <divider/>
</li>
<li>List item with image child
  <image src="https://example.com/child-image.jpg" alt="Child image">Image caption as child</image>
</li>
<li>List item with bookmark child
  <bookmark>https://www.notion.so/child-bookmark</bookmark>
</li>
<li>List item with embed child
  <embed>https://www.youtube.com/watch?v=child-video</embed>
</li>
<li>List item with equation child
  <equation>E = mc^2 + child</equation>
</li>
<li>List item with blockquote child
  <blockquote>This is a blockquote child element for extended quotes.</blockquote>
</li>
<li>List item with preformatted text child
  <pre>
This is preformatted text as a child
    with preserved spacing
        and indentation.
  </pre>
</li>
</ul>

<h2>Numbered List with Complex Nested Children</h2>
<ol>
<li>Step 1: Multiple child types
  <p>Paragraph explaining step 1</p>
  <callout type="info">Important note about step 1</callout>
  <code language="bash">command --for-step-1</code>
</li>
<li>Step 2: Media and interactive children
  <image src="https://example.com/step2.jpg" alt="Step 2 illustration"/>
  <toggle>Additional details for step 2</toggle>
  <todo checked="false">Complete step 2 verification</todo>
</li>
<li>Step 3: Nested structure with all types
  <h3>Step 3 Details</h3>
  <p>Overview of step 3</p>
  <ul>
    <li>Sub-task A
      <callout type="tip">Pro tip for sub-task A</callout>
    </li>
    <li>Sub-task B
      <code language="python">print("Sub-task B implementation")</code>
    </li>
  </ul>
  <quote>Remember: Step 3 is crucial for success</quote>
  <divider/>
  <bookmark>https://docs.example.com/step3</bookmark>
</li>
</ol>

<h2>Mixed List Types with Deep Nesting</h2>
<ul>
<li>Project Phase 1
  <h2>Phase 1 Overview</h2>
  <p>This phase involves multiple components</p>
  <ol>
    <li>Component A
      <callout type="info">Component A requires special attention</callout>
      <ul>
        <li>Sub-component A1
          <code language="sql">SELECT * FROM component_a1;</code>
          <todo checked="false">Implement A1 database queries</todo>
        </li>
        <li>Sub-component A2
          <image src="https://example.com/a2-diagram.png" alt="A2 Architecture"/>
          <toggle>A2 Implementation Details</toggle>
        </li>
      </ul>
    </li>
    <li>Component B
      <quote>Component B is the foundation of our system</quote>
      <equation>ComponentB = ∑(inputs) × efficiency</equation>
      <divider/>
      <embed>https://www.figma.com/component-b-design</embed>
    </li>
  </ol>
</li>
<li>Project Phase 2
  <blockquote>Phase 2 builds upon the solid foundation of Phase 1</blockquote>
  <pre>
Configuration for Phase 2:
  enabled: true
  mode: production
  optimization: maximum
  </pre>
  <bookmark>https://project-docs.example.com/phase2</bookmark>
</li>
</ul>

<callout type="success">If all block types render correctly with proper nesting, the test passes!</callout>`;

console.log('=== COMPREHENSIVE LIST CHILDREN BLOCK TYPES TEST ===');
console.log(`Input content length: ${listChildrenTestContent.length} characters`);

try {
  const blocks = NotionAITool.parseContentToBlocks(listChildrenTestContent);
  
  console.log('\n=== BLOCKS ANALYSIS ===');
  console.log(`Total blocks created: ${blocks.length}`);
  
  // Function to recursively analyze block structure
  function analyzeBlock(block, depth = 0, path = '') {
    const indent = '  '.repeat(depth);
    const blockPath = path ? `${path}.${block.type}` : block.type;
    
    console.log(`${indent}${block.type}`);
    
    // Get block-specific data
    const blockData = block[block.type];
    if (blockData) {
      // Show text content if available
      if (blockData.rich_text && blockData.rich_text[0]?.text?.content) {
        const text = blockData.rich_text[0].text.content;
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
        console.log(`${indent}  Text: "${preview}"`);
      }
      
      // Show special properties
      if (block.type === 'callout' && blockData.icon?.emoji) {
        console.log(`${indent}  Emoji: ${blockData.icon.emoji}`);
      }
      if (block.type === 'to_do' && blockData.checked !== undefined) {
        console.log(`${indent}  Checked: ${blockData.checked}`);
      }
      if (block.type === 'code' && blockData.language) {
        console.log(`${indent}  Language: ${blockData.language}`);
      }
      if (block.type === 'image' && blockData.external?.url) {
        console.log(`${indent}  URL: ${blockData.external.url}`);
      }
      
      // Recursively analyze children
      if (blockData.children && blockData.children.length > 0) {
        console.log(`${indent}  Children (${blockData.children.length}):`);
        blockData.children.forEach((child, index) => {
          analyzeBlock(child, depth + 2, `${blockPath}[${index}]`);
        });
      }
    }
  }
  
  // Analyze all blocks
  blocks.forEach((block, index) => {
    console.log(`\nBlock ${index + 1}:`);
    analyzeBlock(block, 1);
  });
  
  // Count all block types (including nested)
  function countAllBlockTypes(blocks, counts = {}) {
    blocks.forEach(block => {
      counts[block.type] = (counts[block.type] || 0) + 1;
      
      const blockData = block[block.type];
      if (blockData?.children) {
        countAllBlockTypes(blockData.children, counts);
      }
    });
    return counts;
  }
  
  const allBlockCounts = countAllBlockTypes(blocks);
  
  console.log('\n=== ALL BLOCK TYPE COUNTS (INCLUDING NESTED) ===');
  Object.entries(allBlockCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  // Check for expected child block types
  const expectedChildTypes = [
    'paragraph', 'heading_1', 'heading_2', 'heading_3',
    'bulleted_list_item', 'numbered_list_item', 'to_do',
    'toggle', 'code', 'quote', 'callout', 'divider',
    'image', 'bookmark', 'embed', 'equation'
  ];
  
  console.log('\n=== CHILD BLOCK TYPES VALIDATION ===');
  expectedChildTypes.forEach(type => {
    if (allBlockCounts[type]) {
      console.log(`  ✅ FOUND: ${type} (${allBlockCounts[type]})`);
    } else {
      console.log(`  ❌ MISSING: ${type}`);
    }
  });
  
  // Validate nested structure integrity
  function validateNestedStructure(blocks, path = '') {
    let issues = [];
    
    blocks.forEach((block, index) => {
      const currentPath = `${path}[${index}]`;
      
      if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
        const blockData = block[block.type];
        if (blockData?.children) {
          // Check if children contain at least some expected types
          const childTypes = blockData.children.map(child => child.type);
          console.log(`    ${currentPath} has children: ${childTypes.join(', ')}`);
          
          // Recursively validate children
          const childIssues = validateNestedStructure(blockData.children, currentPath + '.children');
          issues = issues.concat(childIssues);
        }
      }
    });
    
    return issues;
  }
  
  console.log('\n=== NESTED STRUCTURE VALIDATION ===');
  const structureIssues = validateNestedStructure(blocks);
  
  if (structureIssues.length === 0) {
    console.log('✅ All nested structures are valid');
  } else {
    console.log('❌ Structure issues found:');
    structureIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total blocks: ${blocks.length}`);
  console.log(`Unique block types: ${Object.keys(allBlockCounts).length}`);
  console.log(`Expected child types found: ${expectedChildTypes.filter(type => allBlockCounts[type]).length}/${expectedChildTypes.length}`);
  
} catch (error) {
  console.error('❌ Error in list children test:', error);
  console.error('Stack:', error.stack);
}