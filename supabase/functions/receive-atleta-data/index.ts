import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate sync secret
    const syncSecret = req.headers.get('x-sync-secret')
    const expectedSecret = Deno.env.get('CARREIRA_SYNC_SECRET')

    if (!expectedSecret || syncSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json()
    const { tipo, acao, dados, email_responsavel, nome_crianca } = body

    if (!tipo || !acao || !dados || !email_responsavel || !nome_crianca) {
      return new Response(JSON.stringify({ error: 'Missing required fields: tipo, acao, dados, email_responsavel, nome_crianca' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Match crianca_id by finding user via email, then their perfil_atleta
    // 1. Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw userError

    const user = userData.users.find((u: any) => u.email?.toLowerCase() === email_responsavel.toLowerCase())
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found', email: email_responsavel }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Find perfil_atleta matching user_id + nome (normalized comparison)
    const { data: perfis, error: perfilError } = await supabase
      .from('perfil_atleta')
      .select('id, crianca_id, nome')
      .eq('user_id', user.id)

    if (perfilError) throw perfilError

    // Normalize for comparison
    const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')
    const nomeBuscado = normalize(nome_crianca)

    const perfil = perfis?.find((p: any) => normalize(p.nome) === nomeBuscado)

    if (!perfil || !perfil.crianca_id) {
      return new Response(JSON.stringify({ 
        error: 'Perfil atleta not found for this child',
        nome_buscado: nome_crianca,
        perfis_encontrados: perfis?.map((p: any) => p.nome),
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const criancaId = perfil.crianca_id
    let result: any = null

    // Route by tipo
    switch (tipo) {
      case 'atividade_externa': {
        result = await handleAtividadeExterna(supabase, acao, dados, criancaId)
        break
      }
      case 'evento_gol': {
        result = await handleEventoGol(supabase, acao, dados, criancaId)
        break
      }
      case 'evento_premiacao': {
        result = await handleEventoPremiacao(supabase, acao, dados, criancaId)
        break
      }
      case 'conquista_coletiva': {
        result = await handleConquistaColetiva(supabase, acao, dados, criancaId)
        break
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown tipo: ${tipo}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('receive-atleta-data error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleAtividadeExterna(supabase: any, acao: string, dados: any, criancaId: string) {
  if (acao === 'delete') {
    const { error } = await supabase
      .from('atividades_externas_sync')
      .delete()
      .eq('atleta_id_atividade_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  // upsert for create/update
  const record = {
    atleta_id_atividade_id: dados.id,
    crianca_id: criancaId,
    tipo: dados.tipo,
    tipo_outro_descricao: dados.tipo_outro_descricao || null,
    data: dados.data,
    data_fim: dados.data_fim || null,
    duracao_minutos: dados.duracao_minutos || 60,
    frequencia_semanal: dados.frequencia_semanal || null,
    carga_horaria_horas: dados.carga_horaria_horas || null,
    local_atividade: dados.local_atividade,
    profissional_instituicao: dados.profissional_instituicao,
    profissionais_envolvidos: dados.profissionais_envolvidos || null,
    organizador: dados.organizador || null,
    torneio_abrangencia: dados.torneio_abrangencia || null,
    torneio_nome: dados.torneio_nome || null,
    objetivos: dados.objetivos || [],
    metodologia: dados.metodologia || null,
    observacoes: dados.observacoes || null,
    evidencia_url: dados.evidencia_url || null,
    evidencia_tipo: dados.evidencia_tipo || null,
    credibilidade_status: dados.credibilidade_status || 'registrado',
    fotos_urls: dados.fotos_urls || [],
    tornar_publico: dados.tornar_publico ?? false,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('atividades_externas_sync')
    .upsert(record, { onConflict: 'atleta_id_atividade_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function handleEventoGol(supabase: any, acao: string, dados: any, criancaId: string) {
  if (acao === 'delete') {
    const { error } = await supabase
      .from('evento_gols_sync')
      .delete()
      .eq('atleta_id_gol_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  const record = {
    atleta_id_gol_id: dados.id,
    crianca_id: criancaId,
    evento_id: dados.evento_id || null,
    time_id: dados.time_id || null,
    quantidade: dados.quantidade || 1,
    evento_nome: dados.evento_nome || null,
    time_nome: dados.time_nome || null,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('evento_gols_sync')
    .upsert(record, { onConflict: 'atleta_id_gol_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function handleEventoPremiacao(supabase: any, acao: string, dados: any, criancaId: string) {
  if (acao === 'delete') {
    const { error } = await supabase
      .from('evento_premiacoes_sync')
      .delete()
      .eq('atleta_id_premiacao_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  const record = {
    atleta_id_premiacao_id: dados.id,
    crianca_id: criancaId,
    evento_id: dados.evento_id || null,
    tipo_premiacao: dados.tipo_premiacao,
    evento_nome: dados.evento_nome || null,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('evento_premiacoes_sync')
    .upsert(record, { onConflict: 'atleta_id_premiacao_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function handleConquistaColetiva(supabase: any, acao: string, dados: any, criancaId: string) {
  if (acao === 'delete') {
    const { error } = await supabase
      .from('conquistas_coletivas_sync')
      .delete()
      .eq('atleta_id_conquista_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  const record = {
    atleta_id_conquista_id: dados.id,
    crianca_id: criancaId,
    tipo: dados.tipo || 'conquista',
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    data: dados.data || null,
    evento_nome: dados.evento_nome || null,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('conquistas_coletivas_sync')
    .upsert(record, { onConflict: 'atleta_id_conquista_id' })
    .select()
    .single()

  if (error) throw error
  return data
}
