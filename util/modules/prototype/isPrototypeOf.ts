export function isPrototypeOf<P extends object>(prototype: P, object: object): object is P {
	return Object.prototype.isPrototypeOf.call(prototype, object);
}

export default isPrototypeOf;
