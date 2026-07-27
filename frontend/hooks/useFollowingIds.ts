import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { followSeller, unfollowSeller, fetchMyFollowingIds } from "../utils/followApi";

/**
 * Loads the signed-in user's following list once, then exposes optimistic toggle.
 * Guests always see `isFollowing(sellerId) === false`.
 */
export function useFollowingIds() {
  const { isAuthenticated } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setFollowingIds(new Set());
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    void fetchMyFollowingIds()
      .then((ids) => {
        if (!cancelled) setFollowingIds(ids);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isFollowing = useCallback(
    (sellerId: string) => followingIds.has(sellerId),
    [followingIds],
  );

  const toggleFollow = useCallback(
    async (sellerId: string) => {
      if (!isAuthenticated) {
        Alert.alert("Sign in required", "Sign in to follow sellers on SAFICK.");
        return;
      }

      const wasFollowing = followingIds.has(sellerId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.delete(sellerId);
        else next.add(sellerId);
        return next;
      });

      try {
        if (wasFollowing) {
          await unfollowSeller(sellerId);
        } else {
          await followSeller(sellerId);
        }
      } catch {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (wasFollowing) next.add(sellerId);
          else next.delete(sellerId);
          return next;
        });
        Alert.alert("Could not update follow", "Check your connection and try again.");
      }
    },
    [followingIds, isAuthenticated],
  );

  return { followingIds, isFollowing, toggleFollow, ready };
}
