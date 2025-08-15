import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = "nodejs";

export async function GET() {
  type YtDlpSearchItem = {
    path: string;
    exists: boolean;
    size?: number;
    isFile?: boolean;
    mode?: string;
    error?: string;
  };

  type Diagnostics = {
    platform: string;
    nodeVersion: string;
    cwd: string;
    dirname: string;
    env: { NODE_ENV?: string; VERCEL?: string; VERCEL_ENV?: string };
    ytDlpSearch: YtDlpSearchItem[];
    filesInRoot: string[] | string;
    filesInTask: string[] | string;
  };

  const diagnostics: Diagnostics = {
    platform: process.platform,
    nodeVersion: process.version,
    cwd: process.cwd(),
    dirname: __dirname,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    ytDlpSearch: [],
    filesInRoot: [],
    filesInTask: [],
  };

  // Check common locations for yt-dlp
  const searchPaths = [
    '/var/task/yt-dlp-linux',
    '/var/task/yt-dlp',
    process.cwd() + '/yt-dlp-linux',
    process.cwd() + '/yt-dlp',
    path.join(__dirname, 'yt-dlp-linux'),
    path.join(__dirname, 'yt-dlp'),
  ];

  for (const searchPath of searchPaths) {
    try {
      const stat = fs.statSync(searchPath);
      diagnostics.ytDlpSearch.push({
        path: searchPath,
        exists: true,
        size: stat.size,
        isFile: stat.isFile(),
        mode: stat.mode.toString(8),
      });
    } catch (err) {
      diagnostics.ytDlpSearch.push({
        path: searchPath,
        exists: false,
        error: (err as Error).message,
      });
    }
  }

  // List files in /var/task (Vercel deployment root)
  try {
    const files = fs.readdirSync('/var/task');
    diagnostics.filesInTask = files.filter(f => 
      f.includes('yt-dlp') || 
      f.includes('.next') || 
      f === 'package.json' ||
      f === 'vercel.json'
    );
  } catch (err) {
    diagnostics.filesInTask = `Error: ${(err as Error).message}`;
  }

  // List files in process.cwd()
  try {
    const files = fs.readdirSync(process.cwd());
    diagnostics.filesInRoot = files.filter(f => 
      f.includes('yt-dlp') || 
      f === '.next' || 
      f === 'package.json' ||
      f === 'vercel.json'
    );
  } catch (err) {
    diagnostics.filesInRoot = `Error: ${(err as Error).message}`;
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}
