import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Helper to run execFile as a Promise
function runExecFile(bin: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, (error, stdout, stderr) => {
      if (error) {
        console.error("execFile error:", stderr || error.message);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse("No ID provided", { status: 400 });

  try {
    // 1. Path to yt-dlp binary in the ephemeral /tmp directory
    // We use different binaries depending on the OS (for local testing vs Vercel)
    const isWindows = os.platform() === 'win32';
    const binName = isWindows ? 'yt-dlp.exe' : 'yt-dlp_linux';
    const binPath = path.join(os.tmpdir(), binName);

    // 2. Download the binary if it doesn't exist in /tmp
    if (!fs.existsSync(binPath) || fs.statSync(binPath).size < 1000000) {
      console.log("Downloading yt-dlp binary to", binPath);
      const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binName}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Failed to download yt-dlp");
      
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(binPath, Buffer.from(arrayBuffer));
      
      // Make it executable on Linux
      if (!isWindows) {
        fs.chmodSync(binPath, '755');
      }
      console.log("yt-dlp binary downloaded successfully.");
    }

    // 3. Execute yt-dlp to extract the direct best audio stream URL
    const url = `https://www.youtube.com/watch?v=${id}`;
    const directUrl = await runExecFile(binPath, ['-g', '-f', 'bestaudio', url]);

    if (!directUrl || !directUrl.startsWith("http")) {
      throw new Error("Invalid URL returned by yt-dlp");
    }

    // 4. Proxy the stream to force a download
    const audioRes = await fetch(directUrl);
    if (!audioRes.ok) throw new Error("Failed to fetch audio stream");

    // We can stream the response directly to the client
    return new NextResponse(audioRes.body, {
      headers: {
        'Content-Disposition': `attachment; filename="download-${id}.mp3"`,
        'Content-Type': 'audio/mpeg'
      }
    });
  } catch (error) {
    console.error("Download API Error:", error);
    return new NextResponse("Internal Server Error while extracting media stream.", { status: 500 });
  }
}
