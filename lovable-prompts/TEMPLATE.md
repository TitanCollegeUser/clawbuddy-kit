# Lovable One-Shot Prompt Template — ClawBuddy OpsCenter Blocks

> **How to use:** Copy this template, fill in the `[PLACEHOLDERS]`, and paste into Lovable.
> Each prompt produces one or more OpsCenter block components that plug directly into clawbuddy-kit.
> After Lovable builds the components, Sherlock (Claude Code) wires them into the kit: imports, OpsBlockRenderer registration, SQL migration, build, deploy.

---

## The Prompt (copy everything below the line)

---

# Build OpsCenter Block Components for ClawBuddy

## Project Context

I'm building **ClawBuddy** — an AI command center dashboard built with React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui. The OpsCenter is a dynamic apps platform where each **App** has **Pages**, and each Page has **Blocks**. Blocks are the visual components.

**This prompt asks you to build [NUMBER] new block component(s) for the `[MODULE_NAME]` module.**

## Tech Stack (MUST use these exact versions/libraries)

| Library | Version | Import Path |
|---------|---------|------------|
| React | 18.3 | `react` |
| TypeScript | 5.8 | — |
| Tailwind CSS | 3.4 | className strings |
| shadcn/ui (Radix) | latest | `@/components/ui/*` |
| Recharts | 2.15 | `recharts` |
| Framer Motion | 12.x | `framer-motion` |
| Lucide React | 0.462 | `lucide-react` |
| Tanstack React Query | 5.x | `@tanstack/react-query` |
| Supabase JS | 2.93 | `@/integrations/supabase/client` |
| date-fns | 3.6 | `date-fns` |
| sonner | 1.7 | `sonner` (toast notifications) |
| dnd-kit | 6.x | `@dnd-kit/core`, `@dnd-kit/sortable` |
| clsx + tailwind-merge | — | `@/lib/utils` (the `cn()` helper) |

## Available shadcn/ui Components

Import from `@/components/ui/[name]`:

`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `tooltip`

## Critical Interfaces (MUST match exactly)

### Block Props — Every component receives these:

```typescript
import type { OpsBlock } from '@/hooks/useOpsBlocks';

// OpsBlock shape:
interface OpsBlock {
  id: string;
  page_id: string;
  block_type: string;
  title: string | null;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Every block component signature:
interface Props {
  block: OpsBlock;
  appId: string;
}
```

### Data Hook — How blocks fetch data:

```typescript
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsDataItem } from '@/hooks/useOpsData';

