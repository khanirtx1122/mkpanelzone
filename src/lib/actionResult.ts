/**
 * The result shape shared by every `useActionState`-driven form action.
 *
 * `error` is present only on failure and `success` only on success, so both are
 * optional. Typing the hook with this instead of `any` means a component cannot
 * read a field the action never returns, and — more importantly — it forces the
 * action and the hook to agree on the argument list.
 *
 * That last point is not theoretical. `useActionState(action, initial)` invokes
 * the action as `action(previousState, formData)`. An action declared as
 * `(formData: FormData)` therefore receives the *previous state* as its first
 * argument and never sees the form data at all. That is exactly what happened to
 * `saveSettings`, which silently failed on every submit.
 */
export interface ActionState {
  success?: boolean;
  error?: string;
}

/** The initial state passed to `useActionState` before any submission. */
export const INITIAL_ACTION_STATE: ActionState | null = null;
