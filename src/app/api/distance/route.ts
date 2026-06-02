// app/api/distance/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY; 
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.rows[0]?.elements[0]?.status === "OK") {
      const distanceText = data.rows[0].elements[0].distance.text; // e.g., "15.4 km"
      return NextResponse.json({ distance: distanceText });
    }
    return NextResponse.json({ distance: "N/A" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch distance" }, { status: 500 });
  }
}