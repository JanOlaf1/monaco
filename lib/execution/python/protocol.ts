import type { ExecutionError, OutputEntry, TestResult, TestSpec } from "../types";

export type PyWorkerRequest =
  | { id: number; type: "init"; harness: string }
  | { id: number; type: "run"; code: string }
  | { id: number; type: "check"; code: string; tests: TestSpec[] }
  | { id: number; type: "syntax"; code: string };

export interface PyRunReport {
  error: ExecutionError | null;
  truncated: boolean;
  output: { stream: string; text: string }[] | null;
}

export interface PyCheckReport {
  run: { error: ExecutionError | null; output: { stream: string; text: string }[]; truncated: boolean };
  tests: TestResult[];
}

export type PyWorkerResponse =
  | { id: number; type: "ready" }
  | { id: number; type: "output"; entry: OutputEntry }
  | { id: number; type: "run-result"; report: PyRunReport }
  | { id: number; type: "check-result"; report: PyCheckReport }
  | { id: number; type: "syntax-result"; error: ExecutionError | null }
  | { id: number; type: "failure"; message: string; fatal: boolean };
