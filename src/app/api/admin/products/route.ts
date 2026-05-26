import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  setName: z.string().nullable().optional(),
  cardNumber: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  baseOfferCents: z.number().int().min(0),
  active: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = schema.parse(await request.json());

  const existing = await prisma.product.findUnique({ where: { sku: body.sku } });
  if (existing) return NextResponse.json({ error: "A product with that SKU already exists." }, { status: 409 });

  const product = await prisma.product.create({ data: body });
  return NextResponse.json({ product }, { status: 201 });
}
