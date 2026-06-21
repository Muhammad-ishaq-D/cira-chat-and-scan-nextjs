import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = join(root, "scripts", "shenai-wasm-parts");
const outputPath = join(root, "public", "wasm", "shenai_sdk.wasm");

const parts = readdirSync(partsDir)
  .filter((file) => file.startsWith("shenai_sdk.wasm.part"))
  .sort();

if (!parts.length) {
  throw new Error("No Shen AI WASM parts found in scripts/shenai-wasm-parts.");
}

const expectedSize = parts.reduce((total, file) => total + statSync(join(partsDir, file)).size, 0);

if (existsSync(outputPath) && statSync(outputPath).size === expectedSize) {
  process.exit(0);
}

mkdirSync(dirname(outputPath), { recursive: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(outputPath);
  output.on("error", reject);
  output.on("finish", resolve);

  const pipePart = (index) => {
    if (index >= parts.length) {
      output.end();
      return;
    }

    const input = createReadStream(join(partsDir, parts[index]));
    input.on("error", reject);
    input.on("end", () => pipePart(index + 1));
    input.pipe(output, { end: false });
  };

  pipePart(0);
});

console.log(`Prepared Shen AI WASM at ${outputPath}`);