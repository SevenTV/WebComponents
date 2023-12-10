import { basicTheme } from "../transformers/basic";

export const DarkTheme = basicTheme({
	colors: {
		text: "#FFFFFF",
		textDarker: "#9C9C9C",
		background: "#000000",
		backgroundLighter: "#0F0F0F",
		navBackground: "#0F0F0FCC",
		outline: "#313131",
		button: {
			"&": "#000",
			active: "#aaa",
			hover: "#a1a1a1",
		},
	},
});

export default DarkTheme;
