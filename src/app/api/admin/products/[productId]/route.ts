import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  setName: z.string().nullable().optional(),
  cardNumber: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  baseOfferCents: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { productId } = await params;
  const body = schema.parse(await request.json());

  const product = await prisma.product.update({ where: { id: productId }, data: body });
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { productId } = await params;

  const inUse = await prisma.order.findFirst({ where: { productId } });
  if (inUse) return NextResponse.json({ error: "Cannot delete — product has existing orders. Deactivate it instead." }, { status: 409 });

  await prisma.product.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}
