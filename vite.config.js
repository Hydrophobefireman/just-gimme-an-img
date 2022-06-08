/**
 * @type {import("vite").UserConfig}
 */
export default {
  build: {
    target: "es2020",
    minify: "esbuild",
    soucemap: false,
  },
  plugins: [],
};
