// =============================================================================
// Prisma-derived types
// =============================================================================
// Types come from src/generated/prisma (created by `npm run db:generate`).
// =============================================================================

import type { Prisma } from "../generated/prisma";

/** Full row from public.profiles */
export type ProfileRow = Prisma.profilesGetPayload<Record<string, never>>;
