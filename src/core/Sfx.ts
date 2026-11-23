import { sound } from "@pixi/sound";

/**
 * Tiny facade over @pixi/sound, so game code never touches the sound library directly.
 *
 * Importing "@pixi/sound" (done here) registers its loader with `Assets`, which is what lets
 * `Assets.loadBundle("audio")` decode .ogg/.mp3 and register each file under its alias ("coin").
 * @pixi/sound also unlocks audio on the first tap/click by itself (browsers block sound until then).
 */

/** Play a loaded sound by alias. Unknown aliases are ignored, so a failed audio load never crashes the game. */
export function playSfx(alias: string, volume = 1): void {
	if (!sound.exists(alias)) return;
	void sound.play(alias, { volume });
}

/** Mute or unmute every sound. */
export function setMuted(muted: boolean): void {
	if (muted) sound.muteAll();
	else sound.unmuteAll();
}
