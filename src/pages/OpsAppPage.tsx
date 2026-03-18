import { useParams, useNavigate } from 'react-router-dom';
import { useOpsAppByName } from '@/hooks/useOpsCenterApps';
import { useOpsPages } from '@/hooks/useOpsPages';
import { useOpsBlocks } from '@/hooks/useOpsBlocks';
import { OpsBlockRenderer } from '@/components/ops-center/OpsBlockRenderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { icons } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MeetupLaunchPage } from './MeetupLaunchPage';

// ── Custom app page registry ──
// When a Lovable-imported app has a dedicated page, route to it instead of generic blocks.
const CUSTOM_APP_PAGES: Record<string, React.ComponentType> = {
  'meetup-launch': MeetupLaunchPage,
};

const resolveIcon = (name: string) => {
  const key = name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return (icons as Record<string, React.ComponentType<{ className?: string }>>)[key] || icons['File'];
};

export const OpsAppPage = () => {
  const { appName } = useParams<{ appName: string }>();
  const navigate = useNavigate();

  // Render custom Lovable-imported page if one exists for this app
  const CustomPage = appName ? CUSTOM_APP_PAGES[appName] : undefined;
  if (CustomPage) return <CustomPage />;

  const { data: app, isLoading: appLoading } = useOpsAppByName(appName || '');
  const { data: pages, isLoading: pagesLoading } = useOpsPages(app?.id || '');
  const [activeTab, setActiveTab] = useState<string | undefined>();

  const activePage = pages?.find(p => p.name === activeTab) || pages?.[0];
  const currentTab = activeTab || pages?.[0]?.name;

  if (appLoading || pagesLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-6 text-center py-20">
        <div className="glass rounded-xl py-10 px-6 max-w-md mx-auto border border-dashed border-white/[0.08]">
          <p className="text-muted-foreground">App not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/ops-center')}>
            Back to Ops Center
          </Button>
        </div>
      </div>
    );
  }

  const AppIcon = resolveIcon(app.icon || 'monitor');
  const accent = (app.theme as Record<string, string>)?.accent;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-6 py-4 glass border-0 border-b border-white/[0.06]"
        style={{ boxShadow: accent ? `0 1px 20px ${accent}15` : undefined }}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/ops-center')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div
          className="p-2 rounded-lg bg-primary/10"
          style={accent ? { backgroundColor: `${accent}20`, boxShadow: `0 0 12px ${accent}30` } : undefined}
        >
          <AppIcon className="h-5 w-5" style={accent ? { color: accent } : undefined} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-orbitron font-semibold text-foreground uppercase tracking-wider">{app.title}</h1>
            {app.agent_name && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 border-primary/20 text-primary">
                {app.agent_name}
              </Badge>
            )}
          </div>
          {app.description && (
            <p className="text-sm text-muted-foreground">{app.description}</p>
          )}
        </div>
      </motion.div>

      {/* Pages as Tabs */}
      {pages && pages.length > 0 ? (
        <Tabs value={currentTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-6 pt-3">
            <TabsList className="w-fit glass rounded-xl p-1">
              {pages.map(page => {
                const PageIcon = resolveIcon(page.icon || 'file');
                return (
                  <TabsTrigger key={page.name} value={page.name} className="gap-1.5 text-sm rounded-lg">
                    <PageIcon className="h-3.5 w-3.5" />
                    {page.title}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
            {pages.map(page => (
              <TabsContent key={page.name} value={page.name} className="mt-0">
                <PageBlocks pageId={page.id} appId={app.id} layout={page.layout} />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="glass rounded-xl py-10 px-6 border border-dashed border-white/[0.08] text-center max-w-md">
            <p className="text-base text-muted-foreground">No pages configured for this app yet. Your AI agent can add pages via the API.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const PageBlocks = ({ pageId, appId, layout }: { pageId: string; appId: string; layout: string }) => {
  const { data: blocks, isLoading } = useOpsBlocks(pageId);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-60 w-full rounded-xl" /></div>;
  }

  if (!blocks || blocks.length === 0) {
    return (
      <div className="glass rounded-xl py-10 text-center border border-dashed border-white/[0.08]">
        <p className="text-base text-muted-foreground">No blocks on this page yet.</p>
      </div>
    );
  }

  const containerClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : layout === 'sidebar'
    ? 'grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4'
    : 'space-y-4';

  return (
    <div className={containerClass}>
      {blocks.map(block => (
        <OpsBlockRenderer key={block.id} block={block} appId={appId} />
      ))}
    </div>
  );
};
