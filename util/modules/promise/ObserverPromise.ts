import { ExtendedPromise } from "./ExtendedPromise";

export class ObserverPromise<V> extends ExtendedPromise<V> {
	private observer: MutationObserver | undefined;

	constructor(
		callback: (mutations: MutationRecord[], emit: (v: V) => void) => void,
		target: Node,
		options?: MutationObserverInit,
	) {
		super();

		this.observer = new MutationObserver((mutations) => {
			callback(mutations, this.emit.bind(this));
		});

		this.observer.observe(target, options);
	}

	protected emit(v: V) {
		super.emit(v);

		this.disconnect();
	}

	disconnect() {
		this.observer?.disconnect();
		this.observer = undefined;

		if (!this.isResolved) {
			this.reject?.(new ObserverPromiseNotResolvedError());
		}
	}
}

export class ObserverPromiseNotResolvedError extends Error {
	constructor() {
		super("ObserverPromise: Observer disconnected before resolving.");
	}
}

export default ObserverPromise;
