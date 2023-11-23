import HydratedObject, { HydratedObjectCloningContext } from "./HydratedObject";
import type { HydratedObjectConstructor, HydratorSchema, HydratorSchemaFull, HydratorValue } from "../types/hydrator";
import { isPrototypeOf } from "@seventv/util/modules/prototype";

export function hydrateValue<S extends HydratorSchema>(
	input: unknown,
	schema: S,
	throwPath?: string,
	ancestors?: unknown[],
): HydratorValue<S> {
	const resolved = resolveHydratorSchema(schema, input, ancestors);

	try {
		const type = resolved.type;
		switch (typeof type) {
			case "string": {
				switch (type) {
					case "object": {
						if (typeof input !== "object" || !input) throw void 0;

						const hydrated = {};
						const newAncestors = ancestors ? [input, ...ancestors] : [input];

						if ("schema" in resolved) {
							for (const [prop, schema] of Object.entries(resolved.schema)) {
								const isOwn = Object.prototype.hasOwnProperty.call(input, prop);
								const raw = isOwn ? Reflect.get(input, prop) : undefined;

								Reflect.set(hydrated, prop, hydrateValue(raw, schema, prop, newAncestors));
							}
						} else if ("children" in resolved) {
							for (const prop of Reflect.ownKeys(input)) {
								const raw = Reflect.get(input, prop);

								Reflect.set(
									hydrated,
									prop,
									hydrateValue(raw, resolved.children, prop.toString(), newAncestors),
								);
							}
						} else {
							throw void 0;
						}

						return <HydratorValue<S>>hydrated;
					}

					case "array": {
						if (input instanceof Array) {
							const hydrated: unknown[] = [];
							const newAncestors = ancestors ? [input, ...ancestors] : [input];

							for (let x = 0; x < input.length; x++) {
								try {
									hydrated.push(hydrateValue(input[x], resolved.children, `[${x}]`, newAncestors));
								} catch (err) {
									if (resolved.skipInvalid) continue;
									throw err;
								}
							}

							return <HydratorValue<S>>hydrated;
						}

						throw void 0;
					}

					case "never": {
						throw void 0;
					}

					case "null": {
						if (input === null) return <HydratorValue<S>>input;
						throw void 0;
					}

					default: {
						if (typeof input === type) return <HydratorValue<S>>input;
						throw void 0;
					}
				}
			}

			case "function": {
				if (isPrototypeOf<HydratedObjectConstructor>(HydratedObject, type)) {
					if (typeof input !== "object" || !input) throw void 0;

					return <HydratorValue<S>>new type(input);
				}

				throw void 0;
			}
		}
	} catch (err) {
		if (resolved.required === false) {
			if (resolved.default !== undefined) return <HydratorValue<S>>resolved.default;
			return <HydratorValue<S>>undefined;
		}

		if (err instanceof HydrationError) {
			if (throwPath) {
				if (err.throwPath) err.throwPath = `${throwPath}.${err.throwPath}`;
				else err.throwPath = throwPath;
			}

			throw err;
		} else {
			throw new HydrationError(throwPath, err);
		}
	}
}

export function resolveHydratorSchema(
	schema: HydratorSchema,
	current: unknown,
	ancestors?: unknown[],
): HydratorSchemaFull {
	if (typeof schema == "function" && !isPrototypeOf<HydratedObjectConstructor>(HydratedObject, schema)) {
		schema = schema(current, ancestors ?? []);
	}

	if (typeof schema === "string" || typeof schema === "function") {
		return { type: schema };
	}

	return schema;
}

export class HydrationError extends Error {
	constructor(
		public throwPath?: string,
		public subError?: unknown,
	) {
		super();
		this.name = "Hydration Error";
	}

	get message() {
		let msg = "Failed to parse required property";
		if (this.throwPath) msg += ` at path '${this.throwPath}'`;
		if (this.subError instanceof Error) msg += ": " + this.subError.message;

		return msg;
	}
}

export function cloneValue<V extends HydratorValue>(value: V, seen?: WeakMap<object, object>): V {
	// Primitives always share identity
	if (typeof value !== "object" || value === null) return value;

	// Clones of objects that share identity, will share identity
	seen = seen ?? new WeakMap();
	if (seen.has(value)) return <V>seen.get(value);

	if (value instanceof HydratedObject) {
		const cls = <HydratedObjectConstructor>value.constructor;
		const context = new HydratedObjectCloningContext(value, seen);

		return <V>new cls(context);
	}

	if (value instanceof Array) {
		const cloned: HydratorValue[] = [];
		seen.set(value, cloned);

		for (let x = 0; x < value.length; x++) {
			cloned[x] = cloneValue(value[x], seen);
		}

		return <V>cloned;
	} else {
		const cloned: Record<PropertyKey, HydratorValue> = {};
		seen.set(value, cloned);

		for (const prop of Reflect.ownKeys(value)) {
			const raw = <HydratorValue>Reflect.get(value, prop);

			Reflect.set(cloned, prop, cloneValue(raw, seen));
		}

		return <V>cloned;
	}
}
