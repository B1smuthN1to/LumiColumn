/**
 * build.js — bundles backend and frontend with esbuild
 * Run: node build.js
 * Dev:  node build.js --watch
 */
const esbuild = require("esbuild");
const watch = process.argv.includes("--watch");

const shared = {
  bundle: true,
  platform: "browser",
  target: "es2020",
  format: "iife",
};

async function build() {
  const ctx_be = await esbuild.context({
    ...shared,
    entryPoints: ["src/backend.js"],
    outfile: "dist/backend.js",
    platform: "node",
    globalName: undefined,
  });

  const ctx_fe = await esbuild.context({
    ...shared,
    entryPoints: ["src/frontend.js"],
    outfile: "dist/frontend.js",
  });

  if (watch) {
    await ctx_be.watch();
    await ctx_fe.watch();
    console.log("Watching for changes…");
  } else {
    await ctx_be.rebuild();
    await ctx_fe.rebuild();
    ctx_be.dispose();
    ctx_fe.dispose();
    console.log("Build complete → dist/");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
