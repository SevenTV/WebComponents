import type { RouteLocationNormalizedLoaded } from "vue-router";

export function getUniqueRouteKey(route: RouteLocationNormalizedLoaded) {
	if (route.meta.dependsOn instanceof Array) {
		const deps = route.meta.dependsOn;

		const parts = [];

		for (const [param, value] of Object.entries(route.params)) {
			if (deps.includes(param)) {
				let string = `${param}`;

				if (value instanceof Array) {
					string += `:${value.join(":")}`;
				} else {
					string += `:${value}`;
				}

				parts.push(string);
			}
		}

		return parts.join("-");
	}

	return undefined;
}

export default getUniqueRouteKey;
