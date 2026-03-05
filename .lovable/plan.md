

## Analysis

### Root Cause: Likes/Comments Not Working

The console log reveals the core issue: `fetchUserData: missing profile` with `PGRST116` (0 rows). The user is authenticated via Supabase Auth but has **no row in the `profiles` table**. This causes `AuthContext` to return `user: null`, which means:

1. **Like button**: Calls `toggleLike.mutate()` but `usePostLike` checks `user?.id` — since `user` is null, it throws "Usuário não autenticado" and rolls back.
2. **Comment button**: Same issue — `user?.id` is undefined, so the comment silently fails.

This is the same issue on ALL profiles (João Guilherme, Pedro Henrique, etc.) — the **viewing user** doesn't have a `profiles` row, not the profile being viewed.

### Fix: Fallback to Supabase Session for Interactions

The like and comment hooks should fall back to `supabase.auth.getUser()` when the `profiles` table row is missing. The `useCreateComment` already does this (`(await supabase.auth.getUser()).data.user?.id`), but `usePostLike` relies on `useAuth()` which returns null.

### Other Issues Identified

1. **Experiência — no edit/delete buttons**: The `carreira-experiencia` tab renders experience items inline without edit/delete controls. Need to add edit and delete buttons, plus an `useUpdateCarreiraExperiencia` mutation.

2. **Atividades — edit button opens blank form**: The `onEdit` callback in `CarreiraTimeline` just opens `setAtividadeFormOpen(true)` without passing the activity data to `editingActivity`. The form opens blank instead of pre-filled.

3. **Atividades — title styling**: The `AtividadePublicaCard` has `tipoLabel` rendered inside a `Badge` which has underline-like styling. Should match the experience pattern with accent color.

4. **Tab content card border**: The tab content wrapper at line 252 uses default `border bg-card` — should use accent-colored border like other cards.

5. **Photo upload in atividades**: Need to verify the `AtividadeExternaPhotoUpload` component works and triggers instant updates.

---

## Plan

### 1. Fix Like/Comment Authentication (Root Cause)

In `src/hooks/useCarreiraData.ts`, modify `usePostLike` to fall back to `supabase.auth.getSession()` when `useAuth().user` is null. This allows Carreira-only users (who have no `profiles` row) to still interact.

Also fix `usePostComments` query and `useCreateComment` to handle the same scenario.

### 2. Add Edit/Delete to Experiência Items

In `src/components/carreira/CarreiraTimeline.tsx`:
- Add edit and delete buttons (Pencil, Trash2) to each experience item in the `carreira-experiencia` tab.
- Track `editingExperiencia` state to pass to `ExperienciaFormDialog`.

In `src/hooks/useCarreiraExperienciasData.ts`:
- Add `useUpdateCarreiraExperiencia` mutation hook.

In `src/components/carreira/ExperienciaFormDialog.tsx`:
- Accept an optional `editingExperiencia` prop to pre-fill the form for editing.

### 3. Fix Atividade Edit Button

In `src/components/carreira/CarreiraTimeline.tsx`:
- Track `editingActivity` state.
- Pass `editingActivity` to `CarreiraAtividadeFormDialog` instead of always opening a blank form.
- Update `onEdit` callback in `AtividadePublicaCard` to set the editing state.

### 4. Standardize Visual Styling

- **Tab content container** (line 252 in CarreiraTimeline): Apply accent-colored border (`borderColor: accentColor + '50'`, `borderWidth: 2`).
- **AtividadePublicaCard**: Apply accent-colored border matching the experiência pattern (border width 2, accent color at 50% opacity). Remove underline from title badge.
- **Experiência items**: Apply consistent accent-colored borders and background.

### 5. Instant Photo Updates for Atividades

Ensure that after photo upload in `CarreiraAtividadeFormDialog`, the atividades query is invalidated so photos appear immediately without page refresh.

### Technical Summary

- **Files to modify**: `useCarreiraData.ts` (auth fallback), `CarreiraTimeline.tsx` (edit states, styling), `useCarreiraExperienciasData.ts` (update hook), `ExperienciaFormDialog.tsx` (edit mode), `AtividadePublicaCard.tsx` (styling).
- **No database changes needed** — existing RLS policies already support all operations.

