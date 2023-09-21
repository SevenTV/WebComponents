import { type InjectionKey, inject, onScopeDispose, provide } from "vue";

type ResultDefault<T, F extends unknown[]> = {
	(createIfUnprovided?: true | undefined, ...args: F): T;
	(createIfUnprovided: false): T | undefined;
};

type ResultNoDefault<T, F extends unknown[]> = {
	(createIfUnprovided?: false | undefined): T | undefined;
	(createIfUnprovided: true, ...args: F): T;
};

export function createInjectionComposable<T, F extends unknown[]>(
	key: InjectionKey<T> | null | undefined,
	factory: (...args: F) => T,
	disposal?: (current: T) => void,
	defaultCreateIfUnprovided?: true | undefined,
): ResultDefault<T, F>;
export function createInjectionComposable<T, F extends unknown[]>(
	key: InjectionKey<T> | null | undefined,
	factory: (...args: F) => T,
	disposal: ((current: T) => void) | undefined,
	defaultCreateIfUnprovided: false,
): ResultNoDefault<T, F>;
export function createInjectionComposable<T, F extends unknown[]>(
	key: InjectionKey<T> | null | undefined,
	factory: (...args: F) => T,
	disposal?: (current: T) => void,
	defaultCreateIfUnprovided = true,
) {
	const symbol = key ?? Symbol();

	return (createIfUnprovided = defaultCreateIfUnprovided, ...args: F) => {
		const currentState = inject(symbol, undefined);

		if (currentState) {
			return currentState;
		} else if (createIfUnprovided) {
			const newState = factory(...args);

			if (disposal) {
				onScopeDispose(() => {
					disposal(newState);
				});
			}

			provide(symbol, newState);

			return newState;
		}
	};
}

export default createInjectionComposable;
