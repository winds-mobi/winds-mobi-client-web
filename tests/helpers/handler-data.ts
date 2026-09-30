import type { StructuredDataDocument } from '@warp-drive/core/types/request';

// A Warp Drive handler resolves either to the document it built itself or,
// when it passes a request straight through, to the downstream
// `StructuredDataDocument`. Handler unit tests call handlers directly, so this
// unwraps both to the document's `data`; app code only ever reads the store's
// own `{ content: { data } }`.
export function handlerData<T>(
  result: { data: T } | StructuredDataDocument<{ data: T }>
): T {
  return ('content' in result ? result.content : result).data;
}
