const fs = require("fs");
const path = require("path");

module.exports = class DynamicAliasResolvePlugin {
  /**
   *
   * @typedef {Object} DescriptionFileData
   * @property {any} concord
   * @property {{key:string}:boolean} browser
   */
  /**
   *
   * @typedef {Object} ResolverRequest
   * @property {any} context
   * @property {DescriptionFileData} [descriptionFileData]
   * @property {string} [descriptionFilePath]
   * @property {string} [descriptionFileRoot]
   * @property {boolean} [directory]
   * @property {boolean} [module]
   * @property {string} [path]
   * @property {string} [query]
   * @property {string} [relativePath]
   * @property {string} request
   */
  /**
   *
   * @param {object} param0
   * @param {Array<string>} param0.alias alias that should be replaced by new path
   * @param {(request:ResolverRequest,alias:string)=>string | undefined | null | boolean} param0.dynamic a function whose result is an absolute path that alias points to
   * @param {RegExp} param0.pattern specify which files should be handled by this plugin
   * @param {Array<string>} param0.extensions specify the extensions that we should try for modules that don't have file extensions
   */
  constructor({ alias, dynamic, pattern, extensions } = {}) {
    if (typeof alias === "string") {
      alias = [alias];
    }

    const defaultOptions = {
      alias: ["@"],
      dynamic: () => null,
      pattern: /.*/,
      extensions: ["js", "mjs", "ts", "jsx", "tsx"],
    };

    this.options = extend(defaultOptions, {
      alias,
      dynamic,
      pattern,
      extensions,
    });
  }

  apply(resolver) {
    const { alias, dynamic, pattern, extensions } = this.options;

    if (alias.length === 0) {
      return;
    }

    resolver
      .getHook("described-resolve")
      .tapAsync("DynamicAliasResolvePlugin", (request, resolveContext, callback) => {
        /**
         * @type {string}
         */
        const innerRequest = request.request || request.path;
        // For files that shouldn't be handled by this plugin
        if (!innerRequest || !pattern.test(innerRequest)) {
          return callback();
        }

        for (const name of alias) {
          if (innerRequest.startsWith(name)) {
            const dynamicPath = dynamic(request, name);
            if (!dynamicPath) {
              continue;
            }

            let newRequestPath = path.resolve(dynamicPath, innerRequest.substr(name.length + 1));
            if (!hasExtension(newRequestPath)) {
              const newRequestPathsWithExtension = getNewRequestPathsWithExtension(
                newRequestPath,
                extensions
              );
              newRequestPath = newRequestPathsWithExtension.find((filePath) =>
                fs.existsSync(filePath)
              );
            }

            if (!fs.existsSync(newRequestPath)) {
              continue;
            }

            const obj = Object.assign({}, request, {
              request: newRequestPath,
            });
            return resolver.doResolve(
              resolver.getHook("resolve"),
              obj,
              `DynamicAliasResolvePlugin ${newRequestPath}`,
              resolveContext,
              (err, result) => {
                if (err) return callback(err);
                // Don't allow other aliasing or raw request
                if (result === undefined) return callback(null, null);
                return callback(null, result);
              }
            );
          }
        }

        return callback();
      });
  }
};

function hasExtension(filePath = "") {
  // we don't care about the extension is valid or not, just a dot plus a word whose length is between 1 and 10.
  const extensionPattern = /\.[a-z]{1,10}$/i;
  return extensionPattern.test(filePath);
}

function getNewRequestPathsWithExtension(newRequestPath, extensions) {
  return extensions.map((ext) => `${newRequestPath}.${ext}`);
}

function extend(src, dest) {
  return Object.keys(dest).reduce((src, curKey) => {
    const val = dest[curKey];
    if (val !== undefined) {
      src[curKey] = val;
    }
    return src;
  }, src);
}
