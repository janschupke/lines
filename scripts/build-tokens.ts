import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { themeCss, tokensCss } from "../src/design/tokens.css";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "app", "tokens.generated.css");
writeFileSync(out, tokensCss());
console.warn(`wrote ${out}`);
const themeOut = join(root, "app", "theme.generated.css");
writeFileSync(themeOut, themeCss());
console.warn(`wrote ${themeOut}`);
