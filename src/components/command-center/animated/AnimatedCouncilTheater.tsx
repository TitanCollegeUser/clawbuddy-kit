import { useState, useEffect, useCallback, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CouncilTheaterCanvas } from './CouncilTheaterCanvas';
import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward } from 'lucide-react';
import type { CouncilSession as TheaterSession, CouncilParticipant as TheaterParticipant, CouncilMessage as TheaterMessage } from './types';
import type { AgentComm, CouncilParticipant } from '@/types/command-center';

interface AnimatedCouncilTheaterProps {
  question: string;
  status: 'pending' | 'active' | 'completed' | 'archived';
  participants: CouncilParticipant[];
  messages: AgentComm[];
}

/**
 * Council theater canvas with playback controls.
 * Maps real Supabase data (AgentComm, CouncilParticipant) to the theater's internal types.
 */
export function AnimatedCouncilTheater({ question, status, participants, messages }: AnimatedCouncilTheaterProps) {
  const [theaterMode, setTheaterMode] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(0);
  const [msgProgress, setMsgProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [containerWidth, setContainerWidth] = useState(700);

  // Map real data → theater types
  const session: TheaterSession = useMemo(() => ({
    id: 'live',
    question,
    status: status === 'archived' ? 'completed' : status,
    participants: participants.map(p => ({
      name: p.agent_name,
      emoji: p.agent_emoji || '🤖',
      messageLimit: p.message_limit,
      messagesSent: p.messages_sent,
    })),
    messages: messages.map((msg, idx) => ({
      id: msg.id,
      fromAgent: msg.from_agent,
      fromEmoji: msg.from_emoji || '🤖',
      message: msg.message,
      messageNumber: (msg.metadata as Record<string, unknown>)?.message_number as number || idx + 1,
    })),
  }), [question, status, participants, messages]);

  useEffect(() => {
    const handleResize = () => setContainerWidth(Math.min(700, window.innerWidth - 64));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Playback engine
  useEffect(() => {
    if (!isPlaying || !theaterMode) return;
    if (currentMsg >= session.messages.length) {
      setIsPlaying(false);
      return;
    }

    const msg = session.messages[currentMsg];
    const typewriterDuration = (msg.message.length * 25) / speed;
    const holdDuration = Math.min(6000, Math.max(3000, msg.message.length * 50 + 2000)) / speed;
    const totalDuration = typewriterDuration + holdDuration;

    let startTime = Date.now();
    let frame: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const typeProgress = Math.min(1, elapsed / typewriterDuration);
      setMsgProgress(typeProgress);

      if (elapsed >= totalDuration) {
        setCurrentMsg(prev => prev + 1);
        setMsgProgress(0);
      } else {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, currentMsg, speed, theaterMode, session.messages]);

  const goToMessage = useCallback((index: number) => {
    setCurrentMsg(Math.max(0, Math.min(index, session.messages.length)));
    setMsgProgress(index >= session.messages.length ? 0 : 1);
    setIsPlaying(false);
  }, [session.messages.length]);

  const progressPercent = session.messages.length > 0 ? (currentMsg / session.messages.length) * 100 : 0;

  if (messages.length === 0) return null;

  return (
    <div className="mt-2">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-mono">🎭 Theater</span>
        <Switch checked={theaterMode} onCheckedChange={setTheaterMode} />
      </div>

      {theaterMode && (
        <div className="space-y-0">
          <CouncilTheaterCanvas
            session={session}
            currentMessageIndex={currentMsg}
            messageProgress={msgProgress}
            width={containerWidth}
            height={350}
          />

          {/* Playback controls */}
          <div
            className="flex items-center justify-between flex-wrap gap-2"
            style={{
              background: 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 16px',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full border border-border/30 hover:border-primary/50 transition-colors"
                onClick={() => goToMessage(0)}
              >
                <SkipBack className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-full border border-border/30 hover:border-primary/50 transition-colors"
                onClick={() => goToMessage(currentMsg - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                className={`h-9 w-9 rounded-full transition-all ${
                  isPlaying
                    ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'bg-muted border border-border/30 hover:border-primary/50'
                }`}
                onClick={() => {
                  if (currentMsg >= session.messages.length) {
                    setCurrentMsg(0);
                    setMsgProgress(0);
                  }
                  setIsPlaying(!isPlaying);
                }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-full border border-border/30 hover:border-primary/50 transition-colors"
                onClick={() => goToMessage(currentMsg + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full border border-border/30 hover:border-primary/50 transition-colors"
                onClick={() => goToMessage(session.messages.length)}
              >
                <SkipForward className="h-3 w-3" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="flex-1 mx-4 max-w-[300px]">
              <div className="relative h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-visible">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    left: `${progressPercent}%`,
                    marginLeft: -4,
                    background: '#10b981',
                    boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1.5">
                Message {Math.min(currentMsg + 1, session.messages.length)} of {session.messages.length}
              </p>
            </div>

            {/* Speed selector */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-mono mr-1">Speed</span>
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  className={`h-6 px-2 text-xs font-mono rounded-full transition-all ${
                    speed === s
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
