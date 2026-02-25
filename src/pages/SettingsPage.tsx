import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAiSettings } from '@/contexts/AiSettingsContext';
import { RayStatusBadge } from '@/components/dashboard/RayStatusBadge';
import { IntegrationGuide } from '@/components/settings/IntegrationGuide';
import { toast } from 'sonner';
import { EdgeFunctionVisualizer } from '@/components/settings/EdgeFunctionVisualizer';
import { AgentCard } from '@/components/settings/AgentCard';
import { CreateAgentModal } from '@/components/settings/CreateAgentModal';
import { useAgents } from '@/hooks/useAgents';
import { useAgentNames } from '@/contexts/AgentNamesContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  User,
  Code,
  Bell,
  Copy,
  Check,
  RefreshCw,
  Moon,
  Sun,
  Key,
  Zap,
  Bot,
  Plus,
} from 'lucide-react';

export const SettingsPage = () => {
  const { settings, updateTheme, updateNotifications, regenerateWebhookSecret } = useAiSettings();
  const { agents, isLoading: agentsLoading, defaultAgent, createAgent, deleteAgent, setDefault } = useAgents();
  const { agentNames, updateAgentNames } = useAgentNames();

  const [copied, setCopied] = useState<string | null>(null);
  const [localPrimary, setLocalPrimary] = useState(agentNames.primaryName);
  const [localIntel, setLocalIntel] = useState(agentNames.intelligenceName);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showCreateAgent, setShowCreateAgent] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const aiTasksUrl = `${supabaseUrl}/functions/v1/ai-tasks`;


  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRegenerateSecret = async () => {
    if (!confirm('Are you sure? This will invalidate your existing webhook integrations.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      await regenerateWebhookSecret();
      toast.success('Webhook secret regenerated');
    } catch (error) {
      toast.error('Failed to regenerate secret');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Config for the integration guide
  const guideConfig = {
    apiUrl: aiTasksUrl,
    webhookUrl: settings.webhookUrl,
    webhookSecret: settings.webhookSecret,
    supabaseUrl: supabaseUrl,
    anonKey: anonKey || 'your-anon-key',
    aiName: defaultAgent?.name || 'AI',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Settings className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your ClawBuddy preferences</p>
            </div>
          </div>
          <RayStatusBadge />
        </div>
      </motion.div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="general" className="gap-2">
            <User className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="integration" className="gap-2">
            <Code className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="edge-functions" className="gap-2">
            <Zap className="h-4 w-4" />
            Edge Functions
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.themePreference === 'dark' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )}
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">
                        Currently using {settings.themePreference} mode
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.themePreference === 'light'}
                    onCheckedChange={(checked) => updateTheme(checked ? 'light' : 'dark')}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integration" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Secret Key Management */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Secret Key Management
                </CardTitle>
                <CardDescription>
                  Regenerate your webhook secret if compromised
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted/30 rounded text-sm font-mono">
                    {settings.webhookSecret}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(settings.webhookSecret, 'Secret')}
                  >
                    {copied === 'Secret' ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleRegenerateSecret}
                    disabled={isRegenerating}
                    title="Regenerate secret"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Regenerating will invalidate existing integrations
                </p>
              </CardContent>
            </Card>

            {/* Full Integration Guide */}
            <IntegrationGuide config={guideConfig} />
          </motion.div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notificationPreferences.email ?? false}
                    onCheckedChange={(checked) =>
                      updateNotifications({ email: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notificationPreferences.push ?? false}
                    onCheckedChange={(checked) =>
                      updateNotifications({ push: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Agent Display Names */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Agent Display Names
                </CardTitle>
                <CardDescription>
                  Customize how AI agents are referred to throughout the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryName">Primary AI Name</Label>
                    <Input
                      id="primaryName"
                      value={localPrimary}
                      onChange={(e) => setLocalPrimary(e.target.value)}
                      placeholder="AI"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in Skills Factory, Reports, and general references
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intelligenceName">Intelligence AI Name</Label>
                    <Input
                      id="intelligenceName"
                      value={localIntel}
                      onChange={(e) => setLocalIntel(e.target.value)}
                      placeholder="Sherlock"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in OpsCenter module apps
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    updateAgentNames({
                      primaryName: localPrimary.trim() || 'AI',
                      intelligenceName: localIntel.trim() || 'Sherlock',
                    });
                    toast.success('Agent display names updated');
                  }}
                >
                  Save Names
                </Button>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Main AI Agents</h2>
                <p className="text-sm text-muted-foreground">
                  Each agent gets its own webhook secret and can operate independently.
                </p>
              </div>
              <Button onClick={() => setShowCreateAgent(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Agent
              </Button>
            </div>

            {agentsLoading ? (
              <p className="text-muted-foreground text-sm">Loading agents...</p>
            ) : agents.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No agents yet. Add an agent to get started with per-agent identity and webhook secrets.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDelete={(id) => {
                      if (confirm('Delete this agent? Its webhook secret will stop working.')) {
                        deleteAgent.mutate(id, { onSuccess: () => toast.success('Agent deleted') });
                      }
                    }}
                    onSetDefault={(id) => {
                      setDefault.mutate(id, { onSuccess: () => toast.success('Default agent updated') });
                    }}
                    isDeleting={deleteAgent.isPending}
                  />
                ))}
              </div>
            )}

            <CreateAgentModal
              open={showCreateAgent}
              onOpenChange={setShowCreateAgent}
              onSubmit={(data) => {
                createAgent.mutate(data, {
                  onSuccess: () => {
                    toast.success('Agent created');
                    setShowCreateAgent(false);
                  },
                  onError: () => toast.error('Failed to create agent'),
                });
              }}
              isLoading={createAgent.isPending}
            />
          </motion.div>
        </TabsContent>

        {/* Edge Functions */}
        <TabsContent value="edge-functions" className="space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EdgeFunctionVisualizer />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
