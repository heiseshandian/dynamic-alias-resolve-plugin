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
   * @param {Array<string>} param0.alias 指定哪些alias需要动态替换为新地址
   * @param {(request:ResolverRequest,alias:string)=>string | undefined | null | boolean} param0.dynamic 替换路径函数
   * @param {RegExp} param0.pattern 指定哪些文件需要经过本插件处理
   */
  constructor({ alias = ["@"], dynamic = () => null, pattern = /.*/ } = {}) {
    if (typeof alias === "string") {
      alias = [alias];
    }

    this.options = {
      alias,
      dynamic,
      pattern,
    };
  }

  apply(resolver) {
    const { alias, dynamic, pattern } = this.options;

    // 未传入alias不需要注册本插件
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
        // 不需要处理的文件直接返回，将控制权交给下一个resolve插件
        if (!innerRequest || !pattern.test(innerRequest)) {
          return callback();
        }

        for (const name of alias) {
          if (innerRequest.startsWith(name)) {
            // 不需要动态替换alias的请求直接进入下一次循环
            const dynamicPath = dynamic(request, name);
            if (!dynamicPath) {
              continue;
            }

            const newRequestPath = path.resolve(dynamicPath, innerRequest.substr(name.length + 1));

            // 替换路径不存在直接进入下一次循环
            if (!fs.existsSync(newRequestPath)) {
              continue;
            }

            // 使用替换路径发起新的resolve流程
            const obj = Object.assign({}, request, {
              request: newRequestPath,
            });
            return resolver.doResolve(
              "resolve",
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
