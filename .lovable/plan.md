## Objetivo

Substituir o `JornadaTimeline` (read-only, dados sincronizados) pelo novo `JornadaEsportiva` editável na aba "Jornada Esportiva" do perfil em `CarreiraTimeline.tsx`, seguindo o mesmo padrão arquitetural de Experiência (pai busca dados + abre dialogs, filho "burro" só renderiza).

A aba "Premiações" continua usando `JornadaTimeline` (não está no escopo).

## Arquivos a criar (em `src/components/carreira/`)

1. **`JornadaEsportivaSection.tsx`** — componente apresentacional
   - Props: `campeonatos`, `amistosos`, `estatisticas`, `isOwner`, `accentColor`, `onAddCampeonato`, `onAddJogo`, `onEditCampeonato`, `onEditJogo`, `onDeleteCampeonato`, `onDeleteJogo`
   - Renderiza grid de 4 `StatCard` (Jogos, Gols, Assistências, Vitórias)
   - Sub-tabs internos (state local) "Campeonatos" / "Amistosos"
   - Botões "Novo Campeonato" e "Novo Jogo" só se `isOwner`
   - Lista de `CarreiraCampeonatoCard` ou `CarreiraJogoCard`
   - Empty states e visual alinhado com `ExperienciaSection`

2. **`JornadaCampeonatoFormDialog.tsx`** — dialog CRUD campeonato
   - Props: `open`, `onOpenChange`, `criancaId`, `editingCampeonato?`
   - Usa shadcn `Dialog` (igual `ExperienciaFormDialog`)
   - Campos: nome*, organizador, abrangência (Select), data_inicio*, data_final
   - Validação básica + estados loading/erro com `toast`
   - Chama `useJornada(criancaId).criarCampeonato`

3. **`JornadaJogoFormDialog.tsx`** — dialog CRUD jogo
   - Props: `open`, `onOpenChange`, `criancaId`, `campeonatos`, `editingJogo?`
   - Campos: campeonato (Select opcional), data_jogo*, time_adversario*, placares, gols, assistências, posição (Select), fase, observações
   - Chama `useJornada(criancaId).criarJogo`

4. **`CarreiraCampeonatoCard.tsx`** — card read-only de campeonato
   - Reaproveita lógica visual do existente `src/components/jornada/CampeonatoCard.tsx` mas com cores via `accentColor` e botões edit/delete condicionais a `isOwner`
   - Renderiza lista interna de `CarreiraJogoCard`

5. **`CarreiraJogoCard.tsx`** — card read-only de jogo
   - Placar com cor por resultado (verde/vermelho/cinza)
   - Tags de gols/assists/posição/fase
   - Botões edit/delete condicionais a `isOwner`

6. **`StatCard.tsx`** — card de estatística simples
   - Props: `label`, `value`, `icon?`, `accentColor?`

Nota: os componentes em `src/components/jornada/*` (criados anteriormente para a página standalone) ficam intactos — não serão tocados nem deletados nesta etapa.

## Modificações em `src/components/carreira/CarreiraTimeline.tsx`

1. **Imports**: adicionar `useJornada`, `JornadaEsportivaSection`, `JornadaCampeonatoFormDialog`, `JornadaJogoFormDialog`. Remover import de `JornadaTimeline` apenas se não for mais usado em "premiacoes" — manter pois case 'premiacoes' continua usando.

2. **State** (junto aos demais):
   ```
   const [campeonatoFormOpen, setCampeonatoFormOpen] = useState(false);
   const [jogoFormOpen, setJogoFormOpen] = useState(false);
   const [editingCampeonato, setEditingCampeonato] = useState<CampeonatoComJogos | null>(null);
   const [editingJogo, setEditingJogo] = useState<JogoComMidia | null>(null);
   ```

3. **Hook** (após `useCarreiraExperiencias`):
   ```
   const { data: jornada, excluirCampeonato, excluirJogo } =
     useJornada(isPlatformProfile ? undefined : perfil.crianca_id);
   ```

4. **Handlers**: `handleEditCampeonato`, `handleEditJogo`, `handleDeleteCampeonato`, `handleDeleteJogo` (com `confirm`).

5. **Case `'jornada'`**: substituir o `<JornadaTimeline ... />` atual pelo novo `<JornadaEsportivaSection ... />` recebendo `jornada.campeonatos`, `jornada.amistosos`, `jornada.estatisticas` e os handlers.

6. **Dialogs**: adicionar `<JornadaCampeonatoFormDialog>` e `<JornadaJogoFormDialog>` no bloco de dialogs existente (apenas se `isOwner && perfil.crianca_id`).

## Reutilização (não criar)

- `src/types/jornada-esportiva.ts` — usar como está
- `src/hooks/useJornada.ts` — usar como está

## Pendência de RLS

Para INSERT/SELECT funcionar, as policies RLS propostas anteriormente em `carreira_campeonatos`, `carreira_jogos`, `carreira_jogo_midias` precisam estar aplicadas. Se ainda não foram aprovadas, eu reenvio a migração antes de testar o CRUD.

## Checklist

- [ ] Criar 6 componentes novos em `src/components/carreira/`
- [ ] Editar `CarreiraTimeline.tsx` (state, hook, handlers, case, dialogs)
- [ ] Verificar build limpo
- [ ] Confirmar RLS aplicada (caso contrário rodar migração)
