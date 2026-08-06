export type CanvasDocumentMigration = (
  document: Record<string, unknown>,
) => Record<string, unknown>;

const migrations = new Map<number, CanvasDocumentMigration>();

export function registerCanvasDocumentMigration(
  fromVersion: number,
  migration: CanvasDocumentMigration,
): void {
  migrations.set(fromVersion, migration);
}

export function clearCanvasDocumentMigrationsForTests(): void {
  migrations.clear();
}

export function migrateCanvasDocumentRecord(
  input: Record<string, unknown>,
  targetVersion: number,
): Record<string, unknown> {
  let current = { ...input };
  let version =
    typeof current.version === "number" && Number.isFinite(current.version) ? current.version : 0;

  while (version < targetVersion) {
    const migration = migrations.get(version);
    if (!migration) break;
    current = migration(current);
    version =
      typeof current.version === "number" && Number.isFinite(current.version)
        ? current.version
        : version + 1;
  }

  return current;
}
