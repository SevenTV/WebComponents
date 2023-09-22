import { type Ref, computed, onScopeDispose, ref } from "vue";
import type { Theme } from "../types/themes";

export function mediaQueryTransformer(fallback: Theme, ...states: [string, Theme][]) {
	return () => {
		const queryStates: {
			query: MediaQueryList;
			callback: (ev: MediaQueryListEvent) => void;
			matches: Ref<boolean>;
			result: Theme;
		}[] = [];

		for (const state of states) {
			const query = window.matchMedia(state[0]);
			const matches = ref(query.matches);
			const callback = (ev: MediaQueryListEvent) => {
				matches.value = ev.matches;
			};

			query.addEventListener("change", callback);

			queryStates.push({
				query,
				matches,
				callback,
				result: state[1],
			});
		}

		onScopeDispose(() => {
			for (const state of queryStates) {
				state.query.removeEventListener("change", state.callback);
			}
		});

		return computed(() => {
			for (const state of queryStates) {
				if (state.matches.value) {
					return state.result;
				}
			}

			return fallback;
		});
	};
}

export default mediaQueryTransformer;
