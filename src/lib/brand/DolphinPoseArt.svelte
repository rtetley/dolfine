<script lang="ts">
	import type { DolphinPose } from './dolphinPoses';

	interface Props {
		pose: DolphinPose;
		weight?: number;
		fill?: string;
	}

	let { pose, weight = 1.4, fill = 'none' }: Props = $props();
</script>

<path d={pose.dorsal} {fill} stroke-width={weight} />
<path d={pose.pectoral} {fill} stroke-width={weight} />
<path d={pose.body} {fill} stroke-width={weight} />
<path d={pose.ribs} stroke-width={weight * 0.45} />
<path d={pose.hatch} stroke-width={weight * 0.4} />
<path d={pose.belly} stroke-width={weight * 0.45} />
<path d={pose.contour} stroke-width={weight * 0.35} />
<path d={pose.mouth} stroke-width={weight * 0.55} />
<path d={pose.brow} stroke-width={weight * 0.5} />
<path d={pose.blowhole} stroke-width={weight * 0.5} />
<path d={pose.crease} stroke-width={weight * 0.45} />
<circle cx={pose.eye[0]} cy={pose.eye[1]} r={pose.eyeR} {fill} stroke-width={weight * 0.6} />
<circle cx={pose.eye[0]} cy={pose.eye[1]} r={weight * 0.7} fill="currentColor" stroke="none" />
