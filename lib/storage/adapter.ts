/**
 * Persistence boundary for learner data. The UI never talks to localStorage
 * directly; it uses stores backed by an adapter. To move to Firestore, write a
 * `PersistenceAdapter` that reads/writes the signed-in user's documents and
 * pass it to the stores — no component changes are required.
 *
 * The interface is asynchronous on purpose, even though localStorage is not,
 * so remote backends fit without changing callers.
 */
export interface PersistenceAdapter<T> {
  /** Load the stored value, or `null` when nothing is stored yet. */
  load(): Promise<T | null>;
  save(value: T): Promise<void>;
  /** Notifies about changes made elsewhere (another tab, remote sync). */
  subscribe?(listener: (value: T | null) => void): () => void;
}

/** Validates/migrates unknown stored data; return `null` to discard it. */
export type Parser<T> = (raw: unknown) => T | null;
