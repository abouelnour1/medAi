import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const createMarkup = (htmlString: string) => {
    const bolded = htmlString.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return { __html: bolded };
  };

  const lines = content.split('\n');
  // FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const elements: React.ReactElement[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      const items = listItems.map((item, index) => (
        <li key={index} dangerouslySetInnerHTML={createMarkup(item)} />
      ));
      if (listType === 'ul') {
        elements.push(<ul key={elements.length}>{items}</ul>);
      } else if (listType === 'ol') {
        elements.push(<ol key={elements.length}>{items}</ol>);
      }
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    // Match and capture content *after* the list marker
    const ulMatch = trimmedLine.match(/^([*•])\s+(.*)/);
    const olMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
    const headingEmojis = ['🧩', '💊', '🩺', '⚖️', '⚠️', '🔄', '🌍'];
    const isHeading = headingEmojis.some(emoji => trimmedLine.startsWith(emoji));

    if (ulMatch) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(ulMatch[2]);
    } else if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(olMatch[2]);
    } else {
      flushList();
      if (isHeading) {
        elements.push(<h3 key={elements.length} dangerouslySetInnerHTML={createMarkup(line)} />);
      } else if (trimmedLine) {
        elements.push(<p key={elements.length} dangerouslySetInnerHTML={createMarkup(line)} />);
      }
    }
  });

  flushList(); // Flush any remaining list items at the end of the content

  return <>{elements}</>;
};

export default MarkdownRenderer;