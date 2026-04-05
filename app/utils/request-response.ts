export type RequestResponse<T> = { data: T } | { content: { data: T } };

export function responseData<T>(response: RequestResponse<T>): T {
  return 'data' in response ? response.data : response.content.data;
}
