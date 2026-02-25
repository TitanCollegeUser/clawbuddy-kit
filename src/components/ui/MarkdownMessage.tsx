import React from 'react';

interface MarkdownMessageProps {
  text: string;
}

const parseBold = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^**]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const MarkdownMessage = ({ text }: MarkdownMessageProps) => {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2.5">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n');
        const bulletLines: string[] = [];
        const textLines: React.ReactNode[] = [];

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();
          const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);

          if (bulletMatch) {
            if (textLines.length > 0 && bulletLines.length === 0) {
              // keep them, they'll be rendered before
            }
            bulletLines.push(bulletMatch[1]);
          } else if (trimmed) {
            if (bulletLines.length > 0) {
              textLines.push(
                <ul key={`bl-${pIdx}-${lIdx}`} className="list-disc list-inside space-y-1 ml-1">
                  {bulletLines.splice(0).map((b, bIdx) => (
                    <li key={bIdx} className="text-foreground/90">{parseBold(b)}</li>
                  ))}
                </ul>
              );
            }
            textLines.push(
              <span key={`t-${pIdx}-${lIdx}`}>
                {lIdx > 0 && <br />}
                {parseBold(trimmed)}
              </span>
            );
          }
        });

        if (bulletLines.length > 0) {
          textLines.push(
            <ul key={`bl-${pIdx}-end`} className="list-disc list-inside space-y-1 ml-1">
              {bulletLines.map((b, bIdx) => (
                <li key={bIdx} className="text-foreground/90">{parseBold(b)}</li>
              ))}
            </ul>
          );
        }

        if (textLines.length === 0) return null;

        return (
          <div key={pIdx} className="leading-relaxed">
            {textLines}
          </div>
        );
      })}
    </div>
  );
};
