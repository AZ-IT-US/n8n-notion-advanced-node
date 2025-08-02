const { NotionAITool } = require('../dist/nodes/NotionAdvanced/NotionAITool.node.js');

// Simple test to debug position mapping
const testContent = `<ul><li>Paragraph: <p>This is a paragraph.</p></li><li>Headings: <h1>Main Title</h1>, <h2>Section Title</h2>, <h3>Subsection Title</h3></li><li>Blockquote: <blockquote>Quote text example.</blockquote></li></ul>`;

console.log('🔍 DEBUG: Position Mapping Issue');
console.log('='.repeat(80));
console.log('Input XML:', testContent);
console.log('='.repeat(80));

// Let's manually check what the hierarchy nodes look like
class DebugNotionAITool extends NotionAITool {
  static debugBuildXMLTree(content, tagProcessors) {
    console.log('\n📊 Building XML Tree...');
    const tree = super.buildXMLTree(content, tagProcessors);
    
    console.log(`Found ${tree.length} root nodes:`);
    tree.forEach((node, index) => {
      console.log(`  Root ${index}: ${node.tagName} at ${node.start}-${node.end}`);
      if (node.children.length > 0) {
        node.children.forEach((child, childIndex) => {
          console.log(`    Child ${childIndex}: ${child.tagName} at ${child.start}-${child.end}`);
        });
      }
    });
    
    return tree;
  }
  
  static debugXmlTreeToHierarchy(nodes) {
    console.log('\n📊 Converting XML Tree to Hierarchy...');
    const hierarchy = super.xmlTreeToHierarchy(nodes);
    
    console.log(`Generated ${hierarchy.length} hierarchy nodes:`);
    hierarchy.forEach((node, index) => {
      console.log(`  Hierarchy ${index}: ${node.metadata?.tagName} sourcePosition=${node.metadata?.sourcePosition}`);
      if (node.children.length > 0) {
        node.children.forEach((child, childIndex) => {
          console.log(`    Child ${childIndex}: ${child.metadata?.tagName} sourcePosition=${child.metadata?.sourcePosition}`);
        });
      }
    });
    
    return hierarchy;
  }
}

try {
    console.log('\n🔍 STEP 1: Building Tag Processors...');
    
    // Get tag processors (simplified version for debugging)
    const tagProcessors = [
      {
        regex: /<h([123])>(.*?)<\/h[123]>/gis,
        blockCreator: (level, content) => {
          const headingType = `heading_${level}`;
          return {
            type: headingType,
            [headingType]: {
              rich_text: [{ type: 'text', text: { content: content.trim() } }],
            },
          };
        }
      },
      {
        regex: /<p>(.*?)<\/p>/gis,
        blockCreator: (content) => {
          return {
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: content.trim() } }],
            },
          };
        }
      },
      {
        regex: /<blockquote>(.*?)<\/blockquote>/gis,
        blockCreator: (content) => {
          return {
            type: 'quote',
            quote: {
              rich_text: [{ type: 'text', text: { content: content.trim() } }],
            },
          };
        }
      },
      {
        regex: /<ul\s*[^>]*>(.*?)<\/ul>/gis,
        blockCreator: (listContent) => null,
        listProcessor: (listContent, blocks) => {
          // This is where the list processing happens
          console.log('List processor called with content:', listContent.substring(0, 100) + '...');
        }
      }
    ];
    
    console.log('\n🔍 STEP 2: Building XML Tree...');
    const xmlTree = DebugNotionAITool.debugBuildXMLTree(testContent, tagProcessors);
    
    console.log('\n🔍 STEP 3: Converting to Hierarchy...');
    const hierarchy = DebugNotionAITool.debugXmlTreeToHierarchy(xmlTree);
    
    console.log('\n🔍 STEP 4: Checking List Item Positions...');
    // Extract just the list content
    const listMatch = testContent.match(/<ul[^>]*>(.*?)<\/ul>/s);
    if (listMatch) {
      const listContent = listMatch[1];
      console.log('List content:', listContent);
      
      // Test the position mapping function
      const positions = NotionAITool.getListItemPositions(listContent);
      console.log('\nList item positions:');
      positions.forEach((pos, index) => {
        console.log(`  Item ${index}: ${pos.start}-${pos.end}`);
        const itemContent = listContent.substring(pos.start, pos.end);
        console.log(`    Content: ${itemContent.substring(0, 50)}...`);
      });
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}