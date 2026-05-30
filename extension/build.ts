// Builds the Web Passport extension.
//
// All entrypoints are bundled as ESM:
//   - the service worker is registered with `"type": "module"` in the manifest
//   - extension pages load their bundle via <script type="module">
// The overlay content script (M2) cannot be ESM and will get its own IIFE build.
//
// Entry files live at src/*.{ts,tsx} with unique basenames so dist outputs are
// predictable: dist/service-worker.js, dist/checkpoint.js, dist/popup.js,
// dist/offscreen.js

const watch = process.argv.includes("--watch");

const entrypoints = [
  "./src/service-worker.ts",
  "./src/offscreen.ts",
  "./src/checkpoint.tsx",
  "./src/popup.tsx",
];

// Copy bundled persona packages into dist/personas/ so the extension can fetch
// them at runtime (the default persona ships inside the extension). Source of
// truth is the repo-root personas/ folder.
async function copyPersonas() {
  const { cp, mkdir, readdir } = await import("node:fs/promises");
  const src = "../personas";
  const dest = "./dist/personas";
  await mkdir(dest, { recursive: true });
  let names: string[] = [];
  try {
    names = (await readdir(src, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return;
  }
  for (const name of names) {
    // Skip personas without a manifest (e.g. an empty work-in-progress folder).
    if (!(await Bun.file(`${src}/${name}/persona.json`).exists())) continue;
    await cp(`${src}/${name}`, `${dest}/${name}`, { recursive: true });
  }
  return names;
}

async function build() {
  const result = await Bun.build({
    entrypoints,
    outdir: "./dist",
    target: "browser",
    format: "esm",
    naming: "[name].[ext]",
    minify: false,
    sourcemap: "inline",
  });

  if (!result.success) {
    console.error("Build failed:");
    for (const log of result.logs) console.error(log);
    if (!watch) process.exit(1);
    return;
  }
  await copyPersonas();
  console.log(`Build complete (${result.outputs.length} outputs + personas)`);
}

await build();

if (watch) {
  console.log("Watching src/ for changes...");
  const watcher = (await import("node:fs")).watch(
    "./src",
    { recursive: true },
    () => build(),
  );
  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
}

export {};
