import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOffice } from '@/hooks/useOffices';
import { toast } from 'sonner';
import { Building2, Swords, Flame, Radio } from 'lucide-react';

const SPECIES_OPTIONS = [
  { value: 'fox', label: '🦊 Fox' },
  { value: 'wolf', label: '🐺 Wolf' },
  { value: 'owl', label: '🦉 Owl' },
  { value: 'bear', label: '🐻 Bear' },
];

const COLOR_PRESETS = [
  '#3b82f6', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899',
];

const SITE_TYPES = [
  { value: 'office', label: 'Office', icon: Building2, desc: 'Standard workspace with agents at desks', color: 'border-primary/60' },
  { value: 'arena', label: 'Arena', icon: Swords, desc: 'Two agents compete head-to-head with scoreboard', color: 'border-red-400/60' },
  { value: 'boiler_room', label: 'Boiler Room', icon: Flame, desc: 'Compact high-intensity workspace', color: 'border-orange-400/60' },
  { value: 'intelligence', label: 'Intelligence Hub', icon: Radio, desc: 'Data-driven command center with analytics dashboards', color: 'border-cyan-400/60' },
] as const;

interface CreateOfficeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateOfficeModal = ({ open, onOpenChange }: CreateOfficeModalProps) => {
  const [siteType, setSiteType] = useState<'office' | 'arena' | 'boiler_room' | 'intelligence'>('office');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [directorSpecies, setDirectorSpecies] = useState('fox');
  const [directorColor, setDirectorColor] = useState('#3b82f6');

  const createOffice = useCreateOffice();

  const handleSubmit = async () => {
    const needsDirector = siteType !== 'intelligence';
    if (!name.trim() || (needsDirector && !directorName.trim())) {
      toast.error(needsDirector ? 'Please fill in name and director name' : 'Please fill in a name');
      return;
    }
    try {
      await createOffice.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        director_name: directorName.trim(),
        director_species: directorSpecies,
        director_color: directorColor,
        site_type: siteType,
      });
      toast.success(`${SITE_TYPES.find(s => s.value === siteType)?.label} created!`);
      onOpenChange(false);
      setName('');
      setDescription('');
      setDirectorName('');
      setDirectorSpecies('fox');
      setDirectorColor('#3b82f6');
      setSiteType('office');
    } catch {
      toast.error('Failed to create workspace');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Site Type Selector */}
          <div>
            <Label className="mb-2 block">Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {SITE_TYPES.map((st) => {
                const Icon = st.icon;
                const selected = siteType === st.value;
                return (
                  <button
                    key={st.value}
                    onClick={() => setSiteType(st.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                      selected
                        ? `${st.color} bg-accent/30`
                        : 'border-border/30 hover:border-border/60'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${selected ? 'text-foreground' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>{st.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{SITE_TYPES.find(s => s.value === siteType)?.desc}</p>
          </div>

          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={siteType === 'arena' ? 'Sales Showdown' : 'Marketing Agency'} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this workspace do?" rows={2} />
          </div>
          {siteType !== 'intelligence' && (
            <>
              <div>
                <Label>Director Name</Label>
                <Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} placeholder="Atlas" />
              </div>
              <div>
                <Label>Director Species</Label>
                <Select value={directorSpecies} onValueChange={setDirectorSpecies}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Director Color</Label>
                <div className="flex gap-2 mt-1">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setDirectorColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: directorColor === c ? 'white' : 'transparent',
                        transform: directorColor === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createOffice.isPending}>
            {createOffice.isPending ? 'Creating...' : `Create ${SITE_TYPES.find(s => s.value === siteType)?.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
