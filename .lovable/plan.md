

## Analise da Arquitetura Atual e Plano de Ajustes

### Situacao Atual

A tabela `perfil_atleta` ja suporta dois cenarios parcialmente:
- **Atletas do Carreira ID puro**: criados via cadastro, possuem `user_id` e `crianca_id` (gerado localmente)
- **Atletas vindos do Atleta ID**: possuem `crianca_id` que referencia a crianca no sistema de gestao

Porem, nao ha campo que diferencie a **origem** do perfil, nem campo para vincular ao sistema externo Atleta ID.

### Campos a Adicionar na Tabela `perfil_atleta`

| Campo | Tipo | Default | Descricao |
|-------|------|---------|-----------|
| `origem` | text | `'carreira'` | Origem do perfil: `'carreira'` ou `'atleta_id'` |
| `atleta_app_id` | uuid | NULL | ID do atleta no sistema Atleta ID (para integracao futura) |
| `atleta_id_vinculado` | boolean | false | Se o perfil ja esta vinculado ao Atleta ID |
| `atleta_id_sync_at` | timestamptz | NULL | Ultimo momento de sincronizacao com Atleta ID |

### Fluxos de Usuario

**Fluxo 1 - Atleta criado no Carreira ID:**
1. Cadastro (email/Google) → perfil em `profiles` + role em `user_roles`
2. Escolhe tipo "atleta" → cria `perfil_atleta` com `origem = 'carreira'`, `atleta_app_id = NULL`
3. Usa normalmente: atividades, eventos, monetizacao (2 gratis, depois assina)

**Fluxo 2 - Atleta vindo do Atleta ID:**
1. Login com mesmo email no Carreira ID
2. Sistema detecta `atleta_app_id` vinculado (via API futura ou lookup por email)
3. Cria `perfil_atleta` com `origem = 'atleta_id'`, `atleta_app_id = <uuid>`, `atleta_id_vinculado = true`
4. Historico esportivo sincronizado via cache (tabela `carreira_atleta_cache`)

**Fluxo 3 - Atleta do Carreira vinculado depois ao Atleta ID:**
1. Atleta ja existe no Carreira com `origem = 'carreira'`
2. Faz vinculacao (botao "Conectar ao Atleta ID")
3. UPDATE: `atleta_app_id = <uuid>`, `atleta_id_vinculado = true`, `origem` permanece `'carreira'`
4. Sync ativado

### Integracao Futura via API

A estrategia ja planejada se mantem:
- **Edge Function `atleta-id-sync`**: busca dados do Atleta ID por `atleta_app_id`
- **Tabela `carreira_atleta_cache`**: JSONB snapshot com estatisticas, eventos, gols. TTL de ~1h
- **Perfil publico**: le do cache local, sem chamadas externas em tempo real

### Monetizacao

Ja implementada via `check_carreira_atividade_limit` (RPC). Funciona independente da origem:
- Conta atividades em `atividades_externas` por `crianca_id`
- Limite free = 2 (configuravel em `saas_config`)
- Assinatura em `carreira_assinaturas` desbloqueia

### Implementacao Tecnica

1. **Migration SQL**: adicionar 4 colunas a `perfil_atleta` + indice em `atleta_app_id`
2. **Atualizar `useCarreiraData.ts`**: incluir `origem` e `atleta_id_vinculado` no tipo `PerfilAtleta`
3. **Atualizar `CreatePerfilForm.tsx`**: setar `origem = 'carreira'` ao criar perfil
4. **Atualizar `ProfileTypeForm.tsx`** e `AtletaFilhoForm`: garantir que `origem` seja enviado
5. **Nao alterar**: monetizacao, RLS, fluxo de auth (ja funcionais)

```text
┌─────────────────────────────────────────────────┐
│                   Carreira ID                    │
│                                                  │
│  perfil_atleta                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ user_id          (auth.users.id)           │  │
│  │ origem           'carreira' | 'atleta_id'  │  │
│  │ atleta_app_id    uuid (ref Atleta ID)      │  │
│  │ atleta_id_vinculado  bool                  │  │
│  │ atleta_id_sync_at    timestamptz           │  │
│  └────────────────────────────────────────────┘  │
│                      │                           │
│          ┌───────────┴───────────┐               │
│          ▼                       ▼               │
│  atividades_externas    carreira_atleta_cache     │
│  (eventos proprios)     (snapshot Atleta ID)      │
│                                                  │
│  carreira_assinaturas                            │
│  (monetizacao: 2 free → assina)                  │
└──────────────────────┬──────────────────────────┘
                       │ API (Edge Function)
                       ▼
              ┌────────────────┐
              │   Atleta ID    │
              │  (sistema ext) │
              │  historico,    │
              │  estatisticas  │
              └────────────────┘
```

