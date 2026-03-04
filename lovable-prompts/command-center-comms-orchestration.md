# Lovable Prompt — Command Center: Agent Comms + Orchestration Components

> **How to use:** Copy everything below the `---` line and paste into Lovable. After Lovable builds the components, give them to Sherlock (Claude Code) to wire into clawbuddy-kit's Command Center tabs.

---

# Build Agent Comms + Orchestration UI Components for ClawBuddy Command Center

## Project Context

I'm building **ClawBuddy** — an AI command center dashboard built with React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui. The **Command Center** page has tabbed sections. I need polished React components for two tabs:

1. **Agent Comms** — A real-time chat-style feed showing inter-agent messages (AI agents talking to each other). Think Slack DMs between AI employees.
2. **Orchestration** — A dispatch pipeline dashboard showing active work, a pending queue, and run history with expandable detail rows.

**These are NOT OpsCenter blocks.** They are standalone components that receive data via React Query hooks connected to Supabase tables.

## Tech Stack (MUST use these exact versions/libraries)

| Library | Version | Import Path |
|---------|---------|------------|
| React | 18.3 | `react` |
| TypeScript | 5.8 | — |
| Tailwind CSS | 3.4 | className strings |
| shadcn/ui (Radix) | latest | `@/components/ui/*` |
| Framer Motion | 12.x | `framer-motion` |
| Lucide React | 0.462 | `lucide-react` |
| Tanstack React Query | 5.x | `@tanstack/react-query` |
| date-fns | 3.6 | `date-fns` |
| clsx + tailwind-merge | — | `@/lib/utils` (the `cn()` helper) |

## Available shadcn/ui Components

Import from `@/components/ui/[name]`:

`accordion`, `alert`, `badge`, `button`, `card`, `collapsible`, `dialog`, `dropdown-menu`, `input`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `avatar`

## Design System Rules

1. **Dark theme first.** All components assume a dark background (`hsl(222, 47%, 11%)` ish). Use `text-foreground` for primary text, `text-muted-foreground` for secondary.
2. **Glass morphism cards:** Use `className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm"` for card containers.
3. **Accent colors:** Primary blue = `hsl(var(--primary))`. Status colors: green (emerald-400/500), amber (amber-400/500), red (red-400/500), cyan (cyan-400/500), gray (muted-foreground).
4. **Animations:** Framer Motion for entrance animations. Pattern: `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>`. Use `AnimatePresence` for list reordering.
5. **Loading state:** Show `<Skeleton />` components while data loads.
6. **Empty state:** Centered muted icon + message. Example: `<div className="flex flex-col items-center py-16"><Icon className="h-12 w-12 text-muted-foreground/30 mb-4" /><h3>No data</h3></div>`
7. **Badge pattern:** `<Badge className="text-[10px] px-1.5 h-5 border-0 bg-emerald-500/20 text-emerald-400">LABEL</Badge>`
8. **Hover glow:** `hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)]` on interactive cards.
9. **Responsive:** Mobile-first. Grid collapses on small screens. Tables scroll horizontally on mobile.

---

## PART 1: Agent Comms Components

These components render inter-agent chat messages. Data comes from the `agent_comms` Supabase table.

### Data Types

```typescript
interface AgentComm {
  id: string;
  user_id: string;
  from_agent: string;       // e.g. "Ray", "Sherlock"
  from_emoji: string | null; // e.g. "🕵️", "🧠"
  to_agent: string;
  message: string;           // The message body text
  message_type: string;      // "comment" | "question" | "status_request" | "status_response" | "directive"
  priority: string;          // "low" | "normal" | "high" | "urgent"
  status: string;            // "pending" | "read" | "replied" | "archived"
  parent_id: string | null;  // null = top-level thread, non-null = reply
  related_task_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;        // ISO timestamp
  read_at: string | null;
  replied_at: string | null;
  replies?: AgentComm[];     // Populated client-side by grouping child messages
}
```

### Component 1: `CommsMessage.tsx`

**Location:** `src/components/agent-comms/CommsMessage.tsx`
**Purpose:** Single chat message bubble — the core visual unit of the comms feed.

**Visual design:**
- Glass-morphism card with subtle border. Full width.
- **Header row:** Agent emoji (large, 24px) + agent name (bold) + "→" + recipient name (muted) + status icon + timestamp (right-aligned)
- **Body:** Message text with `whitespace-pre-wrap`. Support multi-line messages gracefully.
- **Footer row:** Message type pill (outline badge, e.g. "Directive", "Question") + priority badge (colored, only shown if not "normal")
- **Reply variant:** When `isReply=true`, add `ml-8` left margin + a left border accent (`border-l-2 border-l-primary/30`) to show threading
- **Urgent styling:** Urgent messages get `border-red-500/40 bg-red-500/5` + the priority badge pulses (`animate-pulse`)
- **High priority:** `border-amber-500/30`
- **Hover:** Subtle glow effect on hover

**Priority color map:**
- low → emerald (bg-emerald-500/20 text-emerald-400)
- normal → primary (bg-primary/20 text-primary)
- high → red (bg-red-500/20 text-red-400)
- urgent → red + pulse (bg-red-500/30 text-red-300 animate-pulse)

