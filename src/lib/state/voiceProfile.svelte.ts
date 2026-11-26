import { isVoiceProfile } from '#lib/audio/voice/calibration.ts';
import type { VoiceProfile } from '#lib/audio/voice/names.ts';
import type { NoteNameSystem } from '#lib/music/pitch.ts';
import { readStored, writeStored } from './persisted';

const KEY = 'voice-profile';
const isStoredProfile = (value: unknown): value is VoiceProfile | null =>
	value === null || isVoiceProfile(value);

/** The calibration of this device's microphone and the student's voice, kept per browser. */
class VoiceProfileStore {
	value = $state<VoiceProfile | null>(readStored(KEY, null, isStoredProfile));

	/** A profile only fits the names it was recorded with. */
	for(names: NoteNameSystem): VoiceProfile | null {
		return this.value?.names === names ? this.value : null;
	}

	save(profile: VoiceProfile): void {
		this.value = profile;
		writeStored(KEY, profile);
	}
}

export const voiceProfile = new VoiceProfileStore();
