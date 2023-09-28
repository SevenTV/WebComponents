<template>
	<RouterView v-slot="{ Component, route }">
		<Suspense @pending="resolved = false" @resolve="resolved = true">
			<component :is="Component" v-if="Component" :key="getUniqueRouteKey(route)" />
		</Suspense>
	</RouterView>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterView } from "vue-router";
import getUniqueRouteKey from "./getUniqueRouteKey";

const emit = defineEmits<{
	(event: "pending"): void;
	(event: "resolve"): void;
}>();

const resolved = ref(false);

watch(resolved, (resolved) => {
	if (resolved) emit("resolve");
	else emit("pending");
});

defineExpose({
	resolved,
});
</script>
