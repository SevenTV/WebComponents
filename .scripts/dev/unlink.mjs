import { unlinkPackage } from "../linking.mjs";
import { enumeratePackages } from "../util.mjs";

console.log("Removing all packages in this repository from your yarn config\n");

const packages = await enumeratePackages();

const promises = [];
for (const [name, info] of packages) {
	promises.push(
		unlinkPackage(info.path).then((success) => {
			if (success) {
				console.log(`✔ Unlinked: ${name}`);
			} else {
				console.log(`✗ ${name} was not linked`);
			}
		}),
	);
}

await Promise.all(promises);

console.log("\nSuccessfully unlinked all packages in this repository from your yarn config");
console.log(
	'Note: You may need to run re-fetch the live versions of these packages in your projects using "yarn install --check-files" if you left any dangling links before unlinking',
);
