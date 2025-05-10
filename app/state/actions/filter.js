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
var filter_exports = {};
__export(filter_exports, {
  actions: () => actions,
  mapDispatchToProps: () => mapDispatchToProps
});
module.exports = __toCommonJS(filter_exports);
var import_redux = require("redux");
var import_filter = require("../ducks/filter");
const actions = {
  setFilterEnabled: import_filter.setEnabled,
  setGlobalFilterEnabled: import_filter.setGlobalEnabled,
  setFilterSimilarityThreshold: import_filter.setSimilarityThreshold,
  setFilterStats: import_filter.setStats,
  resetFilterStats: import_filter.resetStats,
  setFilterConfiguring: import_filter.setConfiguring,
  setFilterError: import_filter.setError
};
const mapDispatchToProps = /* @__PURE__ */ __name((dispatch) => ({
  filterActions: (0, import_redux.bindActionCreators)(actions, dispatch)
}), "mapDispatchToProps");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  actions,
  mapDispatchToProps
});
