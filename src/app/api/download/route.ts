import { spawn } from "node:child_process";
import { Readable as NodeReadable } from "node:stream";
import { promises as fsp } from "node:fs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

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

  // In Vercel deployment, __dirname will be /var/task/.next/server/app/api/download
  // The binary should be at /var/task/yt-dlp-linux due to includeFiles in vercel.json
  const locations = [
    serverlessRoot, // /var/task - Primary location for Vercel
    cwd, // process.cwd() - for local development
    path.join(cwd, "web"), // In case cwd is parent directory
    path.join(serverlessRoot, ".next/server/app/api/download"), // API route location
    path.join(cwd, ".next"),
    path.join(cwd, ".next/standalone"),
    path.join(cwd, ".next/server"),
    path.dirname(new URL(import.meta.url).pathname || ""),
    __dirname, // Current directory of this file
  ];

  const candidates: string[] = [];
  for (const dir of locations) {
    for (const name of names) {
      candidates.push(path.join(dir, name));
    }
  }

  // Log for debugging in production
  if (process.env.NODE_ENV === 'production') {
    console.log('[yt-dlp] Looking for binary in:', candidates.slice(0, 5));
    console.log('[yt-dlp] Current directory:', __dirname);
    console.log('[yt-dlp] Process cwd:', process.cwd());
  }

  for (const p of candidates) {
    try {
      const stat = fs.statSync(p);
      if (stat.isFile()) {
        if (process.env.NODE_ENV === 'production') {
          console.log('[yt-dlp] Found binary at:', p);
        }
        return { found: p, candidates };
      }
    } catch {}
  }
  return { candidates };
}

async function downloadYtDlpToTmp(): Promise<string | undefined> {
  try {
    const isLinux = process.platform === "linux";
    const linuxCandidates = [
      // Try most compatible binaries first; names may vary between releases
      "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp", // common standalone
      "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux", // static linux variant
      "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_x86_64",
      "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp", // nightly
      "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp_linux",
      "https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp_x86_64"
    ];

    const urlList = isLinux
      ? linuxCandidates
      : [
          "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
        ];

    const filename = isLinux ? "yt-dlp-linux" : "yt-dlp-macos";
    const destDir = await fsp.mkdtemp(path.join(os.tmpdir(), "yt-dlp-"));
    const destPath = path.join(destDir, filename);

    let lastError: string | undefined;
    for (const candidateUrl of urlList) {
      try {
        const res = await fetch(candidateUrl);
        if (!res.ok) {
          lastError = `${res.status} ${res.statusText}`;
          continue;
        }
        const arrayBuffer = await res.arrayBuffer();
        await fsp.writeFile(destPath, Buffer.from(arrayBuffer));
        await fsp.chmod(destPath, 0o755);

        // Smoke-test the binary to ensure it runs on this platform
        const { code, stderr } = await spawnYtDlp(["--version"], destPath);
        if (code === 0) {
          if (process.env.NODE_ENV === 'production') {
            console.log('[yt-dlp] Downloaded runtime binary to', destPath, 'from', candidateUrl);
          }
          return destPath;
        }
        lastError = stderr || `exit code ${code}`;
      } catch (e) {
        lastError = (e as Error).message;
      }
    }

    throw new Error(`Tried multiple URLs for yt-dlp, last error: ${lastError}`);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[yt-dlp] Runtime download failed:', (err as Error).message);
    }
    return undefined;
  }
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

