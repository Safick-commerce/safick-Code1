// =============================================================================
// Follow API types & validation
// =============================================================================

import { z } from "zod";

export type FollowProfileSummary = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
};

export type FollowingListResponse = {
  following: FollowProfileSummary[];
};

export type FollowCheckResponse = {
  following: boolean;
};

export type FollowCountsResponse = {
  followers: number;
  following: number;
};

export type FollowMutationResponse = {
  following: boolean;
};

export const followListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type FollowListQuery = z.infer<typeof followListQuerySchema>;
