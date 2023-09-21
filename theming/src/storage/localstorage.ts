import type { ThemeStorageProvider } from "src";

export class ThemeLocalStorageProvider implements ThemeStorageProvider {
	public readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	async load() {
		const raw = window.localStorage.getItem(this.key);
		if (!raw) return undefined;

		const reMatch = raw.match(/(\d+),(.*)/);
		if (!reMatch) return undefined;

		const time = parseInt(reMatch[1]);
		const value = reMatch[2];
		if (isNaN(time) || !value) return undefined;

		return {
			time,
			value,
		};
	}

	async save(value: string | null, time: number) {
		if (value) {
			const raw = `${time.toString()},${value}`;
			window.localStorage.setItem(this.key, raw);
		} else {
			window.localStorage.removeItem(this.key);
		}

		return true;
	}
}
