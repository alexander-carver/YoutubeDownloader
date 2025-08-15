import { spawn } from "node:child_process";
import { Readable as NodeReadable } from "node:stream";
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

function getYtDlpPathOrCandidates(): { found?: string; candidates: string[] } {
  // Prefer a platform-specific bundled binary at project root or serverless root.
  const cwd = process.cwd();
  const serverlessRoot = "/var/task"; // common on AWS/Vercel
  const names = process.platform === "linux"
    ? ["yt-dlp-linux", "yt-dlp"]
    : process.platform === "darwin"
      ? ["yt-dlp-macos", "yt-dlp"]
      : ["yt-dlp"];

  const locations = [
    cwd,
    serverlessRoot,
    path.join(cwd, ".next"),
    path.join(cwd, ".next/standalone"),
    path.join(cwd, ".next/server"),
    path.dirname(new URL(import.meta.url).pathname || ""),
  ];

  const candidates: string[] = [];
  for (const dir of locations) {
    for (const name of names) {
      candidates.push(path.join(dir, name));
    }
  }

  for (const p of candidates) {
    try {
      const stat = fs.statSync(p);
      if (stat.isFile()) return { found: p, candidates };
    } catch {}
  }
  return { candidates };
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
      // Prefer best audio; extraction will convert to mp3
      "bestaudio/bestaudio*",
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0" // best
    );
  } else {
    // mp4
    const quality = req.quality ?? "auto";
    // Prefer MP4/H264 + M4A to ensure compatibility with MP4 container without transcoding
    if (quality === "1080p") {
      args.push("-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/b[ext=mp4]/b");
    } else if (quality === "720p") {
      args.push("-f", "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/b[ext=mp4]/b");
    } else if (quality === "480p") {
      args.push("-f", "bv*[height<=480][ext=mp4]+ba[ext=m4a]/b[height<=480][ext=mp4]/b[ext=mp4]/b");
    } else {
      args.push("-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b");
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

  // Convert Node.js Readable stream to Web ReadableStream (required by Next.js Response)
  const webStream = NodeReadable.toWeb(stream) as unknown as ReadableStream;
  return new Response(webStream, { headers });
}

function spawnYtDlp(args: string[], binary: string): Promise<{ code: number; stderr: string }>
{
  return new Promise((resolve) => {
    let resolved = false;
    const proc = spawn(binary, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += String(d)));
    proc.on("error", (err) => {
      if (resolved) return;
      resolved = true;
      const msg = `${err.name}: ${err.message}`;
      resolve({ code: 1, stderr: msg });
    });
    proc.on("close", (code) => {
      if (resolved) return;
      resolved = true;
      resolve({ code: code ?? 1, stderr });
    });

    // Safety timeout to avoid hanging requests
    const timeoutMs = 240_000; // 4 minutes
    setTimeout(() => {
      if (resolved) return;
      try {
        proc.kill("SIGKILL");
      } catch {}
      resolved = true;
      resolve({ code: 1, stderr: `Timed out after ${timeoutMs / 1000}s` });
    }, timeoutMs).unref();
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

    const { found: ytDlp, candidates } = getYtDlpPathOrCandidates();
    if (!ytDlp) {
      await fsp.rm(path.dirname(tmpFilePath), { recursive: true, force: true }).catch(() => {});
      return Response.json(
        {
          error:
            `yt-dlp binary not found. Tried: ${candidates.join(", ")}. Ensure postinstall fetched the correct binary and output tracing includes it.`,
        },
        { status: 500 }
      );
    }
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


