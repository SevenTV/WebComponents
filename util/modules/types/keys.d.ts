// Resolves to never if the key is part of an indexed type, returns the key if it does not
export type DefiniteKey<Key extends PropertyKey> = string extends Key
	? never
	: number extends Key
	? never
	: symbol extends Key
	? never
	: Key;
