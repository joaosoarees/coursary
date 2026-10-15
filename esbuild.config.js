import esbuildPluginTsc from 'esbuild-plugin-tsc';

export default () => ({
  minify: true,
  keepNames: true,
  sourcemap: false,
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  plugins: [esbuildPluginTsc()],
});
