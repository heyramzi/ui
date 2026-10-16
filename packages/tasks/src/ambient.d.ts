// Vite's ?raw import hands back the file as a string. Declared here so svelte-check passes
// without pulling in vite/client.
declare module "*.svg?raw" {
	const svg: string;
	export default svg;
}
