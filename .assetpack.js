// AssetPack config: turns raw-assets/ (source, committed) into public/assets/ (generated, not committed).
// Run with `npm run assets`. Folder tags: {tps} = pack into a spritesheet, {m} = manifest bundle.
import { pixiPipes } from "@assetpack/core/pixi";

export default {
	entry: "./raw-assets",
	output: "./public/assets",
	cache: true, // only re-process files that changed since the last run (stored in .assetpack/)
	pipes: [
		...pixiPipes({
			cacheBust: false, // turned on at deploy time (hashed filenames for CDN caching)
			resolutions: { default: 1 }, // one size for now; @0.5x low-end variants come in the perf lesson
			texturePacker: { texturePacker: { removeFileExtension: true } }, // frame "walk0", not "walk0.png"
			manifest: { output: "./public/assets/manifest.json", trimExtensions: true },
		}),
	],
};
