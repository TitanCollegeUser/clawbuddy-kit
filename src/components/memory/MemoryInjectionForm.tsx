import { useState } from 'react';
import { Brain, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmitMemory } from '@/hooks/useMemoryInjection';
import { motion } from 'framer-motion';

export const MemoryInjectionForm = () => {
  const [content, setContent] = useState('');
  const submitMemory = useSubmitMemory();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    await submitMemory.mutateAsync(content.trim());
    setContent('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-strong border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-orbitron">Memory Injection</CardTitle>
              <CardDescription className="font-exo">
                Add important context for your AI to remember
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your context here... (e.g., client preferences, project details, important notes)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] bg-background/50 border-border/50 focus:border-primary/50 resize-none font-exo"
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitMemory.isPending}
            className="w-full gap-2"
          >
            {submitMemory.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit to AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
