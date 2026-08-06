export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(message ?? `Expected ${String(expected)}, got ${String(actual)}`);
  }
}

function canonicalJsonSafe(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJsonSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, canonicalJsonSafe(entryValue)]),
    );
  }
  return value;
}

export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  const canonicalActual = canonicalJsonSafe(actual);
  const canonicalExpected = canonicalJsonSafe(expected);
  const actualJson = JSON.stringify(canonicalActual, null, 2);
  const expectedJson = JSON.stringify(canonicalExpected, null, 2);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message ?? "Values are not deeply equal"}\nexpected: ${expectedJson}\nactual:   ${actualJson}`,
    );
  }
}
