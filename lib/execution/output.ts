import type { OutputEntry, OutputStream } from "./types";

/** Splits streamed text chunks into one OutputEntry per line. */
export function createLineBuffer(onEntry: (entry: OutputEntry) => void) {
  const buffers = new Map<OutputStream, string>();
  return {
    push(stream: OutputStream, text: string) {
      let buffer = (buffers.get(stream) ?? "") + text;
      let index = buffer.indexOf("\n");
      while (index >= 0) {
        onEntry({ stream, text: buffer.slice(0, index) });
        buffer = buffer.slice(index + 1);
        index = buffer.indexOf("\n");
      }
      buffers.set(stream, buffer);
    },
    flush() {
      for (const [stream, buffer] of buffers) {
        if (buffer) onEntry({ stream, text: buffer });
      }
      buffers.clear();
    },
  };
}

/** Convert captured `{stream, text}` chunks into line entries. */
export function chunksToEntries(chunks: { stream: string; text: string }[]): OutputEntry[] {
  const entries: OutputEntry[] = [];
  const buffer = createLineBuffer((entry) => entries.push(entry));
  for (const chunk of chunks) {
    buffer.push(chunk.stream === "stderr" ? "stderr" : "stdout", chunk.text);
  }
  buffer.flush();
  return entries;
}
