import { hydrateValue } from "./hydration";
import type { HydratorSchema, HydratorValue } from "../types/hydrator";
import type { DefiniteKey } from "@seventv/util/modules/types";

type HydratedObjectConstructor = typeof HydratedObjectClass;
class HydratedObjectClass {
	static SCHEMA: HydratedObjectSchema = {};

	constructor(json: object) {
		const cls = <HydratedObjectConstructor>this.constructor;

		for (const [prop, schema] of Object.entries(cls.SCHEMA)) {
			const isOwn = Object.prototype.hasOwnProperty.call(json, prop);
			const raw = isOwn ? Reflect.get(json, prop) : undefined;

			Reflect.set(this, prop, hydrateValue(raw, schema, prop, [json]));
		}
	}
}

export type HydratedObjectSchema = Record<string, HydratorSchema>;

/*	Assert to TypeScript that the implementation will always define props from the schema
 *
 *	It is impossible to genericly extend the final type, as that would require the compiler to know ahead of time what generic the constructor
 *  would be instantiated with, so we export a mapper type with a generic so downstream abstract classes can also exhibit this property
 * 	This does not affect implementors, only classes which wish to "pass along" the final implementor to the constructor's generic if they are abstract
 */
type HydratedObjectSchemaFields<S extends HydratedObjectSchema> = {
	[Key in keyof S as DefiniteKey<Key>]: HydratorValue<S[Key]>;
};

type MappedHydratedObjectClass<Inst extends HydratedObjectClass, Impl extends HydratedObjectConstructor> = Inst &
	HydratedObjectSchemaFields<Impl["SCHEMA"]>;

export type MappedHydratedObjectConstructor<Ctor extends HydratedObjectConstructor = HydratedObjectConstructor> = {
	new <Impl extends Ctor = Ctor>(
		...args: ConstructorParameters<Ctor>
	): MappedHydratedObjectClass<InstanceType<Ctor>, Impl>;
} & {
	[Prop in keyof Ctor]: Ctor[Prop];
};

export const HydratedObject = <MappedHydratedObjectConstructor>HydratedObjectClass;
export type HydratedObject = MappedHydratedObjectClass<HydratedObjectClass, HydratedObjectConstructor>;

export default HydratedObject;
