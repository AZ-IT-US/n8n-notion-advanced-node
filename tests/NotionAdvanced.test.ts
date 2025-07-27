// Test file for Notion Advanced Node
// Note: These are conceptual tests. In a real environment, you would use Jest or similar testing framework

import {
  createRichText,
  parseRichTextInput,
  createParagraphBlock,
  createHeadingBlock,
  createCodeBlock,
  createTableBlock,
  convertBlockInput,
  validateBlock,
} from '../nodes/NotionAdvanced/NotionUtils';

import type {
  RichTextObject,
  Block,
  BlockInput,
} from '../types/NotionTypes';

// Test Rich Text Creation
export function testRichTextCreation() {
  console.log('Testing Rich Text Creation...');

  // Test basic rich text
  const basicText = createRichText('Hello World');
  console.assert(basicText.type === 'text', 'Basic text type should be text');
  console.assert(basicText.text?.content === 'Hello World', 'Content should match');
  console.assert(basicText.annotations.bold === false, 'Bold should default to false');

  // Test formatted rich text
  const formattedText = createRichText('Bold Text', { bold: true, color: 'red' });
  console.assert(formattedText.annotations.bold === true, 'Bold should be true');
  console.assert(formattedText.annotations.color === 'red', 'Color should be red');

  // Test rich text with link
  const linkedText = createRichText('Link Text', {}, 'https://example.com');
  console.assert(linkedText.text?.link?.url === 'https://example.com', 'Link URL should match');

  console.log('✅ Rich Text Creation tests passed');
}

// Test Rich Text Parsing
export function testRichTextParsing() {
  console.log('Testing Rich Text Parsing...');

  // Test string input
  const stringResult = parseRichTextInput('Simple string');
  console.assert(Array.isArray(stringResult), 'Should return array');
  console.assert(stringResult.length === 1, 'Should have one element');
  console.assert(stringResult[0].text?.content === 'Simple string', 'Content should match');

  // Test array input
  const arrayInput = [
    { text: 'First part', annotations: { bold: true } },
    { text: 'Second part', annotations: { italic: true } }
  ];
  const arrayResult = parseRichTextInput(arrayInput);
  console.assert(arrayResult.length === 2, 'Should have two elements');

  // Test object input
  const objectInput = { text: 'Object text', annotations: { color: 'blue' } };
  const objectResult = parseRichTextInput(objectInput);
  console.assert(objectResult.length === 1, 'Should have one element');

  console.log('✅ Rich Text Parsing tests passed');
}

// Test Block Creation
export function testBlockCreation() {
  console.log('Testing Block Creation...');

  // Test paragraph block
  const paragraph = createParagraphBlock('Test paragraph', 'blue');
  console.assert(paragraph.type === 'paragraph', 'Type should be paragraph');
  console.assert(
    'paragraph' in paragraph && paragraph.paragraph.color === 'blue',
    'Color should be blue'
  );

  // Test heading blocks
  const h1 = createHeadingBlock(1, 'Main Title', 'red');
  console.assert(h1.type === 'heading_1', 'Type should be heading_1');
  console.assert(
    'heading_1' in h1 && h1.heading_1?.color === 'red',
    'Color should be red'
  );

  const h2 = createHeadingBlock(2, 'Section Title');
  console.assert(h2.type === 'heading_2', 'Type should be heading_2');

  const h3 = createHeadingBlock(3, 'Sub Title', undefined, true);
  console.assert(h3.type === 'heading_3', 'Type should be heading_3');
  console.assert(
    'heading_3' in h3 && h3.heading_3?.is_toggleable === true,
    'Should be toggleable'
  );

  // Test code block
  const code = createCodeBlock('console.log("test");', 'javascript');
  console.assert(code.type === 'code', 'Type should be code');
  console.assert(
    'code' in code && code.code.language === 'javascript',
    'Language should be javascript'
  );

  console.log('✅ Block Creation tests passed');
}

// Test Block Input Conversion
export function testBlockInputConversion() {
  console.log('Testing Block Input Conversion...');

  // Test paragraph conversion
  const paragraphInput: BlockInput = {
    type: 'paragraph',
    content: 'Test content',
    properties: { color: 'green' }
  };
  const paragraphBlock = convertBlockInput(paragraphInput);
  console.assert(paragraphBlock.type === 'paragraph', 'Type should be paragraph');

  // Test heading conversion
  const headingInput: BlockInput = {
    type: 'heading_1',
    content: 'Heading text',
    properties: { color: 'blue', isToggleable: true }
  };
  const headingBlock = convertBlockInput(headingInput);
  console.assert(headingBlock.type === 'heading_1', 'Type should be heading_1');

  // Test code conversion
  const codeInput: BlockInput = {
    type: 'code',
    content: 'print("Hello")',
    properties: { language: 'python' }
  };
  const codeBlock = convertBlockInput(codeInput);
  console.assert(codeBlock.type === 'code', 'Type should be code');
  console.assert(
    'code' in codeBlock && codeBlock.code.language === 'python',
    'Language should be python'
  );

  console.log('✅ Block Input Conversion tests passed');
}

// Test Block Validation
export function testBlockValidation() {
  console.log('Testing Block Validation...');

  // Test valid paragraph
  const validParagraph = createParagraphBlock('Valid content');
  try {
    validateBlock(validParagraph);
    console.log('Valid paragraph passed validation');
  } catch (error) {
    console.error('Valid paragraph failed validation:', error);
  }

  // Test valid code block
  const validCode = createCodeBlock('Valid code', 'javascript');
  try {
    validateBlock(validCode);
    console.log('Valid code block passed validation');
  } catch (error) {
    console.error('Valid code block failed validation:', error);
  }

  console.log('✅ Block Validation tests passed');
}

