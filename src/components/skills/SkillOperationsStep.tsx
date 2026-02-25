import { useState } from 'react';
import { Plus, Loader2, Send, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OperationEditor } from './OperationEditor';
import type { OperationFormData } from './SkillWizard';
import type { HttpMethod } from '@/hooks/useSkillOperations';

interface SkillOperationsStepProps {
  operations: OperationFormData[];
  onChange: (operations: OperationFormData[]) => void;
  onBack: () => void;
  onCancel: () => void;
  onSaveAsDraft: () => void;
  onCreateSkill: () => void;
  onSubmitToAi?: () => void;
  isSaving: boolean;
  isSubmitting?: boolean;
  aiName: string;
}

const defaultOperation: OperationFormData = {
  name: '',
  title: '',
  description: '',
  httpMethod: 'GET' as HttpMethod,
  endpointPath: '/',
  requestBodySchema: '{}',
  responseSchema: '{}',
  exampleRequest: '{}',
  exampleResponse: '{}',
};

export const SkillOperationsStep = ({
  operations,
  onChange,
  onBack,
  onCancel,
  onSaveAsDraft,
  onCreateSkill,
  onSubmitToAi,
  isSaving,
  isSubmitting = false,
  aiName,
}: SkillOperationsStepProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    operations.length === 0 ? 0 : null
  );

  const handleAddOperation = () => {
    const newOperations = [...operations, { ...defaultOperation }];
    onChange(newOperations);
    setExpandedIndex(newOperations.length - 1);
  };

  const handleUpdateOperation = (index: number, data: OperationFormData) => {
    const newOperations = [...operations];
    newOperations[index] = data;
    onChange(newOperations);
  };

  const handleDeleteOperation = (index: number) => {
    const newOperations = operations.filter((_, i) => i !== index);
    onChange(newOperations);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleDuplicateOperation = (index: number) => {
    const operationToDuplicate = operations[index];
    const newOperation = {
      ...operationToDuplicate,
      id: undefined, // Remove ID so it creates a new one
      name: `${operationToDuplicate.name}_copy`,
      title: `${operationToDuplicate.title} (Copy)`,
    };
    const newOperations = [...operations, newOperation];
    onChange(newOperations);
    setExpandedIndex(newOperations.length - 1);
  };

  const hasValidOperations = operations.length > 0 && operations.every(
    (op) => op.name && op.title && op.endpointPath
  );

  const isDisabled = isSaving || isSubmitting;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Operations</CardTitle>
            <CardDescription>
              Define the API endpoints that {aiName} can use
            </CardDescription>
          </div>
          <Button onClick={handleAddOperation} size="sm" className="gap-2" disabled={isDisabled}>
            <Plus className="h-4 w-4" />
            Add Operation
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {operations.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-4">
              No operations defined yet
            </p>
            <Button onClick={handleAddOperation} variant="outline" className="gap-2" disabled={isDisabled}>
              <Plus className="h-4 w-4" />
              Add Your First Operation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {operations.map((operation, index) => (
              <OperationEditor
                key={operation.id || index}
                operation={operation}
                index={index}
                isExpanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                onChange={(data) => handleUpdateOperation(index, data)}
                onDelete={() => handleDeleteOperation(index)}
                onDuplicate={() => handleDuplicateOperation(index)}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isDisabled}>
            ← Back
          </Button>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={isDisabled}>
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              onClick={onSaveAsDraft}
              disabled={isDisabled}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>
            {onSubmitToAi ? (
              <Button 
                onClick={onSubmitToAi}
                disabled={isDisabled || !hasValidOperations}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Save & Submit to {aiName}
              </Button>
            ) : (
              <Button 
                onClick={onCreateSkill}
                disabled={isDisabled || !hasValidOperations}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Skill
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
