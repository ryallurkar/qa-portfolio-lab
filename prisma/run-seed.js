// Node 20's ESM loader rejects .ts as a main entry point before ts-node can
// hook in. This plain .js wrapper registers ts-node first via CJS, then
// requires the seed so the .ts extension is handled correctly.
require("ts-node").register({ project: "./tsconfig.server.json", transpileOnly: true });
require("./seed.ts");
