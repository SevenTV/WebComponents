import { colorFromString } from "./rgb";
import type { Theme, ThemeColor } from "../types/themes";

export function basicTheme(input: BasicTheme): Theme {
	const colors = <Record<string, ThemeColor>>{};

	for (const [key, def] of Object.entries(input.colors)) {
		parseColorDefinition(colors, key, def);
	}

	return {
		...input,
		colors,
	};
}

function parseColorDefinition(
	map: Record<string, ThemeColor>,
	key: string,
	def: BasicThemeColorDefinition,
	parent?: string,
) {
	key = processColorPath(key);

	if (parent) {
		if (key == "&") key = parent;
		else key = `${parent}-${key}`;
	}

	if (typeof def == "string") {
		map[key] = colorFromString(def);
	} else if (isThemeColor(def)) {
		map[key] = def;
	} else {
		for (const [childKey, child] of Object.entries(def)) {
			parseColorDefinition(map, childKey, child, key);
		}
	}
}

function processColorPath(path: string) {
	const first = path.slice(0, 1).toLowerCase();
	const rest = path.slice(1).replace(/[A-Z1-9]/g, (str) => `-${str.toLowerCase()}`);

	return first + rest;
}

function isThemeColor(object: object): object is ThemeColor {
	const structure: Record<string, string> = { r: "number", g: "number", b: "number", a: "number" };

	for (const key of new Set([...Object.keys(structure), ...Object.keys(object)])) {
		if (structure[key] != typeof Reflect.get(object, key)) return false;
	}

	return true;
}

type BasicTheme = Modify<
	Theme,
	{
		colors: Record<string, BasicThemeColorDefinition>;
	}
>;

type ThemeColorShorthand = string;

type BasicThemeColor = ThemeColor | ThemeColorShorthand;

type BasicThemeColorDefinition =
	| BasicThemeColor
	| ({ [x: string]: BasicThemeColorDefinition } & { "&"?: BasicThemeColor });

type Modify<T, R> = Omit<T, keyof R> & R;