// Test Table Creation
export function testTableCreation() {
  console.log('Testing Table Creation...');

  const tableData = [
    [[createRichText('Header 1')], [createRichText('Header 2')]],
    [[createRichText('Cell 1')], [createRichText('Cell 2')]],
    [[createRichText('Cell 3')], [createRichText('Cell 4')]]
  ];

  const table = createTableBlock(2, tableData, true, false);
  console.assert(table.type === 'table', 'Type should be table');
  console.assert(
    'table' in table && table.table.table_width === 2,
    'Width should be 2'
  );
  console.assert(
    'table' in table && table.table.has_column_header === true,
    'Should have column header'
  );
  console.assert(
    'table' in table && table.table.has_row_header === false,
    'Should not have row header'
  );

  console.log('✅ Table Creation tests passed');
}

// Test Complex Rich Text
export function testComplexRichText() {
  console.log('Testing Complex Rich Text...');

  const complexRichText: RichTextObject[] = [
    createRichText('Normal text '),
    createRichText('bold text', { bold: true }),
    createRichText(' and '),
    createRichText('italic blue text', { italic: true, color: 'blue' }),
    createRichText(' with a ', {}),
    createRichText('link', { underline: true }, 'https://example.com')
  ];

  console.assert(complexRichText.length === 6, 'Should have 6 rich text objects');
  console.assert(complexRichText[1].annotations.bold === true, 'Second element should be bold');
  console.assert(complexRichText[3].annotations.italic === true, 'Fourth element should be italic');
  console.assert(complexRichText[3].annotations.color === 'blue', 'Fourth element should be blue');
  console.assert(complexRichText[5].text?.link?.url === 'https://example.com', 'Last element should have link');

  console.log('✅ Complex Rich Text tests passed');
}

// Test All Block Types
export function testAllBlockTypes() {
  console.log('Testing All Block Types...');

  const blockTypes = [
    'paragraph', 'heading_1', 'heading_2', 'heading_3',
    'bulleted_list_item', 'numbered_list_item', 'to_do',
    'toggle', 'quote', 'callout', 'code', 'divider',
    'equation', 'image', 'bookmark', 'embed'
  ];

  for (const blockType of blockTypes) {
    try {
      const blockInput: BlockInput = {
        type: blockType,
        content: 'Test content',
        properties: {}
      };

      // Special cases for specific block types
      if (blockType === 'equation') {
        blockInput.properties = { expression: 'E = mc^2' };
      } else if (['image', 'bookmark', 'embed'].includes(blockType)) {
        blockInput.properties = { url: 'https://example.com' };
      } else if (blockType === 'code') {
        blockInput.properties = { language: 'javascript' };
      } else if (blockType === 'callout') {
        blockInput.properties = { icon: '💡' };
      }

      const block: Block = convertBlockInput(blockInput);
      validateBlock(block);
      console.log(`✓ ${blockType} block created and validated`);
    } catch (error) {
      console.error(`✗ ${blockType} block failed:`, error);
    }
  }

  console.log('✅ All Block Types tests completed');
}

// Integration test for typical workflow
export function testTypicalWorkflow() {
  console.log('Testing Typical Workflow...');

  // Simulate creating a documentation page
  const pageBlocks: BlockInput[] = [
    {
      type: 'heading_1',
      content: 'API Documentation',
      properties: { color: 'blue' }
    },
    {
      type: 'paragraph',
      content: 'This document describes the REST API endpoints.',
      properties: {}
    },
    {
      type: 'heading_2',
      content: 'Authentication',
      properties: {}
    },
    {
      type: 'paragraph',
      richText: [
        createRichText('Use the '),
        createRichText('Authorization', { code: true }),
        createRichText(' header with your API key.')
      ]
    },
    {
      type: 'code',
      content: 'curl -H "Authorization: Bearer YOUR_API_KEY" https://api.example.com/users',
      properties: { language: 'bash' }
    },
    {
      type: 'callout',
      content: 'Keep your API key secure and never commit it to version control.',
      properties: { icon: '🔒', color: 'yellow_background' }
    }
  ];

  try {
    const convertedBlocks = pageBlocks.map(convertBlockInput);
    convertedBlocks.forEach(validateBlock);
    console.log(`✓ Successfully processed ${convertedBlocks.length} blocks for documentation page`);
  } catch (error) {
    console.error('✗ Typical workflow failed:', error);
  }

  console.log('✅ Typical Workflow test completed');
}

// Run all tests
export function runAllTests() {
  console.log('🧪 Running Notion Advanced Node Tests...\n');

  try {
    testRichTextCreation();
    testRichTextParsing();
    testBlockCreation();
    testBlockInputConversion();
    testBlockValidation();
    testTableCreation();
    testComplexRichText();
    testAllBlockTypes();
    testTypicalWorkflow();

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
  }
}

// Export test data for external use
export const testData = {
  sampleRichText: [
    createRichText('Normal text '),
    createRichText('bold', { bold: true }),
    createRichText(' and '),
    createRichText('italic', { italic: true })
  ],
  sampleBlocks: [
    createParagraphBlock('Sample paragraph'),
    createHeadingBlock(1, 'Sample heading'),
    createCodeBlock('console.log("test");', 'javascript')
  ]
};

// Export for use as module or run tests directly
// Uncomment the following line to run tests when this file is executed:
// runAllTests();