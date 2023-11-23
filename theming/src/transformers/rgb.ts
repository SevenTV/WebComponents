import type { ThemeColor } from "../types/themes";

export function colorRGB(r: number, g: number, b: number): ThemeColor {
	return colorRGBA(r, g, b, 255);
}

export function colorRGBA(r: number, g: number, b: number, a: number): ThemeColor {
	return {
		r,
		g,
		b,
		a,
	};
}

export function colorFromString(color: string): ThemeColor {
	try {
		return colorFromHex(color);
	} catch {
		void 0;
	}

	try {
		return colorFromHexShort(color);
	} catch {
		void 0;
	}

	throw new SyntaxError();
}

export function colorFromHex(hex: string): ThemeColor {
	const match = hex.match(/^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})?$/);
	if (!match) throw new SyntaxError();

	const r = parseInt(match[1], 16);
	const g = parseInt(match[2], 16);
	const b = parseInt(match[3], 16);
	const a = parseInt(match[4], 16);

	if (isNaN(r) || isNaN(g) || isNaN(b)) {
		throw new SyntaxError();
	}

	if (isNaN(a)) {
		return colorRGB(r, g, b);
	} else {
		return colorRGBA(r, g, b, a);
	}
}

export function colorFromHexShort(hex: string): ThemeColor {
	const match = hex.match(/^#?([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])?$/);
	if (!match) throw new SyntaxError();

	const r = parseInt(`${match[1]}${match[1]}`, 16);
	const g = parseInt(`${match[2]}${match[2]}`, 16);
	const b = parseInt(`${match[3]}${match[3]}`, 16);
	const a = parseInt(`${match[4]}${match[4]}`, 16);

	if (isNaN(r) || isNaN(g) || isNaN(b)) {
		throw new SyntaxError();
	}

	if (isNaN(a)) {
		return colorRGB(r, g, b);
	} else {
		return colorRGBA(r, g, b, a);
	}
}
