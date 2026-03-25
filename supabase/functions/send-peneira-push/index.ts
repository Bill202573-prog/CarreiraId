import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { peneira_id, atleta_user_ids } = await req.json();
    if (!peneira_id || !atleta_user_ids?.length) {
      return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get peneira details
    const { data: peneira } = await supabase
      .from('peneiras')
      .select('titulo, local_nome, data_evento')
      .eq('id', peneira_id)
      .single();

    if (!peneira) {
      return new Response(JSON.stringify({ error: 'Peneira not found' }), { status: 404, headers: corsHeaders });
    }

    // Get push subscriptions for the athletes
    const { data: subs } = await supabase
      .from('carreira_push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', atleta_user_ids);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No push subscriptions found' }), { headers: corsHeaders });
    }

    let sent = 0;
    const payload = JSON.stringify({
      title: '⚽ Convite para Peneira!',
      body: `${peneira.titulo} — ${peneira.local_nome}`,
      icon: '/icons/icon-192x192.png',
      data: { url: '/carreira/perfil' },
    });

    // Dynamic import of web-push for Deno
    // Send notifications using fetch to web push endpoints
    for (const sub of subs) {
      try {
        // Use the existing send-carreira-push function logic
        const { error } = await supabase.functions.invoke('send-carreira-push', {
          body: {
            user_ids: [sub.user_id],
            title: '⚽ Convite para Peneira!',
            body: `${peneira.titulo} — ${peneira.local_nome}`,
          },
        });
        if (!error) sent++;
      } catch {
        // Silent fail for individual pushes
      }
    }

    return new Response(JSON.stringify({ sent, total: subs.length }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
