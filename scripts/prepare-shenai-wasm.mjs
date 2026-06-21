import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = join(root, "scripts", "shenai-wasm-parts");
const outputPath = join(root, "public", "wasm", "shenai_sdk.wasm");
const expectedSha256 = "29f5c1d369730dfb99f6a4310c7a14d756626afd5c7ba125493d2996b1d831e2";

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

const parts = readdirSync(partsDir)
  .filter((file) => file.startsWith("shenai_sdk.wasm.part"))
  .sort();

if (!parts.length) {
  throw new Error("No Shen AI WASM parts found in scripts/shenai-wasm-parts.");
}

const expectedSize = parts.reduce((total, file) => total + statSync(join(partsDir, file)).size, 0);

if (existsSync(outputPath) && statSync(outputPath).size === expectedSize && sha256(outputPath) === expectedSha256) {
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

const actualSha256 = sha256(outputPath);
if (actualSha256 !== expectedSha256) {
  throw new Error(`Prepared Shen AI WASM checksum mismatch: expected ${expectedSha256}, got ${actualSha256}`);
}