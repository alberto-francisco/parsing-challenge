import React, { useState } from 'react';
import cheerio from 'cheerio';

interface ParsedItem {
  tagName: string;
  content: string;
  indentLevel: number;
  children: ParsedItem[];
}

const HTMLParser = () => {
  const [inputHtml, setInputHtml] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!'); // Notify user of successful copy
    }, (err) => {
      console.error('Could not copy text: ', err); // Log the error if copy fails
    });
  };

  // Function to parse HTML content and update parsedItems state
  const parseHtmlContent = () => {
    const $ = cheerio.load(inputHtml); // Load the HTML content using Cheerio
    const parsed = parseElement($('body'), 0); // Start parsing from the body element with indent level 0

    setParsedItems(parsed); // Update the state with parsed items
  };

  // Function to recursively parse HTML elements
  const parseElement = (element: cheerio.Cheerio, indentLevel: number): ParsedItem[] => {
    let items: ParsedItem[] = [];
    let stack: number[] = [indentLevel]; // Stack to manage indent levels

    element.contents().each((index, node) => {
      if (node.type === 'tag') { // Check if the node is an HTML tag
        const el = cheerio(node);
        const tagName = node.name.toLowerCase(); // Get the tag name in lowercase
        let content = el.html() || ''; // Get the inner HTML content
        let newIndentLevel = indentLevel;

        // Handle specific tags and adjust indent levels based on bullet points
        if (tagName === 'p' || tagName === 'div') {
          const bulletMatch = content.match(/^\((\w+)\)/);
          if (bulletMatch) {
            const bullet = bulletMatch[1];
            if (bullet.match(/^\d+$/)) {
              newIndentLevel = stack[stack.length - 1] + 1;
              stack.push(newIndentLevel);
            } else if (bullet.match(/^[a-z]$/)) {
              newIndentLevel = stack[stack.length - 1] + 1;
              stack.push(newIndentLevel);
            } else if (bullet.match(/^[A-Z]$/)) {
              newIndentLevel = stack[stack.length - 1] + 1;
              stack.push(newIndentLevel);
            } else if (bullet.match(/^\d+\.$/)) {
              newIndentLevel = stack.pop() || indentLevel;
            }
          }
        }

        // Recursively parse child elements
        let children: ParsedItem[] = [];
        if (el.children().length > 0) {
          children = parseElement(el, newIndentLevel);
        }

        // Add the parsed item to the list
        items.push({
          tagName,
          content,
          indentLevel: newIndentLevel,
          children,
        });
      }
    });

    return items;
  };

  return (
    <div>
      <textarea
        value={inputHtml}
        onChange={(e) => setInputHtml(e.target.value)}
        placeholder="Paste HTML content here"
      />
      <button onClick={parseHtmlContent}>Parse HTML</button>
      <button onClick={() => copyToClipboard(JSON.stringify(parsedItems))}>Copy Parsed Items</button>
      <pre>{JSON.stringify(parsedItems, null, 2)}</pre>
    </div>
  );
};

export default HTMLParser;
