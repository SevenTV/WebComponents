import type { RouteLocationNormalizedLoaded } from "vue-router";

export function getUniqueRouteKey(route: RouteLocationNormalizedLoaded) {
	const deps = route.meta.dependsOn;
	if (deps instanceof Array) {
		const parts = [];

		for (const param of deps) {
			let string = `${param}`;

			const value = route.params[param];
			if (value instanceof Array) {
				string += `:${value.join(":")}`;
			} else if (value) {
				string += `:${value}`;
			}

			parts.push(string);
		}

		return parts.join("-");
	}

	return undefined;
}

export default getUniqueRouteKey;
