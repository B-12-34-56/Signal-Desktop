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
  getFilter: () => getFilter,
  getFilterEnabled: () => getFilterEnabled,
  getFilterError: () => getFilterError,
  getFilterStats: () => getFilterStats,
  getGlobalFilterEnabled: () => getGlobalFilterEnabled,
  getIsConfiguring: () => getIsConfiguring,
  getSimilarityThreshold: () => getSimilarityThreshold
});
module.exports = __toCommonJS(filter_exports);
var import_reselect = require("reselect");
const getFilter = /* @__PURE__ */ __name((state) => state.filter, "getFilter");
const getFilterEnabled = (0, import_reselect.createSelector)(getFilter, (filter) => filter.isEnabled);
const getGlobalFilterEnabled = (0, import_reselect.createSelector)(getFilter, (filter) => filter.isGlobalEnabled);
const getSimilarityThreshold = (0, import_reselect.createSelector)(getFilter, (filter) => filter.similarityThreshold);
const getFilterStats = (0, import_reselect.createSelector)(getFilter, (filter) => filter.stats);
const getIsConfiguring = (0, import_reselect.createSelector)(getFilter, (filter) => filter.isConfiguring);
const getFilterError = (0, import_reselect.createSelector)(getFilter, (filter) => filter.error);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getFilter,
  getFilterEnabled,
  getFilterError,
  getFilterStats,
  getGlobalFilterEnabled,
  getIsConfiguring,
  getSimilarityThreshold
});
