## Objetivo

Remover o bloco de estatísticas (Jogos / Gols do atleta / Assist. do atleta / Vitórias) da aba **Jornada Esportiva** e levar esses números para a aba **Estatísticas**, adicionando um filtro por **ano**.

## Mudanças

### 1. `JornadaEsportivaSection.tsx`
- Remover o grid de 4 `StatCard` no topo (Jogos, Gols, Assistências, Vitórias).
- Manter sub-tabs (Campeonatos / Amistosos), botões de ação e listas.
- A prop `estatisticas` deixa de ser usada aqui (pode ser removida da interface e do call site em `CarreiraTimeline`).

### 2. `CarreiraStatsCards.tsx` (aba Estatísticas)
- Adicionar seletor de **ano** no topo do bloco.
  - Opção "Todos" + lista de anos detectados (derivada dos dados da jornada + sync: jogos, campeonatos, premiações, conquistas).
- Recalcular os totais aplicando o filtro de ano antes de somar.
- Mostrar os mesmos 4 cards atuais (Gols, Jogos, Campeonatos, Premiações) **+** adicionar **Assistências** e **Vitórias** (que hoje só aparecem na Jornada), para concentrar tudo aqui.
- Estado vazio continua igual quando não houver nenhum dado no ano selecionado.

### 3. `useCarreiraJornadaData.ts` (`useCarreiraStats`)
- Aceitar parâmetro opcional `ano?: number | 'todos'`.
- Filtrar por ano antes de agregar:
  - `gols` / `amistosos` / `premiacoes` → pelo `evento.data`.
  - `campeonatos` (sync) → pelo `campeonato.ano`.
  - `conquistas` → pelo `ano`.
  - Jornada própria (`carreira_*`) → filtrar `campeonatos` por `data_inicio` e `amistosos`/jogos por `data_jogo` antes de recomputar `totalJogos`, `totalGols`, `totalAssistencias`, `totalVitorias`, `totalCampeonatos` e `totalPremiacoes`.
- Expor também a lista de anos disponíveis (`anosDisponiveis: number[]`) para popular o filtro.

### 4. Sem mudanças de schema, rotas ou backend.

## Detalhes técnicos

- O filtro será um `<select>` simples estilizado com o `accentColor` (mesmo padrão visual já usado na tela), controlado por `useState<number | 'todos'>('todos')`.
- `useCarreiraStats` passa a retornar `{ stats, anosDisponiveis }` (breaking change interno — só é usado por `CarreiraStatsCards`, então atualizo lá).
- Reaproveito a lógica atual de dedupe (`amistososEventIds`, `orphanGolEventIds`, `uniqueCampeonatoIds`) aplicando o filtro de ano antes do `Set`.
