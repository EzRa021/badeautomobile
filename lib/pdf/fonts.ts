import path from "node:path";
import { readFileSync } from "node:fs";
import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Register Carlito (metric-compatible with Calibri) under the family name
 * "Calibri" so PDF text matches the templates. Idempotent.
 */
export function registerPdfFonts() {
  if (registered) return;

  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "Calibri",
    fonts: [
      { src: path.join(dir, "Carlito-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "Carlito-Bold.ttf"), fontWeight: "bold" },
      { src: path.join(dir, "Carlito-Italic.ttf"), fontStyle: "italic" },
      {
        src: path.join(dir, "Carlito-BoldItalic.ttf"),
        fontWeight: "bold",
        fontStyle: "italic",
      },
    ],
  });

  // Keep words intact (disable hyphenation splitting).
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}

/**
 * Brand assets as in-memory JPEG buffers. Passing a Buffer (not a Windows file
 * path) avoids react-pdf trying to `fetch()` a "C:\..." path as a URL.
 */
function loadJpg(name: string) {
  return readFileSync(path.join(process.cwd(), "public", "brand", name));
}

export const BRAND = {
  letterhead: { data: loadJpg("letterhead-bg.jpg"), format: "jpg" as const },
  signature: { data: loadJpg("signature.jpg"), format: "jpg" as const },
};
