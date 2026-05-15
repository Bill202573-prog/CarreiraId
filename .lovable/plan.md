
## Parte 1 — Categoria "SUB" no modal "Novo Campeonato"

**Arquivo:** `src/components/carreira/JornadaCampeonatoFormDialog.tsx`

- Adicionar Select **Categoria** entre "Abrangência" e "Data início".
- Opções: "Sem categoria" + Sub-6, Sub-7, … Sub-20 + "Profissional" (reaproveitar `CATEGORIAS` de `src/constants/esportes.ts`).
- Persistir em nova coluna `categoria text NULL` na tabela **`carreira_campeonatos`** (migração).
- Ajustar tipos: `Campeonato.categoria?: string` e `CreateCampeonatoInput.categoria?: string` em `src/types/jornada-esportiva.ts`.
- Exibir como Badge no `CarreiraCampeonatoCard` (header) e no `CampeonatoItem` da `JornadaTimeline`.

## Parte 2 — Aba "Premiações" vira "Sala de Troféus" cronológica

Hoje a aba só lista premiações individuais via `useCarreiraPremiacoes` (vem de `evento_premiacoes_sync`). Vamos transformá-la em uma **Sala de Troféus do Atleta** unificada, em ordem cronológica decrescente, somando 4 fontes que já existem:

1. **Coletivas — Campeonatos com posição final** (`carreira_campeonatos.posicao_final` ≠ `em_andamento` nem null) → Campeão / Vice / Semifinalista etc.
2. **Coletivas — Conquistas sincronizadas da escolinha** (`conquistas_coletivas_sync`).
3. **Individuais em campeonatos** (`carreira_campeonato_premiacoes`) — já existem.
4. **Individuais em jogos da escolinha/atleta_id** (`evento_premiacoes_sync`).

**Novo arquivo:** `src/components/carreira/SalaTrofeusAtleta.tsx`
- Hook agregador `useSalaTrofeusAtleta(criancaId)` em `src/hooks/useCarreiraJornadaData.ts` que faz fetch paralelo das 4 fontes, normaliza para `TrofeuItem { id, categoria: 'coletivo'|'individual', titulo, subtitulo, data, ano, fonte }` e ordena por `data` desc.
- UI: header com 4 contadores (Total / Títulos / Vices / Reconhecimentos individuais), depois lista agrupada por ano (igual `SalaTrofeusPage` da escola, com `Collapsible`), cada card colorido por colocação (ouro/prata/bronze/roxo p/ individual).
- Honra `dadosPublicos` (`premiacoes`, `campeonatos`, `conquistas`) — igual `JornadaTimeline`.

**Integração:** no `case 'premiacoes'` de `src/components/carreira/CarreiraTimeline.tsx` (linha 356), trocar o `JornadaTimeline` filtrado por `<SalaTrofeusAtleta criancaId={...} accentColor={...} dadosPublicos={...} />`.

**Sem mudança de schema** nesta parte — só leitura.

### Diagrama de fontes

```text
SalaTrofeusAtleta
 ├─ carreira_campeonatos (posicao_final) ──┐
 ├─ conquistas_coletivas_sync ─────────────┤── normaliza ── ordena por data ── agrupa por ano
 ├─ carreira_campeonato_premiacoes ────────┤
 └─ evento_premiacoes_sync ────────────────┘
```

## Parte 3 — Resposta sobre Torcedor ↔ Atleta (sem código)

**Como ligamos:**
- Tabela única **`atleta_follows`** (`follower_id`, `following_perfil_id`, `created_at`). É um N:N puro de "seguir".
- Qualquer usuário (torcedor, scout, professor, outro atleta) pode seguir um atleta inserindo uma linha — RLS permite `INSERT` se `auth.uid() = follower_id` e `DELETE` da própria linha.
- O atleta é apontado pelo **`perfil_atleta.id`**, não pelo `crianca_id` — ou seja, a torcida acompanha o perfil público, não o registro escolar interno.
- O perfil "Torcedor" não é uma entidade especial: é só o `tipo = 'torcedor'` em `perfis_rede` (mesma tabela de professor, scout, técnico, etc.). Por isso conseguimos ligar qualquer pessoa comum ao atleta sem criar tabela nova.

**Onde aparece no perfil do atleta:**
- `PerfilHeader.tsx` (linha 28-37) faz `count` em `atleta_follows` por `following_perfil_id` e mostra **"X torcedores"** no header.
- A coluna agregada `perfil_atleta.followers_count` existe e é mantida pelo trigger `update_followers_count` (incrementa/decrementa em INSERT/DELETE de `atleta_follows`). Para perfis de rede (não-atleta) o header mostra "X seguidores" usando esse campo.
- `FansSection.tsx` lista os 50 últimos torcedores (avatar + nome + tipo), clicáveis para abrir o perfil de cada um. Resolve nome/foto/slug em `perfis_rede` e `perfil_atleta`.

**Toggle de seguir:** `useIsFollowing` + `useToggleFollow` em `useCarreiraData.ts` (linhas 678-730), botão "Seguir/Torcer" no header.

**Resumo:**
- ✅ Sim, ligamos torcedor ao atleta via `atleta_follows`.
- ✅ Sim, no perfil do atleta aparece "X torcedores" + lista visual em "Torcida".
- A estrutura é genérica e extensível: todos os tipos de usuário usam a mesma tabela; o rótulo "torcedor" é só um `tipo` no `perfis_rede`. Não há tabela exclusiva de torcedores.

**Possível evolução (não incluída — só pra você avaliar):** se quiser dar mais peso ao torcedor (ranking de torcida, badges "torcedor #1", notificações específicas para torcedores quando o atleta posta/joga), podemos adicionar `notificacoes_ativas boolean` e `engajamento_score int` em `atleta_follows`. Diga se quer um plano para isso.
