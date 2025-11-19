import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { tokenize } from "./lexer";
import { parse } from "./parser";
import { generateTS } from "./codegen";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx ts-node src/cli.ts <file.gm>");
  process.exit(1);
}

const code = fs.readFileSync(file, "utf8");
const tokens = tokenize(code);
const ast = parse(tokens);
const tsCode = generateTS(ast);

const outFile = path.basename(file, ".gm") + ".ts";
fs.writeFileSync(outFile, tsCode);
console.log(`✅ Generated ${outFile}`);

try {
  execSync(`npx ts-node ${outFile}`, { stdio: "inherit", shell: true as any });

} catch (err) {
  console.error("❌ Error running transpiled code:", err);
}
