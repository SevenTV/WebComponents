import BaseStylesheet from "./base.scss?inline";
import { basicTheme } from "../transformers/basic";

export const BaseTheme = basicTheme({
	colors: {
		primary: "#29B6F6",
		brand: {
			"7tv": "#29B6F6",
			subscription: "#DCAA32",
		},
	},
	cssStyles: BaseStylesheet,
});

export default BaseTheme;
