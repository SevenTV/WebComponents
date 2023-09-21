import { type EffectScope, effectScope, onScopeDispose } from "vue";

type ResultDefault<I, T, F extends unknown[]> = undefined extends I
	? {
			(key?: I, createIfUnset?: true | undefined, ...args: F): T;
			(key: I, createIfUnset: false): T | undefined;
	  }
	: {
			(key: I, createIfUnset?: true | undefined, ...args: F): T;
			(key: I, createIfUnset: false): T | undefined;
	  };

type ResultNoDefault<I, T, F extends unknown[]> = undefined extends I
	? {
			(key?: I, createIfUnset?: false | undefined): T | undefined;
			(key: I, createIfUnset: true, ...args: F): T;
	  }
	: {
			(key: I, createIfUnset?: false | undefined): T | undefined;
			(key: I, createIfUnset: true, ...args: F): T;
	  };

export function createMappedComposable<K, T, F extends unknown[], I = K>(
	factory: (key: K, ...args: F) => T,
	disposal?: (key: K, current: T) => void,
	processKey?: (input: I) => K,
	defaultCreateIfUnset?: true | undefined,
): ResultDefault<I, T, F>;
export function createMappedComposable<K, T, F extends unknown[], I = K>(
	factory: (key: K, ...args: F) => T,
	disposal: ((key: K, current: T) => void) | undefined,
	processKey: ((input: I) => K) | undefined,
	defaultCreateIfUnset: false,
): ResultNoDefault<I, T, F>;
export function createMappedComposable<K, T, F extends unknown[], I = K>(
	factory: (key: K, ...args: F) => T,
	disposal?: (key: K, current: T) => void,
	processKey?: (input: I) => K,
	defaultCreateIfUnset = true,
) {
	const map = new Map<K, [T, EffectScope, number]>();

	function free(key: K) {
		const current = map.get(key);
		if (current) {
			const [state, scope, users] = current;
			const newUsers = users - 1;

			if (newUsers < 1) {
				map.delete(key);
				scope.stop();
			} else {
				map.set(key, [state, scope, newUsers]);
			}
		}
	}

	function processor(input: unknown): K {
		return processKey ? processKey(<I>input) : <K>input;
	}

	return (key: I, createIfUnset = defaultCreateIfUnset, ...args: F) => {
		const itemKey = processor(key);
		const current = map.get(itemKey);

		if (current) {
			const [state, scope, users] = current;

			map.set(itemKey, [state, scope, users + 1]);
			onScopeDispose(() => free(itemKey));

			return state;
		} else if (createIfUnset) {
			const scope = effectScope(true);
			const state = scope.run(() => {
				const state = factory(itemKey, ...args);

				if (disposal) {
					onScopeDispose(() => disposal(itemKey, state));
				}

				return state;
			});

			if (state == undefined) {
				scope.stop();
				return;
			}

			map.set(itemKey, [state, scope, 1]);
			onScopeDispose(() => free(itemKey));

			return state;
		}
	};
}

export default createMappedComposable;
