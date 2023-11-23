import type { Ref } from "vue";

export interface Theme {
	colors: Record<string, ThemeColor>;
	cssVars?: Record<string, string>;
	cssStyles?: string;
}

export interface ThemeColor {
	r: number;
	g: number;
	b: number;
	a: number;
}

export interface ThemeStorageProvider {
	save: (value: string | null, time: number) => Promise<boolean>;
	load: () => Promise<{ value: string; time: number } | undefined>;
}

export type ComposedTheme = () => Ref<Theme>;

export type ThemeDefinition = Theme | ComposedTheme;
