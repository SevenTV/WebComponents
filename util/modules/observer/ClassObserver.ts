export class ClassObserver extends MutationObserver {
	constructor(callback: (changes: Set<string>) => void) {
		super((records) => {
			for (const record of records) {
				if (record.target instanceof Element == false) continue;
				if (record.attributeName !== "class") continue;

				const target = record.target as Element;

				const oldClasses = new Set<string>(record.oldValue?.split(" "));
				const newClasses = new Set<string>(target.getAttribute(record.attributeName)?.split(" "));
				const changedClasses = new Set<string>();

				for (const cl of newClasses) {
					if (!oldClasses.has(cl)) changedClasses.add(cl);
				}

				for (const cl of oldClasses) {
					if (!newClasses.has(cl)) changedClasses.add(cl);
				}

				callback(changedClasses);
				break;
			}
		});
	}

	observe(target: Node): void {
		super.observe(target, {
			attributes: true,
			attributeFilter: ["class"],
			attributeOldValue: true,
		});
	}
}

export default ClassObserver;
