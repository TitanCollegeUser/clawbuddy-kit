import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOffices } from '@/hooks/useOffices';
import { OfficeCard } from '@/components/workspace/OfficeCard';
import { CreateOfficeModal } from '@/components/workspace/CreateOfficeModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export const WorkspacePage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: offices, isLoading } = useOffices();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
            <p className="text-sm text-muted-foreground">Manage your AI agent offices</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Office
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : offices && offices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((office) => (
            <OfficeCard key={office.id} office={office} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No offices yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first AI agent office to get started</p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Office
          </Button>
        </div>
      )}

      <CreateOfficeModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};
