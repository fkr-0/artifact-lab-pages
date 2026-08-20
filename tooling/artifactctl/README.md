# artifactctl

V12 control-plane prototype. It is additive and does not alter V11 sources.

```sh
node tooling/artifactctl/src/cli.mjs inventory
node tooling/artifactctl/src/cli.mjs discover --adapter app-hub-v11
node tooling/artifactctl/src/cli.mjs validate --adapter app-hub-v11
node tooling/artifactctl/src/cli.mjs build --all
node tooling/artifactctl/src/cli.mjs catalog --adapter app-hub-v11
node tooling/artifactctl/src/cli.mjs site --adapter app-hub-v11
node --test tooling/artifactctl/tests/*.test.mjs
```

Builds are isolated under `dist/` by default. Compile commands are never executed
unless `--allow-compile` is supplied. V11 shell commands remain provisional metadata.
