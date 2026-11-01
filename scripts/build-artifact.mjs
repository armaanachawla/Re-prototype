/**
 * Builds the app as one self-contained HTML file for publishing as a
 * claude.ai Artifact: React app bundled with esbuild, Tailwind compiled
 * with PostCSS, both inlined. Fonts load from Google Fonts.
 *
 *   npm run build:artifact   →   artifact-dist/re-recovery.html
 */
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const cssSource = await readFile("src/app/globals.css", "utf8");
const css = (await postcss([tailwind({ optimize: { minify: true } })]).process(cssSource, { from: "src/app/globals.css" })).css;

const result = await build({
  entryPoints: ["artifact/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  logLevel: "warning",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_RE_TARGET": '"artifact"',
  },
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// Host-specific adjustments: font variables (normally set by next/font) and safe-area handling.
const hostCss = `
:root{--font-dm-sans:"DM Sans";--font-fraunces:"Fraunces";}
header.sticky{top:env(safe-area-inset-top,0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:41;background:#faf6ef}
`;

const html = `<title>RE Recovery Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap">
<style>${css}${hostCss}</style>
<div id="re-root"></div>
<script>${js}</script>
`;

await mkdir("artifact-dist", { recursive: true });
await writeFile("artifact-dist/re-recovery.html", html);
console.log(`artifact-dist/re-recovery.html  ${(html.length / 1024).toFixed(0)} KB`);
