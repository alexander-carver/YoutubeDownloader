import { spawn } from "node:child_process";
import { promises as fsp } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import ffmpegPath from "ffmpeg-static";

export const runtime = "nodejs";
export const maxDuration = 300;

type DownloadRequest = {
  url: string;
  format: "mp4" | "mp3";
  quality?: "auto" | "1080p" | "720p" | "480p";
};

function getYtDlpPath(): string {
  // Prefer a bundled binary at project root (macOS/Linux), fallback to PATH
  const localBinary = path.join(process.cwd(), "yt-dlp");
  try {
    const stat = fs.statSync(localBinary);
    if (stat.isFile()) {
      return localBinary;
    }
  } catch {}
  return "yt-dlp"; // rely on system PATH
}

function buildArgs(req: DownloadRequest, outputPath: string): string[] {
  const args: string[] = [
    req.url,
    "--no-playlist",
    "--restrict-filenames",
    "--no-part",
    "-o",
    outputPath,
  ];

  if (ffmpegPath) {
    args.push("--ffmpeg-location", ffmpegPath);
  }

  if (req.format === "mp3") {
    args.push(
      "-f",
      "bestaudio/bestaudio*",
      "-x",
      "--audio-format",
      "mp3"
    );
  } else {
    // mp4
    const quality = req.quality ?? "auto";
    if (quality === "1080p") {
      args.push("-f", "bv*[height<=1080]+ba/b[height<=1080]");
    } else if (quality === "720p") {
      args.push("-f", "bv*[height<=720]+ba/b[height<=720]");
    } else if (quality === "480p") {
      args.push("-f", "bv*[height<=480]+ba/b[height<=480]");
    }
    args.push("--merge-output-format", "mp4");
  }

  return args;
}

async function createTempFile(ext: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "ytdl-"));
  return path.join(dir, `download.${ext}`);
}

async function streamFileAndCleanup(filePath: string, downloadName: string): Promise<Response> {
  const stream = fs.createReadStream(filePath);
  const headers = new Headers();
  headers.set("Content-Type", "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${downloadName.replace(/"/g, "")}"`
  );

  stream.on("close", () => {
    // Best-effort cleanup
    fsp.rm(path.dirname(filePath), { recursive: true, force: true }).catch(() => {});
  });

  return new Response(stream as unknown as ReadableStream, { headers });
}

function spawnYtDlp(args: string[], binary: string): Promise<{ code: number; stderr: string }>
{
  return new Promise((resolve) => {
    const proc = spawn(binary, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += String(d)));
    proc.on("close", (code) => resolve({ code: code ?? 1, stderr }));
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<DownloadRequest>;
    const url = String(body.url || "").trim();
    const format = (body.format as DownloadRequest["format"]) || "mp4";
    const quality = (body.quality as DownloadRequest["quality"]) || "auto";

    if (!url) {
      return Response.json({ error: "Missing 'url'" }, { status: 400 });
    }

    const ext = format === "mp3" ? "mp3" : "mp4";
    const tmpFilePath = await createTempFile(ext);

    const ytDlp = getYtDlpPath();
    const args = buildArgs({ url, format, quality }, tmpFilePath);

    // Ensure parent dir exists (mkdtemp already did)
    // Run yt-dlp
    const { code, stderr } = await spawnYtDlp(args, ytDlp);
    if (code !== 0) {
      // Cleanup
      await fsp.rm(path.dirname(tmpFilePath), { recursive: true, force: true }).catch(() => {});
      const message = stderr || "Download failed";
      return Response.json({ error: message }, { status: 500 });
    }

    // Derive a sane download filename
    const baseName = `youtube-download.${ext}`;
    return await streamFileAndCleanup(tmpFilePath, baseName);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}


