## Objetivo
Liberar as 5 abas (Experiência, Estatísticas, Atividades Extras, Jornada Esportiva, Premiações) para **todos** os atletas com `crianca_id`, independentemente de terem dados de escolinha ou sincronização com o Atleta ID externo. Adaptar Estatísticas para também somar dados da Jornada própria.

## O que muda

### 1. Unificar as abas em `CarreiraTimeline.tsx`
- Remover a constante `CARREIRA_TABS` (versão reduzida com só 2 abas).
- Remover a flag `isCarreiraOnly` e o switch `activeTabs = isCarreiraOnly ? ... : ...`.
- Todo perfil de **atleta com `crianca_id`** passa a usar `INSTITUTIONAL_TABS` (5 abas).
- Perfis de plataforma (torcedor, scout, profissional, escola) continuam com a lógica atual deles — não são afetados.

### 2. Estado vazio amigável em cada aba
Para o atleta novo (sem escolinha, sem Atleta ID, sem dados próprios ainda) as abas precisam mostrar um estado vazio claro em vez de parecerem "quebradas":
- **Estatísticas**: zeros + chamada "Registre jogos na Jornada Esportiva para ver suas estatísticas".
- **Jornada Esportiva**: já tem CTA "Novo Campeonato" / "Novo Jogo" (mantém).
- **Premiações (Sala de Troféus)**: já tem estado vazio no `SalaTrofeusAtleta` (mantém, ajustar copy se preciso).
- **Atividades Extras**: já tem (mantém).
- **Experiência**: já tem (mantém).

### 3. Estatísticas somando dados da Jornada própria
Hoje `CarreiraStatsCards` usa `useCarreiraStats(criancaId)`. Verificar o hook:
- Se já agrega dados de `carreira_jogos` + `carreira_campeonatos` + `carreira_campeonato_premiacoes` → ok, nada a fazer.
- Se só lê de fontes da escolinha/Atleta ID → estender para também somar:
  - Gols → `carreira_jogos.gols_marcados` do atleta.
  - Jogos → contagem de `carreira_jogos` (amistosos + de campeonato).
  - Campeonatos → contagem distinta de `carreira_campeonatos`.
  - Premiações → contagem de `carreira_campeonato_premiacoes` + premiações sincronizadas da escolinha.

(Decisão de implementação a confirmar após ler o hook; o ideal é uma única função que une as 3 fontes: escolinha, Atleta ID sync, e Jornada própria.)

### 4. Sem mudanças em planos / RLS / banco
Esta liberação é **só de UI**. Os limites de plano (Base/Competidor/Elite — quantidade de jogos por mês, vídeos, YouTube, etc.) continuam valendo dentro de cada aba como já estão hoje. Não estamos liberando recursos pagos — só estamos mostrando as abas para todos.

## Detalhes técnicos

**Arquivos afetados:**
- `src/components/carreira/CarreiraTimeline.tsx` — remover bloco `CARREIRA_TABS` / `isCarreiraOnly` / `activeTabs`. Sempre renderizar `INSTITUTIONAL_TABS` quando há `crianca_id`.
- `src/hooks/useCarreiraJornadaData.ts` (`useCarreiraStats`) — verificar fontes; estender se necessário para incluir dados de `carreira_*` (Jornada própria).
- `src/components/carreira/CarreiraStatsCards.tsx` — pode ganhar uma chamada-ação no estado vazio em vez de simplesmente não renderizar (`hasAnyStats`), para o atleta novo entender o que fazer.

**Não muda:**
- Banco de dados, migrations, RLS, planos, limites freemium, hooks de plano.
- Perfis de plataforma (torcedor, scout, profissional, escola).
- Lógica de sincronização com Atleta ID externo.

## Resultado esperado
Todo atleta cadastrado no Carreira ID (mesmo sem escolinha vinculada e sem Atleta ID) passa a ver as 5 abas e pode alimentar Jornada e Sala de Troféus pela própria plataforma. As abas sem dados mostram estados vazios convidativos com CTAs claros.