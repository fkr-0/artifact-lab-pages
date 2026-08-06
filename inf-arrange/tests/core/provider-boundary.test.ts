import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { assertDeepEqual } from "./assertions";

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(path);
  }
  return out;
}

export function testRuntimeComponentsDoNotBypassCanvasStoreProvider(): void {
  const roots = ["src/components", "src/hooks", "src/canvas-react"].flatMap(sourceFiles);
  const offenders = roots.flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return ["useCanvasStore.getState()", "useCanvasStore.setState("].flatMap((needle) =>
      source.includes(needle) ? [`${relative(process.cwd(), file)}:${needle}`] : [],
    );
  });

  assertDeepEqual(offenders, []);
}
