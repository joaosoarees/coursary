import esbuildPluginTsc from 'esbuild-plugin-tsc';

export default () => ({
  minify: true,
  keepNames: true,
  sourcemap: false,
  plugins: [esbuildPluginTsc()],
});
