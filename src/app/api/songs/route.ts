import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client globally to avoid connection exhaustion in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectIdParam = searchParams.get("projectId");

  if (!projectIdParam) {
    return NextResponse.json({
      projectId: "",
      brideName: "",
      groomName: "",
      selections: {},
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { projectId: projectIdParam.trim() },
      include: { selections: true },
    });

    if (!order) {
      return NextResponse.json({
        projectId: "",
        brideName: "",
        groomName: "",
        selections: {},
      });
    }

    // Group selections by category
    const selections: Record<string, unknown[]> = {};
    for (const song of order.selections) {
      if (!selections[song.category]) {
        selections[song.category] = [];
      }
      selections[song.category].push({
        id: song.songId,
        title: song.title,
        url: song.url,
        thumbnail: song.thumbnail,
        channel: "Unknown Channel", // Or add channel to DB schema if needed
      });
    }

    return NextResponse.json({
      projectId: order.projectId,
      brideName: order.brideName,
      groomName: order.groomName,
      selections,
    });
  } catch (error: unknown) {
    console.error("GET Songs Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, brideName, groomName, selections, eventType } = body;

  if (!projectId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  try {
    // Upsert the order
    const order = await prisma.order.upsert({
      where: { projectId: projectId.trim() },
      update: {
        brideName: brideName || "",
        groomName: groomName || "",
        eventType: eventType || "wedding",
      },
      create: {
        projectId: projectId.trim(),
        brideName: brideName || "",
        groomName: groomName || "",
        eventType: eventType || "wedding",
      },
    });

    // We will clear existing selections for this order and insert the new ones
    // to match the exact payload (upserting arrays is easier by replacing)
    await prisma.songSelection.deleteMany({
      where: { orderId: order.id },
    });

    const newSelections = [];
    for (const [category, songs] of Object.entries(selections || {})) {
      if (Array.isArray(songs)) {
        for (const song of songs) {
          if (song.id && song.title && song.url && song.thumbnail) {
             newSelections.push({
               orderId: order.id,
               category,
               songId: song.id,
               title: song.title,
               url: song.url,
               thumbnail: song.thumbnail,
               isPriority: song.isPriority || false,
             });
          }
        }
      }
    }

    if (newSelections.length > 0) {
      await prisma.songSelection.createMany({
        data: newSelections,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST Songs Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