// OpsDataItem shape:
interface OpsDataItem {
  id: string;
  app_id: string;
  block_id: string | null;
  item_type: string;
  title: string;
  description: string | null;
  status: string;
  column_id: string | null;
  sort_order: number;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Usage patterns:
const { data, isLoading } = useOpsData({ appId });                           // All app data
const { data, isLoading } = useOpsData({ appId, blockId: block.id });        // Block-scoped data
const { data, isLoading } = useOpsData({ appId, itemType: 'lead' });         // Filtered by item_type
const { data, isLoading } = useOpsData({ appId, status: 'active' });         // Filtered by status
```

**IMPORTANT:** `useOpsData` returns `OpsDataItem[]`. The `data` field is `Record<string, unknown>` — always access fields with optional chaining: `(item.data as any)?.fieldName`.

### Direct Supabase Access (for writes):

```typescript
import { supabase } from '@/integrations/supabase/client';

// Insert a record:
await supabase.from('ops_data').insert({
  app_id: appId,
  block_id: block.id,
  item_type: 'some_type',
  title: 'Record title',
  status: 'active',
  data: { /* your fields */ },
  metadata: {},
  user_id: (await supabase.auth.getUser()).data.user?.id,
});

// Update a record:
await supabase.from('ops_data').update({ status: 'done', data: { ... } }).eq('id', recordId);
```

### ClawBuddy API Access (for tasks, questions, logs):

```typescript
const CLAWBUDDY_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tasks`;
const WEBHOOK_SECRET = import.meta.env.VITE_CLAWBUDDY_WEBHOOK_SECRET;

const response = await fetch(CLAWBUDDY_API, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': WEBHOOK_SECRET,
  },
  body: JSON.stringify({
    request_type: 'task',
    action: 'create',
    title: 'Campaign: My Campaign',
    description: 'Auto-created from block',
    column: 'todo',
  }),
});
```

## Design System Rules

1. **Glass morphism containers:** Use `className="glass rounded-xl p-6"` for card containers (translucent background, border, backdrop blur — defined globally in Tailwind config)
2. **Dark theme first:** All components assume a dark background. Use `text-white` for primary text, `text-muted-foreground` for secondary, `text-gray-400` for tertiary.
3. **Accent colors:** Use direct hex in inline styles for colored elements (e.g., `style={{ color: '#3b82f6' }}`). Common palette: blue `#3b82f6`, purple `#8b5cf6`, green `#10b981`, amber `#f59e0b`, red `#ef4444`.
4. **Animations:** Use Framer Motion for entrance animations. Standard pattern: `<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>`. Use `AnimatePresence` for exit animations.
5. **Loading state:** Show `<Skeleton />` components from shadcn/ui while `isLoading` is true.
6. **Empty state:** Show a centered message with a muted icon and text when data array is empty. Example: `<div className="text-center py-12"><Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No leads yet.</p></div>`
7. **Toast notifications:** Use `toast.success('Done!')` or `toast.error('Failed')` from `sonner` for feedback.
8. **Charts:** Use Recharts with custom dark theme: `stroke="#555"` for grid lines, `fill="url(#gradient)"` for area fills, `<defs>` for gradients.
9. **Responsive:** Mobile-first. Use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` patterns. Cards should stack on mobile.
10. **Badge pattern:** `<Badge variant="secondary" className="text-xs">Status</Badge>` — override background with inline style for colors.
11. **Status colors:** Map statuses to colors consistently: active/success = green, pending/warning = amber, error/failed = red, draft/neutral = gray, in-progress = blue.

## File Naming Convention

Each block component goes in: `src/components/ops-center/blocks/`
Name format: `Ops[Module][Feature]Block.tsx`

Examples:
- `OpsEmployeeCampaignCreatorBlock.tsx`
- `OpsYtDashboardBlock.tsx`
- `OpsMeetingIntelBlock.tsx`

Export as named export:
```typescript
export const Ops[Module][Feature]Block = ({ block, appId }: Props) => { ... };
```

## Registration (Sherlock handles this — just build the components)

After you build the components, Sherlock will:
1. Import them in `OpsBlockRenderer.tsx`
2. Add `case '[block_type]': return <Component {...props} />;` to the switch
3. Run the SQL migration to add the new `block_type` to the CHECK constraint
4. Build and deploy

**You don't need to modify OpsBlockRenderer.** Just build the components.

---

## [MODULE_NAME] — Block Specifications

[PASTE YOUR BLOCK SPECS HERE — follow the format below for each block]

### Block 1: `[block_type_slug]`

**Component name:** `Ops[Module][Feature]Block`
**Purpose:** [What this block does — 1-2 sentences]

**Visual design:**
- [Describe the layout: cards, table, chart, etc.]
- [Describe key visual elements: colors, icons, animations]
- [Describe interactions: clicks, filters, search, modals]

**Data shape (`item_type: "[type]"`):**
```json
{
  "item_type": "[type]",
  "title": "Example title",
  "status": "active",
  "data": {
    "field1": "value1",
    "field2": 42,
    "nested": { "key": "value" }
  }
}
```

**Data access pattern:**
```typescript
// Which useOpsData call to use:
const { data, isLoading } = useOpsData({ appId, itemType: '[type]' });
// OR
const { data, isLoading } = useOpsData({ appId, blockId: block.id });
// OR
const { data, isLoading } = useOpsData({ appId }); // all app data, then filter client-side
```

**Key features:**
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

**Empty state:** "[Message to show when no data]"

**Config options (from `block.config`):**
```json
{
  "option1": "default_value",
  "option2": true
}
```

---

### Block 2: `[block_type_slug]`

[Repeat the same format...]

---

## SQL Prerequisites (if any new block types needed)

```sql
-- Add new block types to the CHECK constraint
ALTER TABLE ops_blocks DROP CONSTRAINT IF EXISTS ops_blocks_block_type_check;
ALTER TABLE ops_blocks ADD CONSTRAINT ops_blocks_block_type_check
  CHECK (block_type IN (
    -- existing types (DO NOT remove any):
    'kanban', 'table', 'list', 'metric_cards', 'progress_bar',
    'chart', 'text', 'office', 'feed', 'form', 'embed',
    'timeline', 'calendar', 'gallery', 'agent_card',
    'approval_queue', 'comparison', 'alert_banner', 'countdown',
    'yt_dashboard', 'yt_analytics', 'yt_competitors', 'yt_banger_lab',
    'yt_pipeline', 'yt_scripts', 'yt_intel_feed', 'yt_outlier_feed',
    'outreach_scoreboard', 'outreach_leads', 'outreach_phone',
    'outreach_email', 'outreach_campaigns', 'outreach_results',
    'employee_campaign_creator', 'employee_lead_table', 'employee_analytics',
    'meeting_intel',
    -- NEW types from this module:
    '[new_block_type_1]', '[new_block_type_2]'
  ));
```

---

## Quality Checklist

Before finishing, verify each component:

- [ ] Exports as named export (not default)
- [ ] Props interface is `{ block: OpsBlock; appId: string }`
- [ ] Uses `useOpsData` hook for data fetching (not raw Supabase queries for reads)
- [ ] Has loading state with `<Skeleton />` components
- [ ] Has empty state with icon + message
- [ ] Uses glass morphism containers (`className="glass rounded-xl p-6"`)
- [ ] Uses Framer Motion for entrance animations
- [ ] Uses `toast()` from sonner for user feedback on actions
- [ ] Responsive on mobile (grid collapses, text doesn't overflow)
- [ ] No hardcoded app IDs or block IDs — uses `appId` and `block.id` from props
- [ ] TypeScript strict — no `any` types except for `data` field casts
- [ ] All Lucide icons imported individually (not `import * from 'lucide-react'`)
