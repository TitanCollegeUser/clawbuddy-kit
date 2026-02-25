import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import DOMPurify from 'dompurify';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const renderMarkdown = (md: string): string => {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-primary text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted-foreground">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/^---$/gm, '<hr class="border-border/30 my-4" />');
  return html;
};

export const MarkdownEditor = ({ value, onChange, placeholder }: MarkdownEditorProps) => {
  const [tab, setTab] = useState<string>('edit');

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="bg-muted/30 border border-border/30">
        <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
        <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your skill instructions in Markdown...'}
          className="min-h-[400px] font-mono text-sm bg-background/80 border-border/30 focus:border-primary/50 resize-y"
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-2">
        <div
          className="min-h-[400px] p-4 rounded-lg border border-border/30 bg-background/80 prose prose-invert max-w-none text-sm overflow-auto"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value ? renderMarkdown(value) : '<p class="text-muted-foreground italic">Nothing to preview yet...</p>', { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'hr'], ALLOWED_ATTR: ['class'] }) }}
        />
      </TabsContent>
    </Tabs>
  );
};
