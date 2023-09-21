import { type UnwrapNestedRefs, reactive, readonly } from "vue";

type StateStore<R, T> = { -readonly [key in keyof R & keyof T]: T[key] };

export class ReactiveClass<R extends ClassReactivityProps> {
	protected state!: UnwrapNestedRefs<StateStore<R, typeof this>>;
	protected stateRaw!: StateStore<R, typeof this>;
	protected stateReadonly!: UnwrapNestedRefs<StateStore<R, typeof this>>;

	protected exposeState(stateProps: R) {
		this.stateRaw = {} as StateStore<R, typeof this>;
		this.state = reactive(this.stateRaw);
		this.stateReadonly = readonly(this.state) as UnwrapNestedRefs<StateStore<R, typeof this>>;

		for (const [prop, state] of Object.entries(stateProps)) {
			const key = prop as keyof StateStore<R, typeof this>;

			const readOnly = state.includes("readonly");

			Reflect.set(this.stateRaw, key, this[key]);

			Reflect.defineProperty(this, key, {
				get: () => {
					if (readOnly) return this.stateReadonly[key];
					else return this.state[key];
				},
				set: (val: this[typeof key]) => {
					if (readOnly) Reflect.set(this.stateReadonly, key, val);
					else Reflect.set(this.state, key, val);
				},
			});
		}
	}
}

export interface ClassReactivityProps {
	[key: string]: readonly ClassReactivityProp[];
}

export type ClassReactivityPropReadonly = "readonly";
export type ClassReactivityProp = ClassReactivityPropReadonly;
