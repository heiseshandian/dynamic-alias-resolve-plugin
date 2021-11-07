const DynamicAliasResolvePlugin = require("dynamic-alias-resolve-plugin");
const path = require("path");

module.exports = {
  resolve: {
    plugins: [
      new DynamicAliasResolvePlugin({
        alias: "src",
        dynamic: () => path.resolve(__dirname, "./src/dest"),
        pattern: /^src/,
      }),
    ],
  },
};
