module.exports = { hooks: {} };

// Svelte Check needs the JavaScript compiler API alongside the project's native TypeScript 7 compiler.
const studioSvelteCompilerApi = module.exports.hooks?.readPackage;
module.exports.hooks ??= {};
module.exports.hooks.readPackage = async (pkg, context) => {
  pkg = studioSvelteCompilerApi ? await studioSvelteCompilerApi(pkg, context) : pkg;
  if (pkg.name === "svelte-check") {
    if (pkg.peerDependencies) delete pkg.peerDependencies.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: "^6.0.3" };
  }
  // Kit uses the JavaScript compiler API, which the native TypeScript 7 package does not export.
  if (pkg.name === "@sveltejs/kit") {
    if (pkg.peerDependencies) delete pkg.peerDependencies.typescript;
    pkg.dependencies = { ...pkg.dependencies, typescript: "^6.0.3" };
  }
  return pkg;
};
