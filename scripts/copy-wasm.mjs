// Copies wasm binaries out of node_modules into public/, so the browser can
// fetch them by URL and no bundler wasm handling is needed:
//   public/typst/wasm   the typst.ts compiler and renderer (libs/typst/client.ts)
//   public/pdfjs/wasm   pdfjs-dist's image decoders  (libs/extractFile.ts)
// Runs on `npm install`, `npm run dev` and `npm run build`. Both output
// directories are gitignored.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const nodeModules = (...parts) => join(root, "node_modules", ...parts);
const publicDir = (...parts) => join(root, "public", ...parts);

// pdfjs picks one of these per image codec at run time, so copy whatever the
// installed version ships rather than naming them here.
const PDFJS_WASM_DIR = nodeModules("pdfjs-dist", "wasm");
const pdfjsSources = existsSync(PDFJS_WASM_DIR)
  ? readdirSync(PDFJS_WASM_DIR)
      .filter((name) => name.endsWith(".wasm"))
      .map((name) => join(PDFJS_WASM_DIR, name))
  : [];

const groups = [
  {
    out: publicDir("typst", "wasm"),
    from: nodeModules("@myriaddreamin"),
    sources: [
      nodeModules("@myriaddreamin", "typst-ts-web-compiler", "pkg", "typst_ts_web_compiler_bg.wasm"),
      nodeModules("@myriaddreamin", "typst-ts-renderer", "pkg", "typst_ts_renderer_bg.wasm"),
    ],
  },
  {
    out: publicDir("pdfjs", "wasm"),
    from: PDFJS_WASM_DIR,
    sources: pdfjsSources,
  },
];

// A `console.warn` during `npm install` is invisible, and a half-copied tree
// surfaces much later as an opaque "Expected 'application/wasm'" error in the
// browser. Fail the command instead.
const missing = groups.flatMap(({ from, sources }) =>
  sources.length === 0 ? [from] : sources.filter((src) => !existsSync(src)),
);
if (missing.length > 0) {
  console.error(
    `[wasm] missing source(s):\n${missing.map((src) => `  ${src}`).join("\n")}\n` +
      "Dependencies are not installed. Run `npm install` and try again.",
  );
  process.exit(1);
}

for (const { out, sources } of groups) {
  mkdirSync(out, { recursive: true });
  for (const src of sources) {
    const name = src.split(/[\\/]/).pop();
    const dest = join(out, name);
    // This runs on every `dev` and `build`; ~30 MB is worth not re-copying.
    if (existsSync(dest) && statSync(dest).size === statSync(src).size) continue;
    copyFileSync(src, dest);
    const mb = (statSync(dest).size / 1024 / 1024).toFixed(1);
    console.log(`[wasm] copied ${name} (${mb} MB) -> ${out.slice(root.length + 1)}/`);
  }
}
