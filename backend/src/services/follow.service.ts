// =============================================================================
// Follow service — seller social graph implementation with Prisma ORM and TypeScript 
// This service provides the functionality to follow and unfollow sellers, as well as to check if a user is following a seller.
// It also provides the functionality to list the users that a user is following, and to get the number of followers and following of a user.
// =============================================================================

import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import type {
  FollowCountsResponse,
  FollowMutationResponse,
  FollowProfileSummary,
  FollowingListResponse,
} from "../types/follow"; 

function mapProfileSummary(row: {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
}): FollowProfileSummary {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    city: row.city,
  };
}

// 404 error is returned if the user or seller does not exist
async function assertProfileExists(profileId: string): Promise<void> {
  const profile = await prisma.profiles.findUnique({
    where: { id: profileId },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError("User not found", 404);
  }
}

// If user or seller exist the the request will be validated and the follow will be created
// Async means the function will return a promise
// Promise is a value that is not yet known, but will be known in the future
export async function followSeller(
  followerId: string,
  sellerId: string,
): Promise<FollowMutationResponse> {
  if (followerId === sellerId) {
    throw new AppError("Cannot follow yourself", 400);
  }

  await assertProfileExists(sellerId);

  try {
    await prisma.follows.create({
      data: {
        follower_id: followerId,
        followee_id: sellerId,
      },
    });
  } catch (error: unknown) {
    const code =
      typeof error === "object" &&
      error &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
        ? (error as { code: string }).code
        : null;
    if (code === "P2002") {
      return { following: true };
    }
    throw error;
  }

  return { following: true };
}

export async function unfollowSeller(
  followerId: string,
  sellerId: string,
): Promise<FollowMutationResponse> {
  if (followerId === sellerId) {
    throw new AppError("Cannot unfollow yourself", 400);
  }

  await prisma.follows.deleteMany({
    where: {
      follower_id: followerId,
      followee_id: sellerId,
    },
  });

  return { following: false };
}

export async function isFollowing(
  followerId: string,
  sellerId: string,
): Promise<boolean> {
  if (followerId === sellerId) {
    return false;
  }

  const row = await prisma.follows.findUnique({
    where: {
      follower_id_followee_id: {
        follower_id: followerId,
        followee_id: sellerId,
      },
    },
    select: { follower_id: true },
  });

  return Boolean(row);
}

export async function listFollowing(
  followerId: string,
  limit: number,
): Promise<FollowingListResponse> {
  const rows = await prisma.follows.findMany({
    where: { follower_id: followerId },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      followee: {
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
          city: true,
        },
      },
    },
  });

  return {
    following: rows.map((row) => mapProfileSummary(row.followee)),
  };
}

export async function getFollowCounts(profileId: string): Promise<FollowCountsResponse> {
  await assertProfileExists(profileId);

  const [followers, following] = await Promise.all([
    prisma.follows.count({ where: { followee_id: profileId } }),
    prisma.follows.count({ where: { follower_id: profileId } }),
  ]);

  return { followers, following };
}
