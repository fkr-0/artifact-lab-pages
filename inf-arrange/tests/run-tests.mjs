import { createServer } from "vite";

const testModules = [
  "/tests/core/document.test.ts",
  "/tests/core/geometry.test.ts",
  "/tests/core/migrations.test.ts",
  "/tests/core/plugins.test.ts",
  "/tests/core/edge-semantics.test.ts",
  "/tests/core/item-capabilities.test.ts",
  "/tests/core/media-graph.test.ts",
  "/tests/core/loader.test.ts",
  "/tests/core/store.test.ts",
  "/tests/core/commands.test.ts",
  "/tests/core/import-export.test.ts",
  "/tests/core/provider-boundary.test.ts",
  "/tests/canvas-react/canvas-studio.test.tsx",
];

const server = await createServer({
  configFile: "./vite.config.ts",
  logLevel: "error",
  server: { middlewareMode: true },
});

let failures = 0;
let count = 0;

try {
  for (const modulePath of testModules) {
    const mod = await server.ssrLoadModule(modulePath);
    for (const [name, fn] of Object.entries(mod)) {
      if (!name.startsWith("test")) continue;
      count += 1;
      try {
        await fn();
        console.log(`ok ${modulePath} ${name}`);
      } catch (error) {
        failures += 1;
        console.error(`not ok ${modulePath} ${name}`);
        console.error(error?.stack ?? error);
      }
    }
  }
} finally {
  await server.close();
}

if (count === 0) {
  console.error("No tests were discovered.");
  process.exit(1);
}

if (failures > 0) {
  console.error(`${failures}/${count} tests failed.`);
  process.exit(1);
}

console.log(`${count} tests passed.`);
