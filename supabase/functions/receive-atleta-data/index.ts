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

    // Match user + perfil_atleta
    const { userId, criancaId } = await resolveUser(supabase, email_responsavel, nome_crianca)

    let result: any = null

    switch (tipo) {
      case 'atividade_externa':
        result = await handleAtividadeExterna(supabase, acao, dados, criancaId)
        break
      case 'evento_gol':
        result = await handleEventoGol(supabase, acao, dados, criancaId)
        break
      case 'evento_premiacao':
        result = await handleEventoPremiacao(supabase, acao, dados, criancaId)
        break
      case 'conquista_coletiva':
        result = await handleConquistaColetiva(supabase, acao, dados, criancaId)
        break
      case 'amistoso_convocacao':
        result = await handleAmistosoConvocacao(supabase, acao, dados, criancaId, userId)
        break
      case 'campeonato_convocacao':
        result = await handleCampeonatoConvocacao(supabase, acao, dados, criancaId, userId)
        break
      case 'experiencia_escolinha':
        result = await handleExperienciaEscolinha(supabase, acao, dados, criancaId, userId)
        break
      default:
        return new Response(JSON.stringify({ error: `Unknown tipo: ${tipo}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Mark perfil_atleta as linked after successful sync
    const { error: updateError } = await supabase
      .from('perfil_atleta')
      .update({
        atleta_id_vinculado: true,
        atleta_id_sync_at: new Date().toISOString(),
      })
      .eq('crianca_id', criancaId)
      .eq('atleta_id_vinculado', false)

    if (updateError) {
      console.error('Error updating atleta_id_vinculado:', updateError)
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

// ── Resolve user + crianca ──────────────────────────────────────────

async function resolveUser(supabase: any, email: string, nomeCrianca: string) {
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) throw userError

  const user = userData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    throw new Error(`User not found for email: ${email}`)
  }

  const { data: perfis, error: perfilError } = await supabase
    .from('perfil_atleta')
    .select('id, crianca_id, nome')
    .eq('user_id', user.id)

  if (perfilError) throw perfilError

  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')
  const perfil = perfis?.find((p: any) => normalize(p.nome) === normalize(nomeCrianca))

  if (!perfil || !perfil.crianca_id) {
    throw new Error(`Perfil atleta not found for child: ${nomeCrianca}`)
  }

  return { userId: user.id, criancaId: perfil.crianca_id }
}

// ── Handlers ────────────────────────────────────────────────────────

async function handleAtividadeExterna(supabase: any, acao: string, dados: any, criancaId: string) {
  if (acao === 'delete') {
    const { error } = await supabase.from('atividades_externas_sync').delete().eq('atleta_id_atividade_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

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
    const { error } = await supabase.from('evento_gols_sync').delete().eq('atleta_id_gol_id', dados.id)
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
    evento_data: dados.evento_data || null,
    evento_adversario: dados.evento_adversario || null,
    evento_placar_time1: dados.evento_placar_time1 ?? null,
    evento_placar_time2: dados.evento_placar_time2 ?? null,
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
    const { error } = await supabase.from('evento_premiacoes_sync').delete().eq('atleta_id_premiacao_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  const record = {
    atleta_id_premiacao_id: dados.id,
    crianca_id: criancaId,
    evento_id: dados.evento_id || null,
    tipo_premiacao: dados.tipo_premiacao,
    evento_nome: dados.evento_nome || null,
    evento_data: dados.evento_data || null,
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
    const { error } = await supabase.from('conquistas_coletivas_sync').delete().eq('atleta_id_conquista_id', dados.id)
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

async function handleAmistosoConvocacao(supabase: any, acao: string, dados: any, criancaId: string, userId: string) {
  if (acao === 'delete') {
    const { error } = await supabase.from('amistoso_convocacoes_sync').delete().eq('atleta_id_convocacao_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  const record = {
    atleta_id_convocacao_id: dados.id,
    user_id: userId,
    crianca_id: criancaId,
    evento_nome: dados.evento_nome || null,
    evento_data: dados.evento_data || null,
    evento_tipo: dados.evento_tipo || null,
    evento_adversario: dados.evento_adversario || null,
    evento_local: dados.evento_local || null,
    evento_placar_time1: dados.evento_placar_time1 ?? null,
    evento_placar_time2: dados.evento_placar_time2 ?? null,
    evento_status: dados.evento_status || null,
    status: dados.status || 'confirmado',
    presente: dados.presente ?? null,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('amistoso_convocacoes_sync')
    .upsert(record, { onConflict: 'atleta_id_convocacao_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function handleCampeonatoConvocacao(supabase: any, acao: string, dados: any, criancaId: string, userId: string) {
  if (acao === 'delete') {
    const { error } = await supabase.from('campeonato_convocacoes_sync').delete().eq('atleta_id_convocacao_id', dados.id)
    if (error) throw error
    return { deleted: dados.id }
  }

  const record = {
    atleta_id_convocacao_id: dados.id,
    user_id: userId,
    crianca_id: criancaId,
    campeonato_nome: dados.campeonato_nome || null,
    campeonato_ano: dados.campeonato_ano ?? null,
    campeonato_categoria: dados.campeonato_categoria || null,
    campeonato_status: dados.campeonato_status || null,
    campeonato_nome_time: dados.campeonato_nome_time || null,
    escolinha_nome: dados.escolinha_nome || null,
    status: dados.status || 'confirmado',
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('campeonato_convocacoes_sync')
    .upsert(record, { onConflict: 'atleta_id_convocacao_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

async function handleExperienciaEscolinha(supabase: any, acao: string, dados: any, criancaId: string, userId: string) {
  const escolinhaId = dados.escolinha_id

  if (acao === 'delete') {
    if (!escolinhaId) throw new Error('escolinha_id is required for delete')
    // Only delete synced records (those with escolinha_id set)
    const { error } = await supabase
      .from('carreira_experiencias')
      .delete()
      .eq('crianca_id', criancaId)
      .eq('escolinha_id', escolinhaId)
    if (error) throw error
    return { deleted: escolinhaId }
  }

  if (!dados.nome_escola) throw new Error('nome_escola is required')

  // Check if record already exists for this escolinha + crianca
  const { data: existing } = await supabase
    .from('carreira_experiencias')
    .select('id')
    .eq('crianca_id', criancaId)
    .eq('escolinha_id', escolinhaId)
    .maybeSingle()

  const record = {
    user_id: userId,
    crianca_id: criancaId,
    escolinha_id: escolinhaId,
    nome_escola: dados.nome_escola,
    data_inicio: dados.data_inicio,
    data_fim: dados.data_fim || null,
    atual: dados.atual ?? true,
    bairro: dados.bairro || null,
    cidade: dados.cidade || null,
    estado: dados.estado || null,
    tipo_instituicao: dados.tipo_instituicao || 'escolinha',
    categoria_instituicao: dados.categoria_instituicao || null,
    observacoes: dados.observacoes || null,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    // Update existing record
    const { data, error } = await supabase
      .from('carreira_experiencias')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('carreira_experiencias')
      .insert(record)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
