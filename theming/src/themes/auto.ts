import DarkTheme from "./dark";
import LightTheme from "./light";
import mediaQueryTransformer from "../transformers/media-query";

export const AutoTheme = mediaQueryTransformer(LightTheme, ["(prefers-color-scheme: dark)", DarkTheme]);

export default AutoTheme;
