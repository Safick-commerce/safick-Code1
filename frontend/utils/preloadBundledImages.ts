import { Asset } from "expo-asset";
import { Image } from "expo-image";

/**
 * Warms the image cache for bundled require() assets before they appear on screen.
 * Best-effort — failures are ignored so UI never blocks on preload alone.
 */
export async function preloadBundledImages(modules: readonly number[]): Promise<void> {
  const unique = [...new Set(modules)];

  await Promise.all(
    unique.map(async (moduleId) => {
      try {
        const asset = Asset.fromModule(moduleId);
        if (!asset.downloaded) {
          await asset.downloadAsync();
        }
        const uri = asset.localUri ?? asset.uri;
        if (uri) {
          await Image.prefetch(uri);
        }
      } catch {
        /* ignore — onLoad on the component is the fallback */
      }
    }),
  );
}
