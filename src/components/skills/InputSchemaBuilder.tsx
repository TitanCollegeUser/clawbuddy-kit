import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

export interface InputField {
  name: string;
  type: 'text' | 'number' | 'url' | 'array';
  required: boolean;
  description: string;
}

interface InputSchemaBuilderProps {
  fields: InputField[];
  onChange: (fields: InputField[]) => void;
}

export const InputSchemaBuilder = ({ fields, onChange }: InputSchemaBuilderProps) => {
  const addField = () => {
    onChange([...fields, { name: '', type: 'text', required: false, description: '' }]);
  };

  const updateField = (index: number, updates: Partial<InputField>) => {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onChange(updated);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Input Schema</label>
        <Button type="button" variant="ghost" size="sm" onClick={addField} className="text-xs text-primary hover:text-primary">
          <Plus className="h-3 w-3 mr-1" /> Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-2">No input fields defined. Click "Add Field" to start.</p>
      )}

      {fields.map((field, i) => (
        <div key={i} className="grid grid-cols-[1fr_100px_auto_1fr_auto] gap-2 items-center">
          <Input
            placeholder="name"
            value={field.name}
            onChange={(e) => updateField(i, { name: e.target.value })}
            className="text-sm h-8 bg-background/60 border-border/30"
          />
          <Select value={field.type} onValueChange={(v) => updateField(i, { type: v as InputField['type'] })}>
            <SelectTrigger className="h-8 text-xs bg-background/60 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">text</SelectItem>
              <SelectItem value="number">number</SelectItem>
              <SelectItem value="url">url</SelectItem>
              <SelectItem value="array">array</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={field.required}
              onCheckedChange={(v) => updateField(i, { required: !!v })}
              className="border-border/50"
            />
            <span className="text-xs text-muted-foreground">req</span>
          </div>
          <Input
            placeholder="description"
            value={field.description}
            onChange={(e) => updateField(i, { description: e.target.value })}
            className="text-sm h-8 bg-background/60 border-border/30"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeField(i)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};
