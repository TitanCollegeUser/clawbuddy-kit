export interface EdgeFunctionAction {
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields?: string[];
  exampleRequest: Record<string, unknown>;
  exampleResponse?: Record<string, unknown>;
}

export interface EdgeFunctionRequestType {
  name: string;
  description: string;
  actions: EdgeFunctionAction[];
}

export interface EdgeFunction {
  name: string;
  title: string;
  description: string;
  method: string;
  category: 'core' | 'webhook' | 'ai' | 'office';
  authMethods: string[];
  requestTypes?: EdgeFunctionRequestType[];
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
  exampleRequest?: Record<string, unknown>;
  exampleResponse?: Record<string, unknown>;
  notes?: string[];
}

export const edgeFunctionRegistry: EdgeFunction[] = [
  {
    name: 'ai-tasks',
    title: 'AI Tasks Hub',
    description: 'Central API hub for all ClawBuddy operations. Routes requests by request_type and action.',
    method: 'POST',
    category: 'core',
    authMethods: ['x-webhook-secret', 'x-api-key', 'Authorization: Bearer <jwt>'],
    notes: [
      'All requests require request_type and action fields',
      'x-webhook-secret is the primary auth method for AI agents',
      'Supports 15 request types with multiple actions each',
    ],
    requestTypes: [
      {
        name: 'task',
        description: 'Manage kanban board tasks',
        actions: [
          { name: 'create', description: 'Create a new task', requiredFields: ['title'], optionalFields: ['description', 'priority', 'due_date', 'column_name'], exampleRequest: { request_type: 'task', action: 'create', title: 'Build landing page', priority: 'High' }, exampleResponse: { success: true, task: { id: 'uuid', title: 'Build landing page' } } },
          { name: 'update', description: 'Update task fields', requiredFields: ['task_id'], optionalFields: ['title', 'description', 'priority', 'due_date'], exampleRequest: { request_type: 'task', action: 'update', task_id: 'uuid', priority: 'Urgent' } },
          { name: 'delete', description: 'Delete a task', requiredFields: ['task_id'], exampleRequest: { request_type: 'task', action: 'delete', task_id: 'uuid' } },
          { name: 'list', description: 'List all tasks', requiredFields: [], optionalFields: ['column_name', 'limit'], exampleRequest: { request_type: 'task', action: 'list' } },
          { name: 'get', description: 'Get a single task by ID', requiredFields: ['task_id'], exampleRequest: { request_type: 'task', action: 'get', task_id: 'uuid' } },
          { name: 'move', description: 'Move task to a column', requiredFields: ['task_id', 'column_name'], exampleRequest: { request_type: 'task', action: 'move', task_id: 'uuid', column_name: 'Done' } },
          { name: 'bulk_create', description: 'Create multiple tasks', requiredFields: ['tasks'], exampleRequest: { request_type: 'task', action: 'bulk_create', tasks: [{ title: 'Task 1' }, { title: 'Task 2' }] } },
          { name: 'search', description: 'Search tasks by keyword', requiredFields: ['query'], exampleRequest: { request_type: 'task', action: 'search', query: 'landing page' } },
        ],
      },
      {
        name: 'queue',
        description: 'Manage the pending task queue for async processing',
        actions: [
          { name: 'list', description: 'List pending tasks', requiredFields: [], exampleRequest: { request_type: 'queue', action: 'list' } },
          { name: 'claim', description: 'Claim a pending task', requiredFields: ['task_id'], exampleRequest: { request_type: 'queue', action: 'claim', task_id: 'uuid' } },
          { name: 'complete', description: 'Complete a claimed task', requiredFields: ['task_id'], optionalFields: ['result'], exampleRequest: { request_type: 'queue', action: 'complete', task_id: 'uuid', result: {} } },
          { name: 'fail', description: 'Mark a task as failed', requiredFields: ['task_id', 'error_message'], exampleRequest: { request_type: 'queue', action: 'fail', task_id: 'uuid', error_message: 'Timeout' } },
          { name: 'requeue', description: 'Requeue a failed task', requiredFields: ['task_id'], exampleRequest: { request_type: 'queue', action: 'requeue', task_id: 'uuid' } },
        ],
      },
      {
        name: 'subagent',
        description: 'Manage sub-agents and their sessions',
        actions: [
          { name: 'create', description: 'Create a sub-agent', requiredFields: ['name', 'display_name', 'model', 'workspace'], exampleRequest: { request_type: 'subagent', action: 'create', name: 'researcher', display_name: 'Research Agent', model: 'gpt-4', workspace: 'default' } },
          { name: 'update', description: 'Update sub-agent config', requiredFields: ['agent_id'], exampleRequest: { request_type: 'subagent', action: 'update', agent_id: 'uuid', status: 'active' } },
          { name: 'delete', description: 'Delete a sub-agent', requiredFields: ['agent_id'], exampleRequest: { request_type: 'subagent', action: 'delete', agent_id: 'uuid' } },
          { name: 'list', description: 'List all sub-agents', requiredFields: [], exampleRequest: { request_type: 'subagent', action: 'list' } },
          { name: 'spawn_task', description: 'Assign a task to a sub-agent', requiredFields: ['agent_id', 'task_description'], exampleRequest: { request_type: 'subagent', action: 'spawn_task', agent_id: 'uuid', task_description: 'Research competitors' } },
          { name: 'get_sessions', description: 'Get sessions for an agent', requiredFields: ['agent_id'], exampleRequest: { request_type: 'subagent', action: 'get_sessions', agent_id: 'uuid' } },
          { name: 'get_session', description: 'Get a specific session', requiredFields: ['session_id'], exampleRequest: { request_type: 'subagent', action: 'get_session', session_id: 'uuid' } },
          { name: 'update_session', description: 'Update session status/result', requiredFields: ['session_id'], exampleRequest: { request_type: 'subagent', action: 'update_session', session_id: 'uuid', status: 'completed' } },
        ],
      },
      {
        name: 'log',
        description: 'AI activity log entries',
        actions: [
          { name: 'create', description: 'Create a log entry', requiredFields: ['message'], optionalFields: ['category'], exampleRequest: { request_type: 'log', action: 'create', message: 'Completed analysis', category: 'observation' } },
          { name: 'list', description: 'List log entries', requiredFields: [], exampleRequest: { request_type: 'log', action: 'list' } },
          { name: 'mark_read', description: 'Mark logs as read', requiredFields: ['log_ids'], exampleRequest: { request_type: 'log', action: 'mark_read', log_ids: ['uuid'] } },
        ],
      },
      {
        name: 'question',
        description: 'AI questions that need human answers',
        actions: [
          { name: 'create', description: 'Ask a question', requiredFields: ['question'], optionalFields: ['context', 'priority', 'question_type', 'related_task_id'], exampleRequest: { request_type: 'question', action: 'create', question: 'Should I prioritize X or Y?', priority: 'high' } },
          { name: 'answer', description: 'Answer a question', requiredFields: ['question_id', 'answer'], exampleRequest: { request_type: 'question', action: 'answer', question_id: 'uuid', answer: 'Prioritize X' } },
          { name: 'list', description: 'List questions', requiredFields: [], exampleRequest: { request_type: 'question', action: 'list' } },
        ],
      },
      {
        name: 'status',
        description: 'Update AI assistant online status',
        actions: [
          { name: 'update', description: 'Update status/message', requiredFields: [], optionalFields: ['is_online', 'status_message', 'ring_color'], exampleRequest: { request_type: 'status', action: 'update', is_online: true, status_message: 'Processing tasks...' } },
        ],
      },
      {
        name: 'skill',
        description: 'Manage API skill integrations',
        actions: [
          { name: 'submit', description: 'Submit a skill for review', requiredFields: ['skill_id'], exampleRequest: { request_type: 'skill', action: 'submit', skill_id: 'uuid' } },
          { name: 'review', description: 'Review a submitted skill', requiredFields: ['skill_id'], exampleRequest: { request_type: 'skill', action: 'review', skill_id: 'uuid' } },
          { name: 'list', description: 'List all skills', requiredFields: [], exampleRequest: { request_type: 'skill', action: 'list' } },
          { name: 'get', description: 'Get skill details', requiredFields: ['skill_id'], exampleRequest: { request_type: 'skill', action: 'get', skill_id: 'uuid' } },
          { name: 'delete', description: 'Delete a skill', requiredFields: ['skill_id'], exampleRequest: { request_type: 'skill', action: 'delete', skill_id: 'uuid' } },
        ],
      },
      {
        name: 'assignee',
        description: 'Manage task assignees',
        actions: [
          { name: 'add', description: 'Add assignee to task', requiredFields: ['task_id', 'user_names'], exampleRequest: { request_type: 'assignee', action: 'add', task_id: 'uuid', user_names: ['Alice'] } },
          { name: 'remove', description: 'Remove assignee', requiredFields: ['task_id', 'user_names'], exampleRequest: { request_type: 'assignee', action: 'remove', task_id: 'uuid', user_names: ['Alice'] } },
          { name: 'list', description: 'List task assignees', requiredFields: ['task_id'], exampleRequest: { request_type: 'assignee', action: 'list', task_id: 'uuid' } },
        ],
      },
      {
        name: 'subtask',
        description: 'Manage subtasks within tasks',
        actions: [
          { name: 'create', description: 'Create a subtask', requiredFields: ['task_id', 'title'], exampleRequest: { request_type: 'subtask', action: 'create', task_id: 'uuid', title: 'Design mockup' } },
          { name: 'toggle', description: 'Toggle subtask completion', requiredFields: ['subtask_id'], exampleRequest: { request_type: 'subtask', action: 'toggle', subtask_id: 'uuid' } },
          { name: 'delete', description: 'Delete a subtask', requiredFields: ['subtask_id'], exampleRequest: { request_type: 'subtask', action: 'delete', subtask_id: 'uuid' } },
          { name: 'list', description: 'List subtasks', requiredFields: ['task_id'], exampleRequest: { request_type: 'subtask', action: 'list', task_id: 'uuid' } },
        ],
      },
      {
        name: 'insight',
        description: 'AI-generated insights and recommendations',
        actions: [
          { name: 'create', description: 'Create an insight', requiredFields: ['title', 'content', 'insight_type'], exampleRequest: { request_type: 'insight', action: 'create', title: 'Productivity trend', content: 'Tasks completed 20% faster this week', insight_type: 'observation' } },
          { name: 'list', description: 'List insights', requiredFields: [], exampleRequest: { request_type: 'insight', action: 'list' } },
          { name: 'mark_read', description: 'Mark insights as read', requiredFields: ['insight_ids'], exampleRequest: { request_type: 'insight', action: 'mark_read', insight_ids: ['uuid'] } },
        ],
      },
      {
        name: 'budget',
        description: 'Task budget management',
        actions: [
          { name: 'update', description: 'Update task budget', requiredFields: ['task_id'], optionalFields: ['estimated_cost', 'actual_cost', 'currency', 'notes'], exampleRequest: { request_type: 'budget', action: 'update', task_id: 'uuid', estimated_cost: 500, currency: 'USD' } },
          { name: 'get', description: 'Get task budget', requiredFields: ['task_id'], exampleRequest: { request_type: 'budget', action: 'get', task_id: 'uuid' } },
        ],
      },
      {
        name: 'report',
        description: 'Processed HTML reports',
        actions: [
          { name: 'create', description: 'Create a report', requiredFields: ['title', 'html_content', 'report_type'], exampleRequest: { request_type: 'report', action: 'create', title: 'Weekly Summary', html_content: '<h1>Report</h1>', report_type: 'insight' } },
          { name: 'list', description: 'List reports', requiredFields: [], exampleRequest: { request_type: 'report', action: 'list' } },
          { name: 'get', description: 'Get a report', requiredFields: ['report_id'], exampleRequest: { request_type: 'report', action: 'get', report_id: 'uuid' } },
          { name: 'mark_read', description: 'Mark report as read', requiredFields: ['report_id'], exampleRequest: { request_type: 'report', action: 'mark_read', report_id: 'uuid' } },
        ],
      },
      {
        name: 'raw_report',
        description: 'Raw report processing pipeline',
        actions: [
          { name: 'process', description: 'Process a raw report', requiredFields: ['report_id'], exampleRequest: { request_type: 'raw_report', action: 'process', report_id: 'uuid' } },
          { name: 'list', description: 'List raw reports', requiredFields: [], exampleRequest: { request_type: 'raw_report', action: 'list' } },
          { name: 'get', description: 'Get raw report details', requiredFields: ['report_id'], exampleRequest: { request_type: 'raw_report', action: 'get', report_id: 'uuid' } },
          { name: 'reprocess', description: 'Reprocess a failed report', requiredFields: ['report_id'], exampleRequest: { request_type: 'raw_report', action: 'reprocess', report_id: 'uuid' } },
        ],
      },
      {
        name: 'identity',
        description: 'Identity files and daily memory logs',
        actions: [
          { name: 'read', description: 'Read an identity file', requiredFields: ['file_key'], exampleRequest: { request_type: 'identity', action: 'read', file_key: 'SOUL' } },
          { name: 'update', description: 'Update an identity file', requiredFields: ['file_key', 'content'], exampleRequest: { request_type: 'identity', action: 'update', file_key: 'MEMORY', content: '# Updated memory...' } },
          { name: 'list', description: 'List all identity files', requiredFields: [], exampleRequest: { request_type: 'identity', action: 'list' } },
          { name: 'read_daily_log', description: 'Read a daily log', requiredFields: ['date'], exampleRequest: { request_type: 'identity', action: 'read_daily_log', date: '2026-02-19' } },
          { name: 'write_daily_log', description: 'Write a daily log', requiredFields: ['date', 'content'], exampleRequest: { request_type: 'identity', action: 'write_daily_log', date: '2026-02-19', content: '## Session Log\n- Started processing...' } },
        ],
      },
    ],
  },
  {
    name: 'report-webhook',
    title: 'Report Webhook',
    description: 'Accepts external report payloads from any source and queues them for processing. Automatically notifies the AI to process.',
    method: 'POST',
    category: 'webhook',
    authMethods: ['x-webhook-secret (optional)'],
    notes: [
      'Accepts ANY valid JSON payload',
      'Automatically triggers AI processing in background',
      'source defaults to "unknown" if not provided',
    ],
    requestBody: [
      { field: 'source', type: 'string', required: false, description: 'Source identifier (e.g. "n8n", "zapier")' },
      { field: 'report_type', type: '"employee" | "insight"', required: false, description: 'Report category (defaults to "insight")' },
      { field: 'data', type: 'object', required: false, description: 'Report data payload (if omitted, entire body is stored)' },
      { field: 'metadata', type: 'object', required: false, description: 'Optional metadata' },
    ],
    exampleRequest: { source: 'n8n', report_type: 'employee', data: { employee: 'Alice', hours: 40 } },
    exampleResponse: { success: true, queue_id: 'uuid', message: 'Report queued and submitted for AI processing', status: 'pending' },
  },
  {
    name: 'goal-analyzer',
    title: 'Goal Analyzer',
    description: 'AI-powered goal breakdown. Takes a business goal and returns assumptions, metrics, and actionable tasks using Gemini Pro.',
    method: 'POST',
    category: 'ai',
    authMethods: ['x-webhook-secret', 'Authorization: Bearer <jwt>'],
    notes: [
      'Uses Lovable AI (Gemini 2.5 Pro) for analysis',
      'Returns structured tool-call output with assumptions, metrics, and action items',
    ],
    requestBody: [
      { field: 'goal', type: 'string', required: true, description: 'The business goal to analyze' },
      { field: 'goal_type', type: '"weekly" | "monthly" | "quarterly" | "yearly"', required: true, description: 'Timeframe for the goal' },
      { field: 'user_notes', type: 'string', required: false, description: 'Additional context' },
    ],
    exampleRequest: { goal: 'Close $10k in new revenue', goal_type: 'monthly', user_notes: 'SaaS product, $99/mo plan' },
    exampleResponse: { title: 'Close $10k Monthly Revenue', assumptions: [{ category: 'Close Rate', value: '20%', explanation: 'Industry average for SaaS' }], metrics: [{ name: 'Leads Needed', value: '500', unit: 'per month' }], action_items: [{ title: 'Set up outbound campaign', priority: 'High', description: '...', estimated_time: '2 hours', metric_impact: 'Generates 100 leads/week' }] },
  },
  {
    name: 'create-office-task',
    title: 'Create Office Task',
    description: 'Creates a task in an office workspace and notifies the Director agent to delegate work.',
    method: 'POST',
    category: 'office',
    authMethods: ['x-api-key', 'x-webhook-secret'],
    requestBody: [
      { field: 'office_id', type: 'string', required: true, description: 'Target office UUID' },
      { field: 'title', type: 'string', required: true, description: 'Task title' },
      { field: 'client_name', type: 'string', required: false, description: 'Client name' },
      { field: 'description', type: 'string', required: false, description: 'Task description' },
      { field: 'assigned_agents', type: 'string[]', required: false, description: 'Agent names to assign' },
    ],
    exampleRequest: { office_id: 'uuid', title: 'Design brand kit', client_name: 'Acme Corp', assigned_agents: ['Pixel', 'Nova'] },
    exampleResponse: { success: true, task: { id: 'uuid', title: 'Design brand kit', status: 'in_progress' } },
  },
  {
    name: 'list-offices',
    title: 'List Offices',
    description: 'Lists all offices with optional agent details. Scoped to user when using webhook secret auth.',
    method: 'POST',
    category: 'office',
    authMethods: ['x-api-key', 'x-webhook-secret'],
    notes: [
      'Add ?include_agents=true to include full agent data',
      'API key auth returns all offices; webhook secret scopes to user',
    ],
    requestBody: [],
    exampleRequest: {},
    exampleResponse: { offices: [{ id: 'uuid', name: 'Creative Studio', director_name: 'Rex', agent_count: 4 }] },
  },
  {
    name: 'manage-office-agent',
    title: 'Manage Office Agent',
    description: 'CRUD operations for office agents: create, update, delete, get, list. Auto-assigns desk positions.',
    method: 'POST',
    category: 'office',
    authMethods: ['x-api-key', 'x-webhook-secret'],
    requestBody: [
      { field: 'action', type: '"create" | "update" | "delete" | "get" | "list"', required: true, description: 'Operation to perform' },
      { field: 'office_id', type: 'string', required: true, description: 'Target office UUID' },
      { field: 'name', type: 'string', required: false, description: 'Agent name (required for create)' },
      { field: 'agent_name', type: 'string', required: false, description: 'Agent name for update/delete/get' },
      { field: 'agent_id', type: 'string', required: false, description: 'Agent UUID (alternative to agent_name)' },
      { field: 'role', type: 'string', required: false, description: 'Agent role' },
      { field: 'species', type: 'string', required: false, description: 'cat, dog, etc.' },
      { field: 'neon_color', type: 'string', required: false, description: 'Hex color for neon glow' },
      { field: 'persona', type: 'string', required: false, description: 'Agent personality' },
      { field: 'skills', type: 'string[]', required: false, description: 'Agent skills list' },
    ],
    exampleRequest: { action: 'create', office_id: 'uuid', name: 'Pixel', role: 'Designer', species: 'cat', neon_color: '#f97316', skills: ['design', 'branding'] },
    exampleResponse: { success: true, agent: { id: 'uuid', name: 'Pixel', role: 'Designer' } },
  },
  {
    name: 'office-agent-status',
    title: 'Office Agent Status',
    description: 'Update agent status, thoughts, and emit events. Automatically tracks task progress and completion.',
    method: 'POST',
    category: 'office',
    authMethods: ['x-api-key', 'x-webhook-secret'],
    notes: [
      'Valid event types: status_change, thought, task_start, task_complete, delegation, movement, collection, report, director_directive, error',
      'task_complete events automatically update task progress and check for completion',
    ],
    requestBody: [
      { field: 'office_id', type: 'string', required: true, description: 'Target office UUID' },
      { field: 'agent_name', type: 'string', required: true, description: 'Agent name' },
      { field: 'status', type: 'string', required: false, description: 'New agent status' },
      { field: 'thought', type: 'string', required: false, description: 'Current thought bubble' },
      { field: 'event_type', type: 'string', required: false, description: 'Event to emit' },
      { field: 'task_id', type: 'string', required: false, description: 'Related task UUID' },
      { field: 'target_agent', type: 'string', required: false, description: 'Target agent for delegation' },
    ],
    exampleRequest: { office_id: 'uuid', agent_name: 'Pixel', status: 'working', thought: 'Designing the logo...', event_type: 'task_start', task_id: 'uuid' },
    exampleResponse: { success: true },
  },
  {
    name: 'reset-office',
    title: 'Reset Office',
    description: 'Resets all agents in an office to idle state. Clears thoughts, tasks, and targets.',
    method: 'POST',
    category: 'office',
    authMethods: ['x-api-key', 'x-webhook-secret'],
    requestBody: [
      { field: 'office_id', type: 'string', required: true, description: 'Target office UUID' },
    ],
    exampleRequest: { office_id: 'uuid' },
    exampleResponse: { success: true },
  },
  {
    name: 'upload-office-deliverable',
    title: 'Upload Office Deliverable',
    description: 'Upload files as task deliverables. Supports base64, URL fetch, raw content, or multipart form upload.',
    method: 'POST',
    category: 'office',
    authMethods: ['x-api-key', 'x-webhook-secret'],
    notes: [
      'Supports 4 upload methods: file_base64, file_url, content (text), multipart/form-data',
      'Files stored in office-deliverables storage bucket',
      'Auto-detects file type from extension',
    ],
    requestBody: [
      { field: 'office_id', type: 'string', required: true, description: 'Target office UUID' },
      { field: 'task_id', type: 'string', required: true, description: 'Related task UUID' },
      { field: 'agent_name', type: 'string', required: true, description: 'Uploading agent name' },
      { field: 'file_name', type: 'string', required: true, description: 'File name with extension' },
      { field: 'file_base64', type: 'string', required: false, description: 'Base64-encoded file data' },
      { field: 'file_url', type: 'string', required: false, description: 'URL to fetch file from' },
      { field: 'content', type: 'string', required: false, description: 'Raw text content' },
      { field: 'description', type: 'string', required: false, description: 'File description' },
    ],
    exampleRequest: { office_id: 'uuid', task_id: 'uuid', agent_name: 'Pixel', file_name: 'logo.png', file_base64: 'iVBORw0KGgo...', description: 'Final logo design' },
    exampleResponse: { success: true, deliverable: { id: 'uuid', file_url: 'https://...', file_type: 'image' } },
  },
];
