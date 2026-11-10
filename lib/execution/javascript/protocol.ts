import type { OutputEntry, TestSpec } from "../types";
import type { EngineResult } from "./engine";

export type JsWorkerRequest = {
  mode: "run" | "check";
  code: string;
  fileName: string;
  tests?: TestSpec[];
};

export type JsWorkerResponse =
  | { type: "output"; entry: OutputEntry }
  | { type: "result"; result: EngineResult };
