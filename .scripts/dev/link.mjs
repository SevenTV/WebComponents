import { linkPackage } from "../linking.mjs";
import { enumeratePackages } from "../util.mjs";

console.log("Linking all packages to your yarn config for linking during development\n");

const packages = await enumeratePackages();

let hadFailures = false;
const promises = [];
for (const [name, info] of packages) {
	promises.push(
		linkPackage(info.path).then((success) => {
			if (success) {
				console.log(`✔ Linked: ${name}`);
			} else {
				console.error(`✗ Failed to link ${name}`);
				hadFailures = true;
			}
		}),
	);
}

await Promise.all(promises);

if (hadFailures) {
	console.log("\nNot all packages were successfully linked to your yarn config");
	console.log('To attempt to undo this action now or at a later time, run "yarn dev:unlink"');
} else {
	console.log(
		'\nSuccessfully linked all packages to your yarn config, to later undo this action run "yarn dev:unlink"',
	);
	console.log('To use the local copies of these packages in your project run "yarn link <package>"');
}

console.log(
	'Note: You can also use "yarn dev:link-package <dir>" to automatically link all packages into a project for easier co-development',
);
