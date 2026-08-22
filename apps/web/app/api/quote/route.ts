/**
 * Prices a cart. The checkout page calls this to show real NPR totals — the
 * browser cart carries no prices of its own.
 *
 * Advisory only: /api/checkout re-quotes before charging anyone, so a stale or
 * tampered response from here cannot change what is billed.
 */
import { NextResponse } from "next/server";
import { quoteCart, QuoteError, type QuoteRequestItem } from "@/lib/quote";
import { AlibabaError } from "@/lib/alibaba/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { items?: QuoteRequestItem[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: "Too many products in one order" }, { status: 400 });
  }

  try {
    const quote = await quoteCart(body.items);
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof AlibabaError) {
      console.error("[quote] Alibaba upstream failed", error);
      return NextResponse.json({ error: "Live pricing is unavailable right now" }, { status: 502 });
    }
    console.error("[quote] unexpected failure", error);
    return NextResponse.json({ error: "Could not price your cart" }, { status: 500 });
  }
}
