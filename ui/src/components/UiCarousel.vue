<template>
	<div class="card-carousel" tabindex="-1" @keydown="onKey">
		<div v-if="showControls" class="carousel-controls">
			<button class="button" :disabled="atStart" @click="travelPrevious()">
				<ChevronIcon direction="left" />
			</button>
		</div>
		<div class="card-box">
			<TransitionGroup :name="`carousel-${transitionDirection}`">
				<template v-for="(slot, i) of Object.keys($slots)" :key="`host-${slot}`">
					<div v-if="index == i" class="card-container">
						<slot :name="slot"></slot>
					</div>
				</template>
			</TransitionGroup>
		</div>
		<div v-if="showControls" class="carousel-controls">
			<button class="button" :disabled="atEnd" @click="travelNext()">
				<ChevronIcon direction="right" />
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from "vue";
import ChevronIcon from "../assets/icons/third-party/ChevronIcon.vue";

const index = ref(0);
const count = computed(() => Object.keys(useSlots()).length);

const transitionDirection = ref<"left" | "right">("left");

const atStart = computed(() => index.value < 1);
const atEnd = computed(() => index.value + 2 > count.value);

const showControls = computed(() => count.value > 1);

function travelNext() {
	if (!atEnd.value) {
		transitionDirection.value = "right";
		index.value++;
	}
}

function travelPrevious() {
	if (!atStart.value) {
		transitionDirection.value = "left";
		index.value--;
	}
}

function onKey(event: KeyboardEvent) {
	switch (event.key) {
		case "ArrowLeft":
			travelPrevious();
			break;
		case "ArrowRight":
			travelNext();
			break;
	}
}
</script>

<style scoped lang="scss">
.card-carousel {
	width: 100%;
	height: 100%;
	min-height: 20rem;
	display: flex;

	.card-box {
		flex-grow: 1;
		position: relative;

		.card-container {
			position: absolute;
			inset: 0;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.carousel-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
	}

	.button {
		font-size: 1.75rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 9999rem;
		transition: background-color 150ms linear;
		background-color: transparent;
		outline: none;
		border: none;
		color: var(--seventv-color-text);

		&:disabled {
			color: var(--seventv-color-text-muted);
		}

		&:hover:not(:disabled) {
			background-color: rgba(255, 255, 255, 20%);
		}
	}

	.carousel-left-enter-active,
	.carousel-left-leave-active,
	.carousel-right-enter-active,
	.carousel-right-leave-active {
		transition: all 0.5s ease;
	}

	.carousel-right-enter-from,
	.carousel-left-leave-to {
		opacity: 0;
		transform: translateX(80px) scale(0.8);
	}

	.carousel-left-enter-from,
	.carousel-right-leave-to {
		opacity: 0;
		transform: translateX(-80px) scale(0.8);
	}
}
</style>
