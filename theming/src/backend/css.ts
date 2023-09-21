import { type Directive, type EffectScope, effectScope, reactive, ref, watch } from "vue";
import { type ThemeManager } from "../manager";
import type { Theme } from "../types/themes";

export class ThemeCSSBackend {
	public readonly manager: ThemeManager;

	private scope: EffectScope;
	private disposed: boolean;

	public readonly rootAttribute: string;
	public readonly vThemeRoot: Directive<HTMLElement>;

	public readonly baseStylesheet: OwnedStyleSheet;
	public readonly themeStylesheet: OwnedStyleSheet;

	constructor(manager: ThemeManager) {
		this.manager = manager;

		this.scope = effectScope(true);
		this.disposed = false;

		this.rootAttribute = `${manager.prefix}-root-${manager.id}`;
		this.vThemeRoot = (el) => el.setAttribute(this.rootAttribute, "");

		this.baseStylesheet = this.createOwnedStyleSheet(`${manager.prefix}-${manager.id}-base`);
		this.themeStylesheet = this.createOwnedStyleSheet(`${manager.prefix}-${manager.id}-theme`);

		this.scope.run(() => {
			watch(
				() => [manager.base, this.baseStylesheet.sheet] as const,
				([baseTheme, sheet]) => {
					if (sheet) this.updateStylesheet(sheet, baseTheme);
				},
				{ deep: true, immediate: true },
			);

			watch(
				() => [manager.active, this.themeStylesheet.sheet] as const,
				([active, sheet]) => {
					if (sheet) this.updateStylesheet(sheet, active ?? null);
				},
				{ deep: true, immediate: true },
			);
		});
	}

	dispose() {
		if (this.disposed) return false;

		this.scope.stop();
		this.baseStylesheet.dispose();
		this.themeStylesheet.dispose();

		return true;
	}

	createOwnedStyleSheet(id?: string, append = true): OwnedStyleSheet {
		const element = document.createElement("link");
		if (id) element.id = id;
		element.rel = "stylesheet";
		element.href = "data:text/css,";
		element.type = "text/css";

		if (append) document.head.appendChild(element);

		const sheet = ref(element.sheet);
		const onLoad = () => {
			sheet.value = element.sheet;
		};

		element.addEventListener("load", onLoad);

		return reactive({
			ownerNode: element,
			sheet,
			dispose: () => {
				element.removeEventListener("load", onLoad);
				element.remove();
			},
		});
	}

	insertStyleSheetRule(sheet: CSSStyleSheet, rule: string, index?: number): CSSRule {
		return sheet.cssRules[sheet.insertRule(rule, index ?? sheet.cssRules.length)];
	}

	clearStyleSheet(sheet: CSSStyleSheet) {
		try {
			for (let x = 0; x < sheet.cssRules.length; x++) {
				sheet.deleteRule(x);
			}
		} catch (e) {
			return false;
		}

		return true;
	}

	updateStylesheet(sheet: CSSStyleSheet, theme: Theme | null) {
		if (this.disposed) throw new ThemeCSSBackendAlreadyDisposedError();

		this.clearStyleSheet(sheet);

		if (!theme) return true;

		try {
			const parser = new CSSStyleSheet({ disabled: true });
			parser.replaceSync(theme.cssStyles ?? "");

			const variableRule = <CSSStyleRule>this.insertStyleSheetRule(parser, ":root {}");

			for (const [color, value] of Object.entries(theme.colors)) {
				const str = `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a / 255})`;
				variableRule.style.setProperty(`--theme-color-${color}`, str);
			}

			if (theme.cssVars) {
				for (const [variable, value] of Object.entries(theme.cssVars)) {
					variableRule.style.setProperty(`--theme-${variable}`, value);
				}
			}

			for (const rule of parser.cssRules) {
				this.attributizeRule(rule);

				this.insertStyleSheetRule(sheet, rule.cssText);
			}

			// Constructed stylesheet parser wont parse @import statements, we'll pass these through verbatim
			if (theme.cssStyles) {
				for (const rule of theme.cssStyles.matchAll(/@import .*;/g)) {
					this.insertStyleSheetRule(sheet, rule[0], 0);
				}
			}
		} catch (e) {
			this.clearStyleSheet(sheet);

			return false;
		}

		return true;
	}

	attributizeRule(rule: CSSRule) {
		if (rule instanceof CSSStyleRule) {
			const newSelectors: string[] = [];
			const selectors = rule.selectorText.split(",");

			for (const selector of selectors) {
				const trimmed = selector.trim();

				if (trimmed.startsWith("#--theme-global ")) {
					newSelectors.push(trimmed.replace("#--theme-global ", ""));
					continue;
				}

				if (trimmed == ":root") {
					newSelectors.push(`[${this.rootAttribute}]`);
					continue;
				}

				newSelectors.push(`[${this.rootAttribute}] ${trimmed}`);
			}

			rule.selectorText = newSelectors.join(", ");
		}

		if (rule instanceof CSSKeyframesRule) {
			rule.name = rule.name.replace(/--theme-/g, `--${this.manager.prefix}-`);
		}

		if ("style" in rule) {
			const declaration = rule.style as CSSStyleDeclaration;
			for (const field of Array.from(declaration)) {
				const value = declaration.getPropertyValue(field);
				const priority = declaration.getPropertyPriority(field);

				const newField = field.replace(/--theme-/g, `--${this.manager.prefix}-`);
				const newValue = value.replace(/--theme-/g, `--${this.manager.prefix}-`);

				if (field != newField) declaration.removeProperty(field);
				declaration.setProperty(newField, newValue, priority);
			}
		}

		if ("cssRules" in rule) {
			const children = rule.cssRules as CSSRuleList;
			for (const child of children) {
				this.attributizeRule(child);
			}
		}
	}
}

export interface OwnedStyleSheet {
	ownerNode: HTMLLinkElement;
	sheet: CSSStyleSheet | null;
	dispose(): void;
}

export class ThemeCSSBackendError extends Error {
	constructor(readableReason: string) {
		super(`ThemeManagerCSSBackend: ${readableReason}`);
	}
}

export class ThemeCSSBackendAlreadyDisposedError extends ThemeCSSBackendError {
	constructor() {
		super("Tried to access after disposal");
	}
}
