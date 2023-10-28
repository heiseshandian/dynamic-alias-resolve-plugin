const path = require("path");

const HAS_HANDLED_BY_DYNAMIC_ALIAS_PLUGIN = Symbol();

module.exports = class DynamicAliasResolvePlugin {
  /**
   * @typedef {import("enhanced-resolve/lib/Resolver")} Resolver
   * */

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
   */
  constructor({ alias, dynamic, pattern, extensions } = {}) {
    if (typeof alias === "string") {
      alias = [alias];
    }

    const defaultOptions = {
      alias: ["@"],
      dynamic: () => null,
      pattern: /.*/,
    };

    this.options = extend(defaultOptions, {
      alias,
      dynamic,
      pattern,
    });
  }

  /**
   *
   * @param {Resolver} resolver
   * @returns
   */
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
        if (
          !innerRequest ||
          !pattern.test(innerRequest) ||
          request[HAS_HANDLED_BY_DYNAMIC_ALIAS_PLUGIN]
        ) {
          return callback();
        }

        /**
         * If a request has been handled by this plugin, we won't handle it again; otherwise, it will cause a cyclical execution.
         */
        request[HAS_HANDLED_BY_DYNAMIC_ALIAS_PLUGIN] = true;

        for (const name of alias) {
          if (innerRequest.startsWith(name)) {
            const dynamicPath = dynamic(request, name);
            if (!dynamicPath) {
              continue;
            }

            let newRequestPath = [
              removeTrailingPathSeparator(dynamicPath),
              innerRequest.substring(name.length + 1),
            ].join(path.sep);

            const obj = Object.assign({}, request, {
              request: newRequestPath,
            });

            return resolver.doResolve(
              resolver.ensureHook("resolve"),
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

function extend(src, dest) {
  return Object.keys(dest).reduce((src, curKey) => {
    const val = dest[curKey];
    if (val !== undefined) {
      src[curKey] = val;
    }
    return src;
  }, src);
}

function removeTrailingPathSeparator(str) {
  const regex = new RegExp(path.sep + "+$", "g");
  return str.replace(regex, "");
}