**Status icons (tiny, 12px):**
- pending → filled blue circle
- read → eye icon (muted)
- replied → green check circle
- archived → muted check circle

**Props:**
```typescript
interface CommsMessageProps {
  message: AgentComm;
  isReply?: boolean;
}
```

### Component 2: `CommsThread.tsx`

**Location:** `src/components/agent-comms/CommsThread.tsx`
**Purpose:** Groups a parent message with its replies. Wraps CommsMessage components.

**Visual design:**
- Parent message rendered normally via `<CommsMessage>`
- If `thread.replies` exists and has items, render them below with slight spacing (`space-y-2`)
- Each reply gets `<CommsMessage isReply={true} />`
- Framer Motion entrance animation: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- `AnimatePresence` exit: `exit={{ opacity: 0, y: -10 }}`

**Props:**
```typescript
interface CommsThreadProps {
  thread: AgentComm; // Parent message with .replies[] populated
}
```

### Component 3: `AgentCommsTab.tsx`

**Location:** `src/components/command-center/AgentCommsTab.tsx`
**Purpose:** The full Agent Comms tab content for the Command Center. Contains filters, unread badge, and the thread list.

**Visual design:**
- **Sub-header row:**
  - Left: MessageCircle icon (20px, primary) + "Inter-Agent Messages" title (lg, semibold) + unread badge (cyan, e.g. "3 unread")
  - Right (ml-auto): Filter icon + Agent dropdown (Select: "All Agents" + dynamic agent names from data) + Status dropdown (Select: "All Status" / "Pending" / "Read" / "Replied" / "Archived") + thread count text ("12 threads")
- **Thread list:** Renders `<CommsThread>` for each thread, wrapped in `<AnimatePresence mode="popLayout">`
- **Loading state:** 4 skeleton cards (h-28)
- **Empty state:** Centered MessageCircle icon (48px, very muted) + "No messages yet" + "Agent conversations will appear here in real time."

**Data hooks (already exist — just reference them):**
```typescript
import { useAgentComms, useUnreadCommsCount } from '@/hooks/useAgentComms';

// Usage:
const [agentFilter, setAgentFilter] = useState('all');
const [statusFilter, setStatusFilter] = useState('all');
const { data: threads, isLoading } = useAgentComms({ agent: agentFilter, status: statusFilter });
const { data: unreadCount = 0 } = useUnreadCommsCount();
```

**Agent filter dropdown:** Dynamically populated from the data. Loop through all threads and their replies, collect unique `from_agent` and `to_agent` names into a Set, sort alphabetically, render as Select options.

---

## PART 2: Orchestration Components

These components show the dispatch pipeline: active work, pending queue, and historical runs. Data comes from `pending_tasks` and `ai_log` Supabase tables.

### Data Types

```typescript
// From pending_tasks table
interface PendingTask {
  id: string;
  user_id: string;
  task_type: string;
  action: string;
  payload: Record<string, unknown> | null; // Contains: title, dispatcher, executor, requirements
  priority: string;  // "low" | "normal" | "high" | "urgent"
  status: string;    // "pending" | "processing" | "completed" | "failed"
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// From ai_log table (run history events)
interface AiLogEntry {
  id: string;
  user_id: string;
  message: string;
  category: string;
  data: Record<string, unknown> | null; // Contains: event_type, run_id, task_id, outcome, duration, phases_completed, etc.
  created_at: string;
}

// Client-side grouped run
interface RunGroup {
  runId: string;
  events: AiLogEntry[];
  outcome: string;        // "completed" | "failed" | "canceled" | "session_close"
  taskTitle: string;
  startedAt: string;
  duration: string | null;
  phases: number | null;
  heals: number | null;    // self-heal attempts
  alignment: number | null; // alignment score percentage
}
```

### Component 4: `ActiveDispatches.tsx`

**Location:** `src/components/orchestration/ActiveDispatches.tsx`
**Purpose:** Grid of cards showing currently in-flight dispatches (queue items being worked on).

**Visual design:**
- **Grid:** `grid gap-3 md:grid-cols-2` — 2-column on desktop, 1 on mobile
- **Each card:** Glass card with primary accent border (`border-primary/30 bg-primary/5`)
  - Top row: Task title (semibold, line-clamp-1) + priority badge (right-aligned)
  - Middle row: Dispatcher name → Executor name (with arrow, executor name bold)
  - Bottom row: Clock icon + "Started X ago" (relative timestamp via `formatDistanceToNow`)
- **Hover:** Primary glow shadow
- **Framer Motion:** Scale-in animation: `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}`
- **Empty state:** Zap icon + "No active dispatches"
- **Loading:** 2 skeleton cards (h-24)

**Data access:** `payload.title` for task name, `payload.dispatcher` for sender, `payload.executor` for receiver. All from `payload` JSON field, cast with optional chaining.

**Data hook:**
```typescript
import { useActiveDispatches } from '@/hooks/useOrchestration';
const { data: dispatches, isLoading } = useActiveDispatches();
```

### Component 5: `QueuePanel.tsx`