async function downloadWithYtdlCore(
  req: DownloadRequest,
  outputPath: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ytdl = (await import("ytdl-core")).default;

    // Ensure ffmpeg points to the static binary
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }

    const toNodeReadable = (stream: unknown): NodeReadable => {
      try {
        const maybeWeb = stream as { getReader?: () => unknown };
        const readableFromWeb = (NodeReadable as unknown as { fromWeb?: (s: unknown) => NodeReadable }).fromWeb;
        if (maybeWeb && typeof maybeWeb.getReader === "function" && typeof readableFromWeb === "function") {
          return readableFromWeb(stream);
        }
      } catch {}
      return stream as NodeReadable;
    };

    if (req.format === "mp3") {
      const audio = ytdl(req.url, { quality: "highestaudio", filter: "audioonly" });
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(toNodeReadable(audio) as unknown as NodeJS.ReadableStream)
          .audioCodec("libmp3lame")
          .audioBitrate(320)
          .format("mp3")
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
      return { ok: true };
    }

    // MP4 path: pick best AVC video + best M4A audio and mux
    const info = await ytdl.getInfo(req.url);

    const toHeight = (q: DownloadRequest["quality"]) =>
      q === "1080p" ? 1080 : q === "720p" ? 720 : q === "480p" ? 480 : Infinity;

    const maxH = toHeight(req.quality ?? "auto");
    const videoFormat = ytdl.chooseFormat(
      info.formats
        .filter((f) => f.hasVideo && !f.hasAudio)
        .filter((f) => (f.height ? f.height <= maxH : true))
        .filter((f) => (f.codecs ? f.codecs.includes("avc1") || f.codecs.includes("h264") : true))
        .filter((f) => f.container === "mp4" || f.container === "mp4_dash"),
      { quality: "highestvideo" }
    );

    const audioFormat = ytdl.chooseFormat(
      info.formats.filter((f) => f.hasAudio && !f.hasVideo && (f.container === "m4a" || f.container === "mp4")),
      { quality: "highestaudio" }
    );

    const videoStream = ytdl.downloadFromInfo(info, { format: videoFormat });
    const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .addInput(toNodeReadable(videoStream) as unknown as NodeJS.ReadableStream)
        .addInput(toNodeReadable(audioStream) as unknown as NodeJS.ReadableStream)
        .videoCodec("copy")
        .audioCodec("aac")
        .format("mp4")
        .outputOptions(["-movflags +faststart"]) // better streaming compatibility
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ytdl-core fallback failed";
    return { ok: false, error: msg };
  }
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

    const { candidates /* eslint-disable-line @typescript-eslint/no-unused-vars */, found } = getYtDlpPathOrCandidates();
    let ytDlp = found;
    if (!ytDlp) {
      // Try runtime download of yt-dlp; if that fails, fall back to ytdl-core+ffmpeg
      const downloaded = await downloadYtDlpToTmp();
      if (downloaded) {
        ytDlp = downloaded;
      } else {
        const fallback = await downloadWithYtdlCore({ url, format, quality }, tmpFilePath);
        if (!fallback.ok) {
          await fsp.rm(path.dirname(tmpFilePath), { recursive: true, force: true }).catch(() => {});
          return Response.json(
            { error: `yt-dlp unavailable and Node fallback failed: ${fallback.error}` },
            { status: 500 }
          );
        }
        const baseName = `youtube-download.${ext}`;
        return await streamFileAndCleanup(tmpFilePath, baseName);
      }
    }
    const args = buildArgs({ url, format, quality }, tmpFilePath);

    // Run yt-dlp
    const { code, stderr } = await spawnYtDlp(args, ytDlp);
    if (code !== 0) {
      // If yt-dlp failed (e.g., incompatible), try Node fallback before giving up
      const fallback = await downloadWithYtdlCore({ url, format, quality }, tmpFilePath);
      if (!fallback.ok) {
        await fsp.rm(path.dirname(tmpFilePath), { recursive: true, force: true }).catch(() => {});
        const message = stderr || fallback.error || "Download failed";
        return Response.json({ error: message }, { status: 500 });
      }
      const baseName = `youtube-download.${ext}`;
      return await streamFileAndCleanup(tmpFilePath, baseName);
    }

    // Derive a sane download filename
    const baseName = `youtube-download.${ext}`;
    return await streamFileAndCleanup(tmpFilePath, baseName);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}


