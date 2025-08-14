/*
  Minimal Figma exporter: pulls document data, then exports all vector nodes (icons/logos) as SVG
  and raster nodes as PNG to public/assets.
*/
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const FIGMA_TOKEN = process.env.FIGMA_TOKEN!;
const FILE_KEY = process.env.FIGMA_FILE_KEY!;

if (!FIGMA_TOKEN || !FILE_KEY) {
  console.error("FIGMA_TOKEN and FIGMA_FILE_KEY are required in .env.local");
  process.exit(1);
}

const OUTPUT_DIR = path.join(process.cwd(), "public", "assets");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function figmaGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "X-Figma-Token": FIGMA_TOKEN } as HeadersInit,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

type FigmaNode = {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

async function collectExportableNodes(): Promise<FigmaNode[]> {
  const file = await figmaGet<{ document: FigmaNode }>(`https://api.figma.com/v1/files/${FILE_KEY}`);
  const exportables: FigmaNode[] = [];
  const queue: FigmaNode[] = [file.document];
  while (queue.length) {
    const node = queue.shift()!;
    if (node.children) {
      for (const child of node.children) queue.push(child);
    }
    // Heuristic: export frames/components/groups that look like icons/logos or images
    const lower = node.name.toLowerCase();
    const isIconLike = /(icon|logo|mark|favicon|brand)/.test(lower);
    const isAssetPage = /(assets|icons)/.test(lower) || node.type === "COMPONENT" || node.type === "COMPONENT_SET";
    if (isIconLike || isAssetPage) exportables.push(node);
  }
  // Fallback: if nothing matched, grab first few frames/components/groups/vectors from the first page
  if (exportables.length === 0) {
    const fallback: FigmaNode[] = [];
    const queue2: FigmaNode[] = [file.document];
    while (queue2.length && fallback.length < 20) {
      const node = queue2.shift()!;
      if (node.children) node.children.forEach((c) => queue2.push(c));
      if (["FRAME", "COMPONENT", "GROUP", "VECTOR", "COMPONENT_SET"].includes(node.type)) {
        fallback.push(node);
      }
    }
    return fallback;
  }
  return exportables;
}

async function exportImages(
  nodeIds: string[],
  format: "svg" | "png",
  idToName: Map<string, string>
) {
  if (nodeIds.length === 0) return;
  const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(nodeIds.join(","))}&format=${format}&scale=2`;
  const data = await figmaGet<{ images: Record<string, string | null> }>(url);
  for (const [id, imageUrl] of Object.entries(data.images)) {
    if (!imageUrl) continue;
    const res = await fetch(imageUrl);
    if (!res.ok) continue;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base = slugifyName(idToName.get(id) ?? id);
    const safeId = id.replace(/[^a-zA-Z0-9_-]+/g, "-");
    const filename = `${base}-${safeId}.${format}`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
    console.log(`Saved ${filename}`);
  }
}

async function main() {
  console.log("Collecting nodes from Figma...");
  const nodes = await collectExportableNodes();
  const ids = nodes.map((n) => n.id);
  const idToName = new Map(nodes.map((n) => [n.id, n.name] as const));
  // Try SVG first, also fetch PNG fallbacks
  await exportImages(ids, "svg", idToName);
  await exportImages(ids, "png", idToName);

  // Promote the first logo-like SVG as public/logo.svg for easy referencing in UI
  const logoCandidate = nodes.find((n) => /logo|mark|brand/i.test(n.name));
  if (logoCandidate) {
    const logoSlug = `${slugifyName(logoCandidate.name)}-${logoCandidate.id.replace(/[^a-zA-Z0-9_-]+/g, "-")}.svg`;
    const srcPath = path.join(OUTPUT_DIR, logoSlug);
    const dstPath = path.join(process.cwd(), "public", "logo.svg");
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, dstPath);
      console.log(`Promoted logo to ${dstPath}`);
    }
  }

  // Heuristic fallback: if no logo.svg yet, pick a small-ish svg that isn't a layout/background element
  const logoPath = path.join(process.cwd(), "public", "logo.svg");
  if (!fs.existsSync(logoPath)) {
    const banned = ["background", "section", "container", "footer", "header", "overlay", "border", "shadow"]; 
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".svg"));
    let picked: string | null = null;
    for (const f of files) {
      const lower = f.toLowerCase();
      if (banned.some((b) => lower.includes(b))) continue;
      const full = path.join(OUTPUT_DIR, f);
      const stat = fs.statSync(full);
      if (stat.size > 0 && stat.size < 100 * 1024) { // <100KB
        picked = full;
        break;
      }
    }
    if (picked) {
      fs.copyFileSync(picked, logoPath);
      console.log(`Promoted fallback logo to ${logoPath} from ${path.basename(picked)}`);
    }
  }
  console.log(`Done. Assets in public/assets (${OUTPUT_DIR})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


