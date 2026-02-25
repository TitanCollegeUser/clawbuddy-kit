import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, MessageSquarePlus, Send, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Report } from '@/hooks/useReports';

interface ReportViewerModalProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportViewerModal = ({ report, open, onOpenChange }: ReportViewerModalProps) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!report) return null;

  const handleDownload = () => {
    const blob = new Blob([report.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('ai-tasks', {
        body: {
          request_type: 'question',
          action: 'ask',
          question_type: 'question',
          priority: 'high',
          question: `Report feedback for "${report.title}":\n\n${feedback.trim()}\n\nPlease regenerate this report with the requested changes.`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Feedback submitted',
        description: 'Your changes have been queued. The report will be regenerated.',
      });

      setFeedback('');
      setFeedbackOpen(false);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast({
        title: 'Failed to submit',
        description: 'Could not send feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{report.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {report.report_type === 'employee' ? 'Employee Report' : 'AI Insight'} •
                Created {format(new Date(report.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackOpen(!feedbackOpen)}
                className={`gap-2 ${feedbackOpen ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : ''}`}
              >
                <MessageSquarePlus className="h-4 w-4" />
                Request Changes
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Feedback panel — slides open below the header */}
          {feedbackOpen && (
            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  What changes do you want?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => { setFeedbackOpen(false); setFeedback(''); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Textarea
                placeholder="e.g. Change Option 2 pricing to $10K setup. Add a 4th enterprise tier. Fix the timeline to 8 weeks..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px] resize-none bg-background/80"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim() || submitting}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit & Regenerate
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Dark container for iframe — reports are styled for dark backgrounds */}
        <div className="flex-1 overflow-hidden bg-slate-950 rounded-b-lg">
          <iframe
            srcDoc={report.html_content}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            title={report.title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
