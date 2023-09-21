<template>
	<div :is-disabled="disabled" class="text-input">
		<slot name="left"></slot>
		<input
			ref="input"
			:placeholder="placeholder"
			:value="modelValue"
			:type="type"
			:pattern="pattern"
			:min="min"
			:max="max"
			:step="step"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			autocomplete="off"
			@input="onInput"
		/>
		<slot name="right"></slot>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const input = ref<HTMLInputElement | undefined>();

withDefaults(
	defineProps<{
		modelValue?: string;
		type?: "text" | "password" | "email" | "number" | "url";
		placeholder?: string;
		pattern?: string;
		required?: boolean;
		disabled?: boolean;
		min?: number;
		max?: number;
		step?: number;
		readonly?: boolean;
	}>(),
	{
		type: "text",
	},
);

const emit = defineEmits<{
	(event: "update:modelValue", value: string): void;
}>();

const onInput = (e: Event) => {
	const target = e.target as HTMLInputElement;
	emit("update:modelValue", target.value);
};

function getSelection() {
	if (!input.value) return [null, null];

	return [input.value.selectionStart, input.value.selectionEnd];
}

function setSelection(start: number, end: number) {
	if (!input.value) return;

	input.value.setSelectionRange(start, end);
}

function focus() {
	if (!input.value) return;

	input.value.focus();
}

defineExpose({
	getSelection,
	setSelection,
	focus,
});
</script>

<style scoped lang="scss">
.text-input {
	$padding: 0.75rem;

	display: flex;
	align-items: center;
	padding: 0 $padding;
	box-sizing: border-box;
	border-radius: var(--theme-chip-radius);
	background: var(--theme-background-base);

	&:hover {
		outline: 2px var(--theme-background-button-hover) solid;
	}

	&:focus-within {
		outline: 2px var(--theme-primary) solid;
	}

	&:invalid {
		outline: 2px var(--theme-warning) solid;
	}

	input {
		flex: 1 1 auto;
		width: 0;
		color: var(--theme-text-base);
		padding: $padding 0;
		background: none;
		outline: none;
		border: none;
	}

	&[is-disabled="true"] {
		user-select: none;
		pointer-events: none;
		outline: none;
		opacity: 0.25;
	}
}
</style>
