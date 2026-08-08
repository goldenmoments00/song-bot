import { NextRequest, NextResponse } from "next/server";
import yt from "youtube-ext";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return new NextResponse("No ID provided", { status: 400 });

  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const videoInfo = await yt.videoInfo(url);
    
    // Find the best audio format
    const audioFormats = (videoInfo.stream as any).audio || [];
    if (audioFormats.length === 0) {
      throw new Error("No audio formats found");
    }

    // Proxy the stream to force a download and bypass CORS
    const directUrl = audioFormats[0].url;
    const audioRes = await fetch(directUrl);
    
    if (!audioRes.ok) {
      throw new Error("Failed to fetch audio stream");
    }

    return new NextResponse(audioRes.body, {
      headers: {
        'Content-Disposition': `attachment; filename="download-${id}.mp3"`,
        'Content-Type': 'audio/mpeg'
      }
    });
  } catch (error: any) {
    console.error("Download API Error:", error);
    return new NextResponse(`Internal Server Error: ${error.message || error}`, { status: 500 });
  }
}
