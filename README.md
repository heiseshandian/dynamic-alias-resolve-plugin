# dynamic-alias-resolve-plugin

![](assets/2020-06-12-10-12-59.png)

## Introduction

Thanks for the help of [enhanced-resolve](https://github.com/webpack/enhanced-resolve), we can define alias for path, but it's static, in some cases we may want alias point to A path or B path, in other words, we want dynamic alias. [enhanced-resolve](https://github.com/webpack/enhanced-resolve) is based on [tapable](https://github.com/webpack/tapable), so we can write a plugin to make it.

Read this in other languages: [english](./README.md), [简体中文](./README.zh-cn.md)

## Prerequisites

This module requires webpack v4 and above.

## Installation

```sh
npm install -D dynamic-alias-resolve-plugin
```

## Usage

In your webpack config, require() the dynamic-alias-resolve-plugin plugin as follows:

```js
const DynamicAliasResolvePlugin = require("dynamic-alias-resolve-plugin");
```

and finally, add the plugin to your resolve configuration's plugins array

```js
// https://webpack.js.org/configuration/resolve/#resolveplugins
resolve: {
  plugins: [
    new DynamicAliasResolvePlugin({
      // alias you want to make it dynamic
      alias: "@",
      // pathA or pathB should be replaced with real path
      // "request" is raw request object from enhanced-resolve
      dynamic: (request) => "pathA or PathB",
      // we just want less file to be handled by this plugin
      pattern: /\.less$/,
    }),
  ];
}
```

## Options

| properties |                                       description                                        |   type   | default  |
| :--------: | :--------------------------------------------------------------------------------------: | :------: | :------: |
|   alias    |                            alias you want to make it dynamic                             |  string  |   '@'    |
|  dynamic   | return value should be ==absolute path==, all false value('',false,null) will be ignored | function | ()=>null |
|  pattern   |                            files needs handled by this plugin                            |  RegExp  |  /.\*/   |
