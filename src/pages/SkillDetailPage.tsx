import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSkill } from '@/hooks/useSkills';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RunSkillModal } from '@/components/skills/RunSkillModal';
import { ArrowLeft, Play, Pencil } from 'lucide-react';
import type { InputField } from '@/components/skills/InputSchemaBuilder';
import DOMPurify from 'dompurify';

const renderMarkdown = (md: string): string => {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-primary text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/^---$/gm, '<hr class="border-border/30 my-4" />');
};

export const SkillDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: skill, isLoading } = useSkill(id);
  const [showRun, setShowRun] = useState(false);

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!skill) return <div className="p-6 text-muted-foreground">Skill not found.</div>;

  const isClaudeCode = (skill as any).agent_type === 'claude-code';
  const inputSchema = Array.isArray(skill.input_schema) ? (skill.input_schema as unknown as InputField[]) : [];
  const allowedTools: string[] = (skill as any).allowed_tools || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/skills/factory')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-['Orbitron'] font-bold text-foreground">{skill.title}</h1>
          <p className="text-xs text-muted-foreground">{skill.name}</p>
        </div>
        <div className="flex gap-2">
          {isClaudeCode && (
            <Button onClick={() => setShowRun(true)} className="gap-2" size="sm">
              <Play className="h-3.5 w-3.5" /> Run Skill
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2 border-border/40" onClick={() => navigate(`/skills/edit/${skill.id}`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="glass rounded-xl p-4 border border-border/30 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="outline" className="mt-1">{skill.status}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="text-foreground mt-1">{isClaudeCode ? 'Claude Code' : 'OpenClaw'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Agent</p>
            <p className="text-foreground mt-1">{(skill as any).agent_name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Output</p>
            <p className="text-foreground mt-1">{(skill as any).output_format || 'text'}</p>
          </div>
        </div>
        {skill.description && <p className="text-sm text-muted-foreground">{skill.description}</p>}
      </div>

      {/* Allowed Tools */}
      {allowedTools.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Allowed Tools</h3>
          <div className="flex flex-wrap gap-2">
            {allowedTools.map((t) => (
              <Badge key={t} variant="outline" className="text-xs border-primary/30 text-primary">{t}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input Schema */}
      {inputSchema.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Input Schema</h3>
          <div className="glass rounded-lg border border-border/30 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Required</th>
                  <th className="text-left px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {inputSchema.map((f, i) => (
                  <tr key={i} className="border-t border-border/20">
                    <td className="px-3 py-2 font-mono text-primary">{f.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{f.type}</td>
                    <td className="px-3 py-2">{f.required ? '✓' : '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{f.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Markdown Content */}
      {isClaudeCode && (skill as any).skill_markdown && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Skill Instructions</h3>
          <div
            className="glass rounded-lg border border-border/30 p-4 prose prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown((skill as any).skill_markdown), { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'hr'], ALLOWED_ATTR: ['class'] }) }}
          />
        </div>
      )}

      {/* Run Modal */}
      {showRun && <RunSkillModal open={showRun} onOpenChange={setShowRun} skill={skill} />}
    </div>
  );
};
