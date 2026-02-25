import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
};

const DESK_POSITIONS = [
  { x: 380, y: 160 },
  { x: 560, y: 160 },
  { x: 740, y: 160 },
  { x: 920, y: 160 },
  { x: 380, y: 560 },
  { x: 560, y: 560 },
  { x: 740, y: 560 },
  { x: 920, y: 560 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const apiKey = req.headers.get('x-api-key');
    const webhookSecret = req.headers.get('x-webhook-secret');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let userId: string | null = null;

    if (webhookSecret) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('webhook_secret', webhookSecret)
        .single();
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    } else if (apiKey) {
      const storedKey = Deno.env.get('AI_TASKS_API_KEY');
      if (!storedKey || apiKey !== storedKey) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Missing authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, office_id } = body;

    if (!action || !office_id) {
      return new Response(JSON.stringify({ error: 'Missing action or office_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify office ownership if using webhook secret
    if (userId) {
      const { data: office } = await supabaseAdmin
        .from('offices')
        .select('id')
        .eq('id', office_id)
        .eq('user_id', userId)
        .single();
      if (!office) {
        return new Response(JSON.stringify({ error: 'Office not found or not owned by you' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let result: unknown;

    switch (action) {
      case 'create': {
        const { name, role, species, neon_color, fur_color, fur_highlight, suit_color,
                persona, skills, secret_sauce, bio, desk_position_x, desk_position_y, metadata } = body;

        if (!name) {
          return new Response(JSON.stringify({ error: 'Missing required field: name' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Auto-assign desk if not specified
        let deskX = desk_position_x;
        let deskY = desk_position_y;

        if (deskX == null || deskY == null) {
          const { data: existing } = await supabaseAdmin
            .from('office_agents')
            .select('desk_position_x, desk_position_y')
            .eq('office_id', office_id);

          const occupied = new Set(
            (existing || []).map((a: { desk_position_x: number; desk_position_y: number }) => `${a.desk_position_x},${a.desk_position_y}`)
          );
          const free = DESK_POSITIONS.find(p => !occupied.has(`${p.x},${p.y}`));
          if (free) {
            deskX = free.x;
            deskY = free.y;
          } else {
            deskX = 380 + Math.random() * 540;
            deskY = 160 + Math.random() * 400;
          }
        }

        const insertData: Record<string, unknown> = {
          office_id,
          name,
          role: role || '',
          species: species || 'cat',
          neon_color: neon_color || '#f97316',
          fur_color: fur_color || '#8B6914',
          fur_highlight: fur_highlight || '#C4A44A',
          suit_color: suit_color || '#1e293b',
          desk_position_x: deskX,
          desk_position_y: deskY,
        };

        if (persona !== undefined) insertData.persona = persona;
        if (skills !== undefined) insertData.skills = skills;
        if (secret_sauce !== undefined) insertData.secret_sauce = secret_sauce;
        if (bio !== undefined) insertData.bio = bio;
        if (metadata !== undefined) insertData.metadata = metadata;

        const { data: agent, error } = await supabaseAdmin
          .from('office_agents')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabaseAdmin.from('office_activity_log').insert([{
          office_id,
          agent_name: name,
          action: `Agent "${name}" created as ${role || 'agent'}`,
          log_type: 'system',
        }]);

        result = { success: true, agent };
        break;
      }

      case 'update': {
        const { agent_name, agent_id } = body;
        if (!agent_name && !agent_id) {
          return new Response(JSON.stringify({ error: 'Provide agent_name or agent_id' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updateFields: Record<string, unknown> = {};
        const allowedFields = ['name', 'role', 'species', 'neon_color', 'fur_color', 'fur_highlight',
          'suit_color', 'persona', 'skills', 'secret_sauce', 'bio', 'status', 'current_thought',
          'target_agent', 'current_task_id', 'desk_position_x', 'desk_position_y', 'metadata'];

        for (const field of allowedFields) {
          if (body[field] !== undefined) updateFields[field] = body[field];
        }

        if (Object.keys(updateFields).length === 0) {
          return new Response(JSON.stringify({ error: 'No fields to update' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let query = supabaseAdmin
          .from('office_agents')
          .update(updateFields)
          .eq('office_id', office_id);

        if (agent_id) {
          query = query.eq('id', agent_id);
        } else {
          query = query.eq('name', agent_name);
        }

        const { data: agent, error } = await query.select().single();
        if (error) throw error;

        result = { success: true, agent };
        break;
      }

      case 'delete': {
        const { agent_name, agent_id } = body;
        if (!agent_name && !agent_id) {
          return new Response(JSON.stringify({ error: 'Provide agent_name or agent_id' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let query = supabaseAdmin
          .from('office_agents')
          .delete()
          .eq('office_id', office_id);

        if (agent_id) {
          query = query.eq('id', agent_id);
        } else {
          query = query.eq('name', agent_name);
        }

        const { error } = await query;
        if (error) throw error;

        await supabaseAdmin.from('office_activity_log').insert([{
          office_id,
          agent_name: agent_name || agent_id,
          action: `Agent "${agent_name || agent_id}" removed`,
          log_type: 'system',
        }]);

        result = { success: true, deleted: agent_name || agent_id };
        break;
      }

      case 'get': {
        const { agent_name, agent_id } = body;
        let query = supabaseAdmin
          .from('office_agents')
          .select('*')
          .eq('office_id', office_id);

        if (agent_id) {
          query = query.eq('id', agent_id);
        } else if (agent_name) {
          query = query.eq('name', agent_name);
        } else {
          return new Response(JSON.stringify({ error: 'Provide agent_name or agent_id' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: agent, error } = await query.single();
        if (error) throw error;

        result = { agent };
        break;
      }

      case 'list': {
        const { data: agents, error } = await supabaseAdmin
          .from('office_agents')
          .select('*')
          .eq('office_id', office_id)
          .order('created_at', { ascending: true });
        if (error) throw error;

        result = { agents, count: agents.length };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
