import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tokensCss } from "../src/design/tokens.css";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "app", "tokens.generated.css");
writeFileSync(out, tokensCss());
console.warn(`wrote ${out}`);
