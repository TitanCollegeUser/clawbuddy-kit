import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCheckSkillName, validateSkillName } from '@/hooks/useSkills';
import type { SkillFormData } from './SkillWizard';

interface SkillBasicInfoStepProps {
  data: SkillFormData;
  onChange: (data: SkillFormData) => void;
  onNext: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export const SkillBasicInfoStep = ({
  data,
  onChange,
  onNext,
  onCancel,
  isEditing,
}: SkillBasicInfoStepProps) => {
  const checkSkillName = useCheckSkillName();
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const handleNameChange = (name: string) => {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    onChange({ ...data, name: normalizedName });
    setNameStatus('idle');
  };

  const handleCheckName = async () => {
    if (!validateSkillName(data.name)) {
      return;
    }
    
    setNameStatus('checking');
    try {
      const isAvailable = await checkSkillName.mutateAsync(data.name);
      setNameStatus(isAvailable ? 'available' : 'taken');
    } catch {
      setNameStatus('idle');
    }
  };

  const handleUseCasesChange = (value: string) => {
    const useCases = value.split('\n').filter((line) => line.trim());
    onChange({ ...data, useCases });
  };

  const isNameValid = validateSkillName(data.name);
  const canProceed = isNameValid && data.title.trim() && (isEditing || nameStatus !== 'taken');

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Define the skill's identity and purpose
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Skill Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Skill Name <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="name"
                placeholder="resend-email"
                value={data.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={!isNameValid && data.name ? 'border-destructive' : ''}
                disabled={isEditing}
              />
              {nameStatus === 'available' && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
              {nameStatus === 'taken' && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={handleCheckName}
                disabled={!isNameValid || nameStatus === 'checking'}
              >
                {nameStatus === 'checking' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Check'
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only. 3-50 characters.
          </p>
          {nameStatus === 'taken' && (
            <p className="text-xs text-destructive">
              This name is already taken. Please choose another.
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Resend Email Service"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Human-readable name for the skill
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Integrate with Resend.com to send transactional emails, track delivery, manage templates, and handle bounces"
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Describe when and why to use this skill
          </p>
        </div>

        {/* Use Cases */}
        <div className="space-y-2">
          <Label htmlFor="useCases">Use Cases</Label>
          <Textarea
            id="useCases"
            placeholder="Send transactional emails&#10;Track email delivery status&#10;Manage email templates"
            value={data.useCases.join('\n')}
            onChange={(e) => handleUseCasesChange(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            One use case per line
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onNext} disabled={!canProceed}>
            Next: API Config →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
