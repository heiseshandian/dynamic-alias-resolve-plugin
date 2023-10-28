const DynamicAliasResolvePlugin = require("dynamic-alias-resolve-plugin");
const path = require("path");

module.exports = {
  resolve: {
    alias: {
      "@": "src",
    },
    plugins: [
      new DynamicAliasResolvePlugin({
        alias: "@",
        dynamic: () => path.resolve(__dirname, "./src/dest"),
        pattern: /^@/,
      }),
    ],
  },
};
