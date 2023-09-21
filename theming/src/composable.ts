import { type InjectionKey } from "vue";
import ThemeManager, { type ThemeManagerConfig } from "./manager";
import { createInjectionComposable } from "@seventv/util-vue/modules/composable";

export const THEME_STORE_COMPOSABLE_KEY: InjectionKey<ThemeManager> = Symbol("composable.themeManager");

export const useThemeManager = createInjectionComposable(
	THEME_STORE_COMPOSABLE_KEY,
	(init?: ThemeManagerConfig) => new ThemeManager(init),
	(current) => current.dispose(),
	false,
);
