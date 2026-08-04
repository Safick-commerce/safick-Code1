import { LocalVideoTrack } from "livekit-client";

type TorchCapableTrack = MediaStreamTrack & {
  applyConstraints?: (constraints: MediaTrackConstraints) => Promise<void>;
};

/** Best-effort torch toggle on a LiveKit local camera track (Android-first). */
export async function setLiveVideoTorch(
  track: LocalVideoTrack | undefined | null,
  enabled: boolean,
): Promise<boolean> {
  if (!track) return false;
  const mediaTrack = track.mediaStreamTrack as TorchCapableTrack | undefined;
  if (!mediaTrack?.applyConstraints) return false;
  try {
    await mediaTrack.applyConstraints({
      advanced: [{ torch: enabled } as MediaTrackConstraintSet],
    });
    return true;
  } catch {
    return false;
  }
}
