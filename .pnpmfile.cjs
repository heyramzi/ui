module.exports = { hooks: {} };

// These read the JavaScript compiler API, which the project's native TypeScript 7 package doesn't
// export: Svelte Check, Kit, and svelte2tsx's emitDts (it throws on 7) for the published .svelte.d.ts.
const NEEDS_TS_API = new Set(["svelte-check", "@sveltejs/kit", "svelte2tsx"]);
const studioSvelteCompilerApi = module.exports.hooks?.readPackage;
module.exports.hooks ??= {};
module.exports.hooks.readPackage = async (pkg, context) => {
  pkg = studioSvelteCompilerApi ? await studioSvelteCompilerApi(pkg, context) : pkg;
  if (NEEDS_TS_API.has(pkg.name)) {
    if (pkg.peerDependencies) delete pkg.peerDependencies.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: "^6.0.3" };
  }
  return pkg;
};
