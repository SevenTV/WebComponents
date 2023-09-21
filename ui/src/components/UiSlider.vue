<template>
	<input
		ref="slider"
		class="range-slider"
		type="range"
		:value="modelValue"
		:min="min"
		:max="max"
		:step="step"
		autocomplete="off"
		@input="onInput"
	/>
</template>

<script setup lang="ts">
import { ref } from "vue";

const slider = ref<HTMLInputElement | undefined>();

withDefaults(
	defineProps<{
		modelValue?: number;
		min?: number;
		max?: number;
		step?: number;
	}>(),
	{
		min: 0,
		max: 10,
	},
);

const emit = defineEmits<{
	(event: "update:modelValue", value: number): void;
}>();

function onInput(ev: Event) {
	const el = slider.value;

	if (ev.target !== el) return;

	emit("update:modelValue", el.valueAsNumber);
}
</script>

<style scoped lang="scss">
@mixin thumb($height, $track-height) {
	$offset: calc($height / 2 - $track-height / 2);

	appearance: none;
	height: $height;
	width: $height;
	margin-top: -$offset;
	background: currentColor;
	border-radius: 50%;
	border: none;
	outline: none;
}

@mixin track($height, $track-height) {
	width: 100%;
	height: $track-height;
	background-color: currentColor;
	border-radius: var(--theme-chip-radius);
	outline: none;
}

.range-slider {
	$height: 1rem;
	$track-height: 0.2rem;

	height: $height;
	background: transparent;
	appearance: none;
	cursor: pointer;
	color: currentColor;

	&::-webkit-slider-thumb {
		@include thumb($height, $track-height);
	}

	&::-webkit-slider-runnable-track {
		@include track($height, $track-height);
	}

	&::-moz-range-thumb {
		@include thumb($height, $track-height);
	}

	&::-moz-range-track {
		@include track($height, $track-height);
	}
}
</style>
