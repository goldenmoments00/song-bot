import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import youtubesearchapi from "youtube-search-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  try {
    // Get up to 10 results
    const data = await youtubesearchapi.GetListByKeyword(q, false, 10, [{type: "video"}]);
    
    // Map the results to match our app's Song format
    const items = (data.items || [])
      .filter((item: any) => item.type === "video")
      .map((item: any) => {
        // Fallback thumbnail if missing
        const thumbnailUrl = item.thumbnail?.thumbnails?.[0]?.url || "https://via.placeholder.com/120x68?text=No+Thumb";
        
        return {
          id: item.id,
          title: item.title,
          channel: item.channelTitle || "YouTube",
          thumbnail: thumbnailUrl,
          url: `https://www.youtube.com/watch?v=${item.id}`,
        };
      });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("YouTube Search Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during search." }, { status: 500 });
  }
}
