import { NextRequest, NextResponse } from "next/server";
import { searchSiteWithDuckDuckGo } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const partName: string = (body?.partName ?? "").toString();
    const partNumber: string = (body?.partNumber ?? "").toString();
    const sites: string[] = Array.isArray(body?.sites) ? body.sites.map((s: string) => s.toString()) : [];

    if ((!partName && !partNumber) || sites.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const terms = [partName, partNumber].map((t) => t.trim()).filter(Boolean).join(" ");

    const tasks = sites.map(async (site) => {
      try {
        const results = await searchSiteWithDuckDuckGo(site, terms, 8);
        return { site, results };
      } catch (e: any) {
        return { site, results: [], error: e?.message ?? "Search error" };
      }
    });

    const results = await Promise.all(tasks);
    return NextResponse.json({ results }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid request" }, { status: 400 });
  }
}
