import type { StarterFile } from "@/lib/content/types";

/** Saved (unsubmitted) code per exercise and file. */
export interface DraftsState {
  version: 1;
  exercises: Record<string, { files: Record<string, string>; updatedAt: string }>;
}

export const emptyDrafts: DraftsState = { version: 1, exercises: {} };

export function parseDrafts(raw: unknown): DraftsState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<DraftsState>;
  if (value.version !== 1 || typeof value.exercises !== "object" || value.exercises === null) return null;
  const exercises: DraftsState["exercises"] = {};
  for (const [id, draft] of Object.entries(value.exercises)) {
    if (!draft || typeof draft.files !== "object" || draft.files === null) continue;
    const files: Record<string, string> = {};
    for (const [name, content] of Object.entries(draft.files)) {
      if (typeof content === "string") files[name] = content;
    }
    exercises[id] = { files, updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : "" };
  }
  return { version: 1, exercises };
}

export function setDraftFile(
  state: DraftsState,
  exerciseId: string,
  fileName: string,
  content: string,
  now: string,
): DraftsState {
  const current = state.exercises[exerciseId];
  if (current?.files[fileName] === content) return state;
  return {
    ...state,
    exercises: {
      ...state.exercises,
      [exerciseId]: { files: { ...current?.files, [fileName]: content }, updatedAt: now },
    },
  };
}

/** The learner's saved content for each file, falling back to the starter code. */
export function resolveFiles(
  state: DraftsState,
  exerciseId: string,
  starterFiles: StarterFile[],
): Record<string, string> {
  const saved = state.exercises[exerciseId]?.files ?? {};
  return Object.fromEntries(starterFiles.map((file) => [file.name, saved[file.name] ?? file.content]));
}
