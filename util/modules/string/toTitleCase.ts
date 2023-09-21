export function toTitleCase(string: string) {
	return string.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1));
}

export default toTitleCase;
