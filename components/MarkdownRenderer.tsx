import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const createMarkup = (htmlString: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const withLinks = htmlString.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline font-bold">$1</a>');
    
    // Highlight Prices (X SAR or X ريال) - Vibrant Orange
    const withPrice = withLinks.replace(/(\d+\.?\d*)\s*(SAR|SR|ريال|ر.س)/gi, '<span class="text-orange-600 dark:text-orange-400 font-black px-1 py-0.5 bg-orange-50 dark:bg-orange-900/30 rounded-md border border-orange-100 dark:border-orange-800/30">$1 $2</span>');
    
    // Highlight Key Medical Terms in Bold - Deep Teal
    const withBold = withPrice.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-teal-700 dark:text-teal-300">$1</strong>');
    
    // Highlight warnings/Cautions - Bold Red
    const withWarnings = withBold.replace(/(Warning|Caution|تنبيه|تحذير|خطر)/gi, '<span class="text-red-600 dark:text-red-400 font-black underline decoration-wavy underline-offset-4">$1</span>');
    
    return { __html: withWarnings };
  };

  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      const items = listItems.map((item, index) => (
        <li key={index} className="mb-1 leading-snug text-[inherit]" dir="auto" dangerouslySetInnerHTML={createMarkup(item)} />
      ));
      if (listType === 'ul') {
        elements.push(<ul key={elements.length} className="list-disc list-inside space-y-0.5 my-2 text-slate-700 dark:text-slate-300 rtl:mr-3 ltr:ml-3 marker:text-primary marker:font-black" dir="auto">{items}</ul>);
      } else if (listType === 'ol') {
        elements.push(<ol key={elements.length} className="list-decimal list-inside space-y-0.5 my-2 text-slate-700 dark:text-slate-300 rtl:mr-3 ltr:ml-3 marker:text-primary marker:font-black" dir="auto">{items}</ol>);
      }
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const ulMatch = trimmedLine.match(/^([*•-])\s+(.*)/);
    const olMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
    const headingEmojis = ['🧩', '💊', '🩺', '⚖️', '⚠️', '🔄', '🌍', '💡', '💰', '✨', '✅'];
    const isHeading = headingEmojis.some(emoji => trimmedLine.startsWith(emoji)) || trimmedLine.startsWith('###') || trimmedLine.startsWith('##');

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
        elements.push(<h3 key={elements.length} className="text-[10px] font-black text-primary uppercase tracking-widest mt-3 mb-1.5 flex items-center gap-1.5 border-b border-primary/5 pb-1" dir="auto" dangerouslySetInnerHTML={createMarkup(line.replace(/###|##/g,''))} />);
      } else if (trimmedLine) {
        elements.push(<p key={elements.length} className="mb-2 text-[inherit] leading-snug text-slate-700 dark:text-slate-300 font-medium" dir="auto" dangerouslySetInnerHTML={createMarkup(line)} />);
      }
    }
  });

  flushList();

  return <div className="markdown-body select-text" dir="auto">{elements}</div>;
};

export default MarkdownRenderer;