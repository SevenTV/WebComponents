import { type Component, defineComponent, h } from "vue";

interface ComponentConstructor {
	new (): Component;
}

export function defineAsyncPage(moduleResolver: () => Promise<{ default: ComponentConstructor }>) {
	const name = `AsyncPage-${Math.random().toString(36).substring(2)}`;

	return defineComponent({
		displayName: name,
		async setup() {
			const module = await moduleResolver();

			const component = module.default;

			return () => h(component);
		},
	});
}

export default defineAsyncPage;
