## Objetivo

Permitir registrar, em cada campeonato da Jornada Esportiva, a **posição final do time** (prêmio coletivo) e os **reconhecimentos individuais** (melhor jogador, goleiro, artilheiro, etc.), e exibir tudo de forma destacada no card do campeonato e na aba **Premiações** do perfil público.

## Onde encaixar

A informação será cadastrada em **dois pontos** complementares, mas armazenada no campeonato (fonte única da verdade):

1. **Edição do Campeonato** (dialog atual `JornadaCampeonatoFormDialog`)
   - Novo campo **"Posição final"** (select): Campeão, Vice-campeão, Semifinalista, Quartas de final, Oitavas, Fase de grupos, Eliminado, Em andamento.
   - Nova seção **"Reconhecimentos individuais"** (lista dinâmica add/remove) com:
     - Tipo (select): Melhor jogador, Melhor goleiro, Artilheiro, Melhor defesa, Destaque da partida, Outro.
     - Descrição/título livre opcional (ex.: "Artilheiro com 8 gols").
     - Jogo associado (opcional) — select com os jogos do campeonato, default = jogo da final se houver.

2. **Edição do Jogo** (dialog `JornadaJogoFormDialog`) — atalho:
   - Quando a fase do jogo for "Final", aparece um bloco **"Reconhecimentos da final"** que grava nos mesmos registros do campeonato, já com `jogo_id` preenchido. Evita o atleta ter que voltar até a edição do campeonato.

## Exibição

- **`CarreiraCampeonatoCard`**: ao lado do nome do campeonato, badge colorido com a posição final (ouro=Campeão, prata=Vice, bronze=Semi). Abaixo das estatísticas, uma linha discreta com chips dos reconhecimentos: 🏆 Melhor jogador • 🧤 Melhor goleiro • ⚽ Artilheiro (8 gols).
- **Aba Premiações** (perfil público): incluir os novos dados da Jornada Esportiva junto às premiações que já vêm de `evento_premiacoes_sync`. Mostrar duas seções:
  - **Coletivas**: lista de campeonatos com posição final ≠ "Em andamento" / "Eliminado".
  - **Individuais**: chips com tipo + campeonato + ano.

## Detalhes técnicos

### Banco (migração)

Tabela `carreira_campeonatos`: adicionar coluna
- `posicao_final TEXT NULL` — enum em texto: `campeao | vice | semifinalista | quartas | oitavas | fase_grupos | eliminado | em_andamento`.

Nova tabela `carreira_campeonato_premiacoes`:
- `id uuid pk`
- `campeonato_id uuid fk → carreira_campeonatos(id) on delete cascade`
- `crianca_id uuid` (para RLS, igual aos jogos)
- `tipo_premiacao text` (mesmos valores do enum acima + `outro`)
- `titulo text null` (descrição livre)
- `jogo_id uuid null fk → carreira_jogos(id) on delete set null`
- `created_at timestamptz default now()`
- RLS: dono da `crianca_id` faz CRUD; leitura pública apenas se o perfil do atleta for público (espelhar policies já existentes em `carreira_jogos`).
- Adicionar a publicação `supabase_realtime`.

### Tipos (`src/types/jornada-esportiva.ts`)

- Novo tipo `PosicaoFinalCampeonato` e `TipoPremiacaoIndividual`.
- `Campeonato.posicao_final?: PosicaoFinalCampeonato`.
- Novo tipo `CampeonatoPremiacao` e `CampeonatoComJogos.premiacoes: CampeonatoPremiacao[]`.

### Hook (`src/hooks/useJornada.ts`)

- `fetchData()` passa a buscar `carreira_campeonato_premiacoes` por criança e agrupa por campeonato.
- Novas funções: `addPremiacaoCampeonato`, `updatePremiacaoCampeonato`, `removePremiacaoCampeonato`.
- Subscrever a nova tabela em realtime (mesmo padrão dos jogos/midias).
- `updateCampeonato` aceita `posicao_final`.

### UI

- `JornadaCampeonatoFormDialog`: novo `<Select>` posição final + sub-bloco lista dinâmica de premiações (add/remove). Persiste em duas operações (campeonato + diff de premiações) na hora de salvar.
- `JornadaJogoFormDialog`: se `fase_campeonato === "Final"`, mostra mini-formulário "Reconhecimentos da final" reaproveitando os mesmos handlers do hook.
- `CarreiraCampeonatoCard`: badge de posição + linha de chips de reconhecimentos.
- Aba **Premiações** do perfil público: agregar os dados novos, mantendo compatibilidade com `useCarreiraPremiacoes` atual (apenas concatena).

### Validação visual (após implementar)

Cadastrar via UI: posição final + 2 reconhecimentos, salvar, conferir realtime, conferir card e aba Premiações.