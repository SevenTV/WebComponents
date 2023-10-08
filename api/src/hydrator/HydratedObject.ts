import { cloneValue, hydrateValue } from "./hydration";
import type { HydratorSchema, HydratorValue } from "../types/hydrator";
import type { DefiniteKey } from "@seventv/util/modules/types";

type BaseHydratedObjectConstructor = typeof BaseHydratedObject;
export class BaseHydratedObject {
	static SCHEMA: HydratedObjectSchema = {};

	constructor(input: object | BaseHydratedObject | HydratedObjectCloningContext) {
		const cls = <BaseHydratedObjectConstructor>this.constructor;

		if (input instanceof HydratedObjectCloningContext) {
			cls.fromClone(this, input.source, input.seen);
		} else if (input instanceof cls) {
			cls.fromClone(this, input, new WeakMap());
		} else {
			cls.fromJSON(this, input);
		}
	}

	protected static fromJSON(instance: BaseHydratedObject, json: object) {
		const cls = <BaseHydratedObjectConstructor>instance.constructor;

		for (const [prop, schema] of Object.entries(cls.SCHEMA)) {
			const isOwn = Object.prototype.hasOwnProperty.call(json, prop);
			const raw = isOwn ? Reflect.get(json, prop) : undefined;

			Reflect.set(instance, prop, hydrateValue(raw, schema, prop, [json]));
		}
	}

	protected static fromClone(
		instance: BaseHydratedObject,
		source: BaseHydratedObject,
		seen: WeakMap<object, object>,
	) {
		const cls = <BaseHydratedObjectConstructor>instance.constructor;

		seen.set(source, instance);

		for (const prop of Object.keys(cls.SCHEMA)) {
			const raw = Reflect.get(source, prop);

			Reflect.set(instance, prop, cloneValue(raw, seen));
		}
	}

	clone() {
		const cls = <new (...args: unknown[]) => typeof this>this.constructor;

		return new cls(this);
	}
}

export class HydratedObjectCloningContext {
	constructor(
		public source: BaseHydratedObject,
		public seen: WeakMap<object, object>,
	) {}
}

/*	Assert to TypeScript that the implementation will always define props from the schema
 *
 *	It is impossible to genericly extend the final type, as that would require the compiler to know ahead of time what generic the constructor
 *  would be instantiated with, so we export a mapper type with a generic so downstream abstract classes can also exhibit this property
 * 	This does not affect implementors, only classes which wish to "pass along" the final implementor to the constructor's generic if they are abstract
 */
type HydratedObjectSchema = Record<string, HydratorSchema>;

type HydratedObjectSchemaFields<S extends HydratedObjectSchema> = {
	[Key in keyof S as DefiniteKey<Key>]: HydratorValue<S[Key]>;
};

type MappedHydratedObjectClass<Inst extends BaseHydratedObject, Impl extends BaseHydratedObjectConstructor> = Inst &
	HydratedObjectSchemaFields<Impl["SCHEMA"]>;

export type MappedHydratedObjectConstructor<
	Ctor extends BaseHydratedObjectConstructor = BaseHydratedObjectConstructor,
> = Ctor & {
	new <Impl extends Ctor>(...args: ConstructorParameters<Ctor>): MappedHydratedObjectClass<InstanceType<Ctor>, Impl>;
};

export const HydratedObject = <MappedHydratedObjectConstructor>BaseHydratedObject;
export type HydratedObject = InstanceType<MappedHydratedObjectConstructor>;

export default HydratedObject;
