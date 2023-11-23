import { EffectScope, onScopeDispose, watch } from "vue";

export function useWebAnimations<L extends Record<string, AnimationInput>>(animationList?: L) {
	function getAnimation(animation: AnimationInput | keyof L | undefined | null): AnimationInput | undefined {
		if (!animation) return undefined;

		if (typeof animation == "object") {
			return animation;
		} else if (animationList) {
			return animationList[animation];
		}

		return undefined;
	}

	let activeScope: EffectScope | undefined;
	const active = new Set<Animation>();

	let queued: AnimationInput | keyof L | undefined | null;

	function finishedCallback(event: AnimationPlaybackEvent) {
		const anim = event.target as Animation;

		anim.removeEventListener("finish", finishedCallback);
		anim.cancel();
		active.delete(anim);

		if (active.size < 1 && queued) {
			play(queued);
		}
	}

	function stop() {
		if (activeScope) {
			activeScope.stop();
			activeScope = undefined;
		}

		queued = undefined;

		for (const anim of active) {
			anim.removeEventListener("finish", finishedCallback);
			anim.cancel();
		}

		active.clear();
	}

	function play(target: AnimationInput | keyof L | undefined | null) {
		stop();

		activeScope = new EffectScope();
		activeScope.run(() => {
			watch(
				() => getAnimation(target),
				(input) => {
					play(input);
				},
				{ deep: true },
			);
		});

		const input = getAnimation(target);
		if (!input) return false;

		const animations: Animation[] = [];

		for (const animation of input) {
			if (!animation.element) return false;

			animations.push(
				new Animation(new KeyframeEffect(animation.element, animation.keyframes, animation.options)),
			);
		}

		for (const animation of animations) {
			animation.addEventListener("finish", finishedCallback);
			animation.play();

			active.add(animation);
		}

		return true;
	}

	function pause() {
		for (const animation of active) {
			animation.pause();
		}
	}

	function resume() {
		for (const animation of active) {
			if (animation.playState == "paused") animation.play();
		}
	}

	function playNext(target: AnimationInput | keyof L | undefined | null) {
		queued = target;

		if (active.size > 0) {
			finishIteration();
		} else {
			play(queued);
		}
	}

	function finishIteration() {
		for (const animation of active) {
			if (!animation.effect) continue;
			if (animation.playState == "finished") continue;
			if (typeof animation.currentTime != "number") continue;

			const time = animation.currentTime;
			const timing = animation.effect.getComputedTiming();
			const duration = timing.duration;

			let newTime = time;
			if (typeof duration == "number") {
				const delay = timing.delay ?? 0;
				newTime = ((time - delay) % duration) + delay;
			}

			animation.effect.updateTiming({
				iterations: 1,
				endDelay: 0,
			});

			animation.currentTime = newTime;
		}
	}

	onScopeDispose(() => {
		stop();
	});

	return {
		stop,
		play,
		pause,
		resume,
		playNext,
		finishIteration,
	};
}

type AnimationInput = {
	element?: Element;
	keyframes: Keyframe[];
	options: KeyframeEffectOptions;
}[];

export default useWebAnimations;
