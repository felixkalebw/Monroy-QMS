import fs from "fs";
import path from "path";

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error("Source does not exist:", src);
    process.exit(1);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);
    if (item.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const root = process.cwd();
const src = path.join(root, "public", "dist");
const dest = path.join(root, "api", "public_dist");

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log("✅ Copied web build to", dest);
