import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAiSettings } from '@/contexts/AiSettingsContext';
import { useAgents } from '@/hooks/useAgents';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { ClawBuddyLogo } from '@/components/branding/ClawBuddyLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Copy, 
  Moon, 
  Sun, 
  Bell, 
  Mail,
  Rocket,
  Sparkles,
  Target,
  Code
} from 'lucide-react';

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'preferences', title: 'Preferences', icon: Moon },
  { id: 'integration', title: 'Integration', icon: Code },
  { id: 'goals', title: 'First Goal', icon: Target },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateTheme, updateNotifications, completeOnboarding } = useAiSettings();
  const { defaultAgent } = useAgents();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firstGoal, setFirstGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (settings.onboardingCompleted) {
      navigate('/dashboard');
    }
  }, [user, settings.onboardingCompleted, navigate]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(settings.webhookSecret);
    setCopied(true);
    toast.success('Secret copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(settings.webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Save preferences
      await updateTheme(theme);
      await updateNotifications({ email: emailNotifications, push: pushNotifications });
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding();
      toast.success('Welcome to ClawBuddy!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <ClawBuddyLogo size="xl" animated showText className="justify-center" />
            <div className="space-y-2">
              <h2 className="text-3xl font-orbitron font-bold text-foreground">
                Welcome to ClawBuddy!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your AI-powered task management assistant is ready to help you achieve more.
                Let's set things up in just a few steps.
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Badge variant="outline" className="px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                Goal Tracking
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <Code className="h-4 w-4 mr-2" />
                API Integration
              </Badge>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-orbitron font-bold text-foreground">
                Set Your Preferences
              </h2>
              <p className="text-muted-foreground">
                Customize your experience.
              </p>
            </div>
            <div className="max-w-sm mx-auto space-y-6">
              {/* Theme */}
              <div className="flex items-center justify-between p-4 rounded-lg glass">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">{theme === 'dark' ? 'Dark' : 'Light'} mode</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'light'}
                  onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
                />
              </div>

              {/* Email notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg glass">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Get updates via email</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              {/* Push notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg glass">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser notifications</p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-orbitron font-bold text-foreground">
                Integration Setup
              </h2>
              <p className="text-muted-foreground">
                Use these credentials to send data to {defaultAgent?.name || 'your AI'}.
              </p>
            </div>
            <div className="max-w-lg mx-auto space-y-4">
              {/* Webhook URL */}
              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Webhook URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted/30 rounded text-xs break-all">
                      {settings.webhookUrl}
                    </code>
                    <Button size="icon" variant="ghost" onClick={handleCopyUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Secret */}
              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Webhook Secret</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted/30 rounded text-xs font-mono">
                      {settings.webhookSecret}
                    </code>
                    <Button size="icon" variant="ghost" onClick={handleCopySecret}>
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Include this in the <code className="bg-muted/30 px-1 rounded">x-webhook-secret</code> header
                  </p>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground text-center">
                You can access these again in Settings → Integration
              </p>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-orbitron font-bold text-foreground">
                Set Your First Goal (Optional)
              </h2>
              <p className="text-muted-foreground">
                What would you like your AI to help you achieve?
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <Textarea
                value={firstGoal}
                onChange={(e) => setFirstGoal(e.target.value)}
                placeholder="e.g., Launch my new product by end of month"
                className="glass min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground text-center">
                You can skip this and add goals later in the Goals Lab
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 rounded transition-all ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                    style={{ width: '60px' }}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </p>
        </div>

        {/* Step content */}
        <Card className="glass-strong glow-red">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? 'Setting up...' : 'Get Started'}
                  <Rocket className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
