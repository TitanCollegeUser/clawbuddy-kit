import { Play, Pause, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface OfficeControlsProps {
  isPaused: boolean;
  speed: number;
  apiMode: boolean;
  onPauseToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onApiModeChange: (enabled: boolean) => void;
}

const speeds = [1, 2, 4];

export const OfficeControls = ({
  isPaused,
  speed,
  apiMode,
  onPauseToggle,
  onSpeedChange,
  onApiModeChange,
}: OfficeControlsProps) => {
  return (
    <div className="space-y-3">
      {/* API Mode toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="api-mode" className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Zap className="h-3 w-3" />
          API Mode
        </Label>
        <Switch
          id="api-mode"
          checked={apiMode}
          onCheckedChange={onApiModeChange}
          className="scale-75"
        />
      </div>

      {/* Playback controls */}
      {!apiMode && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onPauseToggle}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </Button>

          <div className="flex items-center gap-1 ml-auto">
            {speeds.map(s => (
              <Button
                key={s}
                variant={speed === s ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-[10px] font-mono"
                onClick={() => onSpeedChange(s)}
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
