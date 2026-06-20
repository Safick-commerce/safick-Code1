// =============================================================================
// Address Service — buyer-saved delivery addresses (Cameroon-shaped)
// =============================================================================
// Layering: Route → Controller → Service (this file) → prisma.addresses → PostgreSQL.
// Authorization: every read/write is scoped by buyer_id so a user can only
// touch their own addresses. RLS at the database is the second layer (Phase 1
// migration TODO) but the service layer enforces it first.
// =============================================================================

import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import type {
  AddressInput,
  AddressResponse,
  AddressUpdateInput,
} from "../types";

type AddressRow = Awaited<ReturnType<typeof prisma.addresses.findUnique>>;

function toAddressResponse(row: NonNullable<AddressRow>): AddressResponse {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    recipientName: row.recipient_name,
    phone: row.phone,
    city: row.city,
    neighborhood: row.neighborhood,
    landmark: row.landmark,
    notes: row.notes,
    isDefault: row.is_default,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listAddresses(userId: string): Promise<AddressResponse[]> {
  const rows = await prisma.addresses.findMany({
    where: { buyer_id: userId },
    orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
  });
  return rows.map(toAddressResponse);
}

export async function getAddress(
  userId: string,
  addressId: string,
): Promise<AddressResponse> {
  const row = await prisma.addresses.findUnique({ where: { id: addressId } });
  if (!row || row.buyer_id !== userId) {
    throw new AppError("Address not found", 404);
  }
  return toAddressResponse(row);
}

export async function createAddress(
  userId: string,
  input: AddressInput,
): Promise<AddressResponse> {
  const row = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.addresses.updateMany({
        where: { buyer_id: userId, is_default: true },
        data: { is_default: false },
      });
    } else {
      // If the user has no address yet, force this one to be the default
      // so checkout has something to fall back to.
      const count = await tx.addresses.count({ where: { buyer_id: userId } });
      if (count === 0) input.isDefault = true;
    }

    return tx.addresses.create({
      data: {
        buyer_id: userId,
        recipient_name: input.recipientName,
        phone: input.phone,
        city: input.city,
        neighborhood: input.neighborhood,
        landmark: input.landmark ?? null,
        notes: input.notes ?? null,
        is_default: input.isDefault ?? false,
      },
    });
  });
  return toAddressResponse(row);
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressUpdateInput,
): Promise<AddressResponse> {
  const existing = await prisma.addresses.findUnique({ where: { id: addressId } });
  if (!existing || existing.buyer_id !== userId) {
    throw new AppError("Address not found", 404);
  }

  const row = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.addresses.updateMany({
        where: { buyer_id: userId, is_default: true, NOT: { id: addressId } },
        data: { is_default: false },
      });
    }

    return tx.addresses.update({
      where: { id: addressId },
      data: {
        recipient_name: input.recipientName ?? undefined,
        phone: input.phone ?? undefined,
        city: input.city ?? undefined,
        neighborhood: input.neighborhood ?? undefined,
        landmark: input.landmark ?? undefined,
        notes: input.notes ?? undefined,
        is_default: input.isDefault ?? undefined,
        updated_at: new Date(),
      },
    });
  });
  return toAddressResponse(row);
}

export async function deleteAddress(
  userId: string,
  addressId: string,
): Promise<void> {
  const existing = await prisma.addresses.findUnique({ where: { id: addressId } });
  if (!existing || existing.buyer_id !== userId) {
    throw new AppError("Address not found", 404);
  }
  // Cascade is Restrict on checkouts -> addresses; if a checkout used this
  // address we hide it rather than delete, so historical orders keep the link.
  const usedByCheckout = await prisma.checkouts.findFirst({
    where: { address_id: addressId },
    select: { id: true },
  });
  if (usedByCheckout) {
    throw new AppError(
      "This address is referenced by a past order and cannot be deleted.",
      409,
    );
  }
  await prisma.addresses.delete({ where: { id: addressId } });
}
