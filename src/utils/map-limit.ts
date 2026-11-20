export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const queue = items.entries();
  const worker = async () => {
    for (const [index, item] of queue) results[index] = await fn(item);
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}
