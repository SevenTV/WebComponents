<template>
	<svg class="seventv-logo" :color="props.color ?? ''" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109.6 80.9">
		<g>
			<path
				ref="segment1"
				class="segment"
				d="M29,80.6l5-8.7,5-8.7,5-8.7,5-8.7,5-8.7,5-8.7L62.7,22l-5-8.7-5-8.7L49.9.1H7.7l-5,8.7L0,13.4l5,8.7v.2h32l-5,8.7-5,8.7-5,8.7-5,8.7-5,8.7L8.5,72l5,8.7v.2H29"
				fill="currentColor"
			></path>
			<path
				ref="segment2"
				class="segment"
				d="M70.8,80.6H86.1l5-8.7,5-8.7,5-8.7,5-8.7,3.5-6-5-8.7v-.2H89.2l-5,8.7-5,8.7-.7,1.3-5-8.7-5-8.7-.7-1.3-5,8.7-5,8.7L55,53.1l5,8.7,5,8.7,5,8.7.8,1.4"
				fill="currentColor"
			></path>
			<path
				ref="segment3"
				class="segment"
				d="M84.1,22.2l5-8.7,2.7-4.6L86.8.2V0H60.1l5,8.7,5,8.7,2.8,4.8H84.1"
				fill="currentColor"
			></path>
		</g>
	</svg>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useWebAnimations } from "@seventv/util-vue/modules/animation";

const props = defineProps<{
	animation?: keyof typeof animations;
	color?: "brand" | "primary";
}>();

const segment1 = ref<SVGPathElement>();
const segment2 = ref<SVGPathElement>();
const segment3 = ref<SVGPathElement>();

// Animation Constants
const THROB_DURATION = 850;
const THROB_PAUSE = 400;
const THROB_SEGMENT_DELAY = 100;
const THROB_DISTANCE = 7;
const THROB_SCALE = 1.05;
const THROB_EASING = "cubic-bezier(0.8, 0, 0.2, 1)";
const THROB_TOTAL = THROB_DURATION + THROB_PAUSE;
const THROB_LAST = 1 - THROB_PAUSE / THROB_TOTAL;

const animations = reactive({
	throbber: [
		{
			element: segment1,
			keyframes: [
				{ transform: "translate(0px, 0px) scale(1)", easing: THROB_EASING },
				{
					transform: `translate(${THROB_DISTANCE * -0.5}px, ${
						THROB_DISTANCE * 0.866
					}px) scale(${THROB_SCALE})`,
					easing: THROB_EASING,
				},
				{ transform: "translate(0px, 0px) scale(1)", offset: THROB_LAST },
			],
			options: {
				duration: THROB_TOTAL,
				iterations: Infinity,
			},
		},
		{
			element: segment2,
			keyframes: [
				{ transform: "translate(0px, 0px) scale(1)", easing: THROB_EASING },
				{
					transform: `translate(${THROB_DISTANCE * 0.5}px, ${
						THROB_DISTANCE * 0.866
					}px) scale(${THROB_SCALE})`,
					easing: THROB_EASING,
				},
				{ transform: "translate(0px, 0px) scale(1)", offset: THROB_LAST },
			],
			options: {
				delay: THROB_SEGMENT_DELAY * 2,
				duration: THROB_TOTAL,
				iterations: Infinity,
			},
		},
		{
			element: segment3,
			keyframes: [
				{ transform: "translate(0px, 0px) scale(1)", easing: THROB_EASING },
				{
					transform: `translate(${THROB_DISTANCE * -0.5}px, ${
						THROB_DISTANCE * -0.866
					}px) scale(${THROB_SCALE})`,
					easing: THROB_EASING,
				},
				{ transform: "translate(0px, 0px) scale(1)", offset: THROB_LAST },
			],
			options: {
				delay: THROB_SEGMENT_DELAY,
				duration: THROB_TOTAL,
				iterations: Infinity,
			},
		},
	],
});

const animator = useWebAnimations(animations);

watch(
	() => props.animation,
	(animation) => {
		animator.playNext(animation);
	},
	{ immediate: true },
);
</script>

<style scoped lang="scss">
.seventv-logo {
	overflow: visible;

	.segment {
		transform-origin: center;
		transform-box: fill-box;
	}

	&[color="brand"] {
		color: var(--seventv-color-brand-7tv, var(--seventv-color-primary));
	}

	&[color="primary"] {
		color: var(--seventv-color-primary);
	}
}
</style>
