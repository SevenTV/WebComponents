import { EffectScope, effectScope, watch } from "vue";
import { ThemeCSSBackend } from "./backend/css";
import { ThemeLocalStorageProvider } from "./storage/localstorage";
import AutoTheme from "./themes/auto";
import BaseTheme from "./themes/base";
import DarkTheme from "./themes/dark";
import LightTheme from "./themes/light";
import type { Theme, ThemeColor, ThemeDefinition, ThemeStorageProvider } from "./types/themes";
import { ReactiveClass } from "@seventv/util-vue/modules/reactivity";

export class ThemeManager extends ReactiveClass<typeof ThemeManager.reactiveFields> {
	private static reactiveFields = {
		disposed: ["readonly"],
		ready: ["readonly"],
		themes: ["readonly"],
		active: ["readonly"],
		activeId: ["readonly"],
		lastUpdateTime: ["readonly"],
		lastSaveTime: ["readonly"],
	} as const;

	public readonly id: string;
	public readonly prefix: string;
	public readonly disposed: boolean;
	public readonly ready: boolean;

	public readonly css: ThemeCSSBackend;
	private storageProvider?: ThemeStorageProvider;

	public readonly defaultTheme: string | null;
	public readonly themes: Map<string, ThemeDefinition>;

	public readonly base: Theme;

	private activeScope?: EffectScope;
	public readonly active?: Theme;
	public readonly activeId?: string;
	public readonly lastUpdateTime: number = 0;
	public readonly lastSaveTime: number = 0;

	constructor(init: ThemeManagerConfig = {}) {
		super();

		this.id = Math.random().toString(16).slice(2, 10);
		this.prefix = init.prefix ?? "seventv";
		this.disposed = false;
		this.ready = false;

		if (init.storage?.type == "custom") {
			this.storageProvider = init.storage.provider;
		} else if (init.storage?.type == "localstorage") {
			this.storageProvider = new ThemeLocalStorageProvider(init.storage.key ?? `${this.prefix}-theme`);
		}

		this.defaultTheme = init.defaultTheme !== undefined ? init.defaultTheme : "dark";
		this.themes = new Map();

		this.base = init.baseTheme ?? BaseTheme;

		this.exposeState(ThemeManager.reactiveFields);

		this.css = new ThemeCSSBackend(this);

		this.addThemes(
			init.themes ?? {
				auto: AutoTheme,
				light: LightTheme,
				dark: DarkTheme,
			},
		);

		if (init.loadOnInit ?? true) this.loadTheme();
	}

	dispose() {
		if (this.stateRaw.disposed) return false;

		this.unloadTheme();

		this.state.disposed = true;
		return true;
	}

	// State management
	setTheme(id: string | null, save = true) {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		const now = Date.now();
		this.state.lastUpdateTime = now;
		if (save) this.saveStorage(id, now);

		this.unloadTheme();

		let themeDef: ThemeDefinition | undefined;
		if (id && this.stateRaw.themes.has(id)) {
			themeDef = this.stateRaw.themes.get(id);
		} else if (this.defaultTheme) {
			id = this.defaultTheme;
			themeDef = this.stateRaw.themes.get(this.defaultTheme);
		}

		if (id && themeDef) {
			this.state.activeId = id;

			if (typeof themeDef == "function") {
				const composable = themeDef;

				this.activeScope = effectScope(true);
				this.activeScope.run(() => {
					watch(
						composable(),
						(theme) => {
							this.state.active = theme;
						},
						{ immediate: true },
					);
				});
			} else {
				this.state.active = themeDef;
			}
		}

		if (!this.stateRaw.ready) this.state.ready = true;
	}

	unloadTheme() {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		if (this.activeScope) this.activeScope.stop();
		this.activeScope = undefined;
		this.state.active = undefined;
		this.state.activeId = undefined;
	}

	// Storage / Initialization
	async loadTheme() {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		const loadedFromStorage = await this.loadStorage();
		if (!loadedFromStorage) {
			this.setTheme(null, false);
		}
	}

	async loadStorage() {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		if (!this.storageProvider) return false;

		const result = await this.storageProvider.load();
		if (result) {
			this.setTheme(result.value, false);
			this.state.lastSaveTime = result.time;

			return true;
		} else {
			this.state.lastSaveTime = 0;

			return false;
		}
	}

	async saveStorage(id: string | null, time: number) {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		if (!this.storageProvider) return false;

		const result = await this.storageProvider.save(id, time);
		if (result) {
			this.state.lastSaveTime = time;

			return true;
		}

		return false;
	}

	// Definition management
	addTheme(id: string, theme: ThemeDefinition) {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		if (this.stateRaw.themes.has(id)) return false;

		this.state.themes.set(id, theme);
		return true;
	}

	addThemes(themes: Record<string, ThemeDefinition>) {
		for (const [id, theme] of Object.entries(themes)) this.addTheme(id, theme);
	}

	removeTheme(id: string) {
		if (this.stateRaw.disposed) throw new ThemeManagerAlreadyDisposedError();

		if (!this.stateRaw.themes.has(id)) return false;

		this.state.themes.delete(id);

		if (this.stateRaw.activeId == id) {
			this.setTheme(null, false);
		}

		return true;
	}

	// Helpers
	getColor(key: string): ThemeColor | undefined {
		return this.active?.colors[key] ?? this.base.colors[key];
	}
}

export interface ThemeManagerConfig {
	prefix?: string;
	storage?: ThemeManagerConfigStorage;
	defaultTheme?: string | null;
	baseTheme?: Theme;
	themes?: Record<string, ThemeDefinition>;
	loadOnInit?: boolean;
}

export interface ThemeManagerConfigStorageBase {
	type: string;
}

export interface ThemeManagerConfigStorageNone extends ThemeManagerConfigStorageBase {
	type: "none";
}

export interface ThemeManagerConfigStorageLocal extends ThemeManagerConfigStorageBase {
	type: "localstorage";
	key?: string;
}

export interface ThemeManagerConfigStorageCustom extends ThemeManagerConfigStorageBase {
	type: "custom";
	provider: ThemeStorageProvider;
}

export type ThemeManagerConfigStorage =
	| ThemeManagerConfigStorageNone
	| ThemeManagerConfigStorageLocal
	| ThemeManagerConfigStorageCustom;

export class ThemeManagerError extends Error {
	constructor(readableReason: string) {
		super(`ThemeManager: ${readableReason}`);
	}
}

export class ThemeManagerAlreadyDisposedError extends ThemeManagerError {
	constructor() {
		super("Tried to access after disposal");
	}
}

export default ThemeManager;
