"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var LeftPaneFilterTab_exports = {};
__export(LeftPaneFilterTab_exports, {
  SmartFilterTab: () => SmartFilterTab
});
module.exports = __toCommonJS(LeftPaneFilterTab_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react_redux = require("react-redux");
var import_filter = require("../state/selectors/filter");
var import_filter2 = require("../state/actions/filter");
var import_FilterTab = require("../filter/FilterTab");
const mapStateToProps = /* @__PURE__ */ __name((state) => {
  return {
    filter: (0, import_filter.getFilter)(state)
  };
}, "mapStateToProps");
const smart = (0, import_react_redux.connect)(mapStateToProps, import_filter2.mapDispatchToProps);
const SmartFilterTab = smart(
  ({
    filter,
    filterActions,
    i18n
  }) => {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_FilterTab.FilterTab, { i18n });
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SmartFilterTab
});