**Location:** `src/components/orchestration/QueuePanel.tsx`
**Purpose:** Table of pending queue items waiting to be claimed by an agent.

**Visual design:**
- **Table** with glass border container (`rounded-lg border border-border/40 overflow-hidden`)
- **Columns:** Priority (badge) | Task (title from payload) | Type (task_type) | Age (relative time)
- **Header row:** `bg-card/40`, uppercase text-xs font-medium text-muted-foreground
- **Body rows:** `hover:bg-primary/5` transition, `border-b border-border/20`
- Priority badges use the same color map: low=emerald, normal=primary, high=amber, urgent=red
- Age column right-aligned, shows "X ago" via `formatDistanceToNow`
- **Empty state:** Inbox icon (32px) + "Queue clear — no pending dispatches"
- **Loading:** 3 skeleton rows (h-12)

**Data hook:**
```typescript
import { usePendingQueue } from '@/hooks/useOrchestration';
const { data: queue, isLoading } = usePendingQueue();
```

### Component 6: `RunHistory.tsx`

**Location:** `src/components/orchestration/RunHistory.tsx`
**Purpose:** Table of completed/failed/canceled runs with expandable detail rows showing the full run lifecycle.

**Visual design:**
- **Table** with same glass border container
- **Columns:** Expand chevron | Run ID (mono, first 8 chars) | Task | Outcome (badge) | Duration | Phases | Date
- **Row click** toggles expanded detail section below the row
- **Expanded detail:** Animated panel (`motion.div` height auto) with:
  - "Run Events (N)" sub-header
  - Each event as a row: event_type badge (mono, tiny) + message text (line-clamp-1) + timestamp
  - Alignment score at bottom if available (primary color, bold percentage)
- **Outcome badge colors:**
  - completed → emerald (bg-emerald-500/20 text-emerald-400)
  - failed → red
  - canceled → muted gray
  - session_close → amber
- **Chevron:** ChevronRight when collapsed, ChevronDown when expanded
- **Expanded row** gets `bg-primary/5` background
- **Loading:** 4 skeleton rows (h-12)
- **Empty state:** History icon + "No run history yet"

**Data hook:**
```typescript
import { useRunHistory } from '@/hooks/useOrchestration';
const { data: rows, isLoading } = useRunHistory();
```

**Client-side grouping:** The hook returns flat `ai_log` rows. Group them by `data.run_id` into `RunGroup` objects:
1. Create a Map<runId, events[]>
2. For each group, find events with `event_type` = "build_summary", "run_end", "run_start"
3. Extract outcome, task title, duration, phases, heals, alignment from the most informative event
4. Sort groups by most recent first

### Component 7: `OrchestrationTab.tsx`

**Location:** `src/components/command-center/OrchestrationTab.tsx`
**Purpose:** The full Orchestration tab content for the Command Center. Lays out the 3 sections vertically.

**Visual design:**
- `space-y-8` vertical stack
- **Section 1:** Zap icon + "Active Dispatches" heading + `<ActiveDispatches />`
- **Section 2:** Inbox icon + "Pending Queue" heading + `<QueuePanel />`
- **Section 3:** History icon + "Run History" heading + `<RunHistory />`
- Each section wrapped in `<motion.section>` with staggered delay (0.1, 0.2, 0.3)
- Section headings: icon (16px, primary) + text (lg, semibold), `flex items-center gap-2 mb-3`

**Realtime hook (already exists):**
```typescript
import { useOrchestrationRealtime } from '@/hooks/useOrchestration';
useOrchestrationRealtime(); // Call at top of component — side-effect only
```

---

## File Summary

| File | Type | Description |
|------|------|------------|
| `src/components/agent-comms/CommsMessage.tsx` | NEW | Single chat message bubble |
| `src/components/agent-comms/CommsThread.tsx` | NEW | Thread wrapper (parent + replies) |
| `src/components/command-center/AgentCommsTab.tsx` | NEW | Full Agent Comms tab with filters |
| `src/components/orchestration/ActiveDispatches.tsx` | NEW | In-flight dispatch cards |
| `src/components/orchestration/QueuePanel.tsx` | NEW | Pending queue table |
| `src/components/orchestration/RunHistory.tsx` | NEW | Run history with expandable rows |
| `src/components/command-center/OrchestrationTab.tsx` | NEW | Full Orchestration tab layout |

## Quality Checklist

Before finishing, verify each component:

- [ ] Named exports (not default)
- [ ] Uses `cn()` from `@/lib/utils` for conditional classNames
- [ ] Has loading state with `<Skeleton />` components
- [ ] Has empty state with muted icon + message
- [ ] Glass morphism card styling (border-border/40, bg-card/60, backdrop-blur-sm)
- [ ] Framer Motion entrance animations
- [ ] Responsive on mobile (grids collapse, tables scroll, text doesn't overflow)
- [ ] TypeScript strict — no untyped variables
- [ ] All Lucide icons imported individually
- [ ] Date formatting uses `date-fns` (format, formatDistanceToNow)
- [ ] Priority/status badges use consistent color system
- [ ] Hover interactions on clickable elements
- [ ] `AnimatePresence` on lists that can reorder
