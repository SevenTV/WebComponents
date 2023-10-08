import type HydratedObject from "../hydrator/HydratedObject";

export interface HydratorSchemaBase {
	required?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default?: any;
}

export interface HydratorSchemaOptional extends HydratorSchemaBase {
	required: false;
}

export interface HydratorSchemaOptionalWithDefault extends HydratorSchemaOptional {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default?: any;
}

export type HydratorValueOptional<S, V> = S extends HydratorSchemaOptionalWithDefault
	? V | S["default"]
	: S extends HydratorSchemaOptional
	? V | undefined
	: V;

type HydratorSchemaPrimitives = "boolean" | "string" | "number" | "bigint" | "symbol" | "undefined" | "null" | "never";
type PrimitiveType<T extends HydratorSchemaPrimitives> = T extends "boolean"
	? boolean
	: T extends "string"
	? string
	: T extends "number"
	? number
	: T extends "bigint"
	? bigint
	: T extends "symbol"
	? symbol
	: T extends "undefined"
	? undefined
	: T extends "null"
	? null
	: T extends "never"
	? never
	: unknown;

export interface HydratorSchemaPrimitive extends HydratorSchemaBase {
	type: HydratorSchemaPrimitives;
}

export type HydratorValuePrimitive<S extends HydratorSchemaPrimitive> = PrimitiveType<S["type"]>;

export type HydratorSchemaPrimitiveShorthand = HydratorSchemaPrimitives;

export type HydratorValuePrimitiveShorthand<S extends HydratorSchemaPrimitiveShorthand> = PrimitiveType<S>;

export interface HydratorSchemaArray extends HydratorSchemaBase {
	type: "array";
	children: HydratorSchema;
	skipInvalid?: boolean;
}

export type HydratorValueArray<S extends HydratorSchemaArray> = HydratorValue<S["children"]>[];

export interface HydratorSchemaObjectMap extends HydratorSchemaBase {
	type: "object";
	children: HydratorSchema;
}

export type HydratorValueObjectMap<S extends HydratorSchemaObjectMap> = {
	[x: PropertyKey]: HydratorValue<S["children"]>;
};

export interface HydratorSchemaObjectKeys extends HydratorSchemaBase {
	type: "object";
	schema: Record<string, HydratorSchema>;
}

export type HydratorValueObjectKeys<S extends HydratorSchemaObjectKeys> = {
	[Prop in keyof S["schema"]]: HydratorValue<S["schema"][Prop]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HydratedObjectConstructor = new (json: object, ...args: any[]) => HydratedObject;

export interface HydratorSchemaHydratedObject extends HydratorSchemaBase {
	type: HydratedObjectConstructor;
}

export type HydratorValueHydratedObject<S extends HydratorSchemaHydratedObject> = InstanceType<S["type"]>;

export type HydratorSchemaHydratedObjectShorthand = HydratedObjectConstructor;

export type HydratorValueHydratedObjectShorthand<S extends HydratorSchemaHydratedObjectShorthand> = InstanceType<S>;

export type HydratorSchemaTransformer = (current: unknown, ancestors: unknown[]) => HydratorSchemaStatic;

export type HydratorSchemaTransformerValue<T extends HydratorSchemaTransformer> = HydratorValue<ReturnType<T>>;

export type HydratorSchemaFull =
	| HydratorSchemaPrimitive
	| HydratorSchemaArray
	| HydratorSchemaObjectMap
	| HydratorSchemaObjectKeys
	| HydratorSchemaHydratedObject;

export type HydratorSchemaShorthand = HydratorSchemaPrimitiveShorthand | HydratorSchemaHydratedObjectShorthand;

export type HydratorSchemaStatic = HydratorSchemaFull | HydratorSchemaShorthand;

export type HydratorSchema = HydratorSchemaStatic | HydratorSchemaTransformer;

export type HydratorValue<S extends HydratorSchema = HydratorSchema> = HydratorValueOptional<
	S,
	S extends HydratorSchemaPrimitive
		? HydratorValuePrimitive<S>
		: S extends HydratorSchemaPrimitiveShorthand
		? HydratorValuePrimitiveShorthand<S>
		: S extends HydratorSchemaArray
		? HydratorValueArray<S>
		: S extends HydratorSchemaObjectMap
		? HydratorValueObjectMap<S>
		: S extends HydratorSchemaObjectKeys
		? HydratorValueObjectKeys<S>
		: S extends HydratorSchemaHydratedObject
		? HydratorValueHydratedObject<S>
		: S extends HydratorSchemaHydratedObjectShorthand
		? HydratorValueHydratedObjectShorthand<S>
		: S extends HydratorSchemaTransformer
		? HydratorSchemaTransformerValue<S>
		: unknown
>;
