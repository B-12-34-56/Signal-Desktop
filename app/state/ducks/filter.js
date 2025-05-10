"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
  default: () => filter_default,
  incrementStat: () => incrementStat,
  resetStats: () => resetStats,
  setConfiguring: () => setConfiguring,
  setEnabled: () => setEnabled,
  setError: () => setError,
  setGlobalEnabled: () => setGlobalEnabled,
  setSimilarityThreshold: () => setSimilarityThreshold,
  setStats: () => setStats
});
module.exports = __toCommonJS(filter_exports);
var import_toolkit = require("@reduxjs/toolkit");
const initialState = {
  isEnabled: true,
  isGlobalEnabled: true,
  similarityThreshold: 90,
  stats: {
    imagesBlocked: 0,
    textsBlocked: 0,
    videosBlocked: 0
  },
  isConfiguring: false,
  error: null
};
const filterSlice = (0, import_toolkit.createSlice)({
  name: "filter",
  initialState,
  reducers: {
    setEnabled(state, action) {
      state.isEnabled = action.payload;
    },
    setGlobalEnabled(state, action) {
      state.isGlobalEnabled = action.payload;
    },
    setSimilarityThreshold(state, action) {
      state.similarityThreshold = action.payload;
    },
    setStats(state, action) {
      state.stats = action.payload;
    },
    incrementStat(state, action) {
      const { type, count } = action.payload;
      state.stats[type] += count;
    },
    resetStats(state) {
      state.stats = {
        imagesBlocked: 0,
        textsBlocked: 0,
        videosBlocked: 0
      };
    },
    setConfiguring(state, action) {
      state.isConfiguring = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  }
});
const {
  setEnabled,
  setGlobalEnabled,
  setSimilarityThreshold,
  setStats,
  incrementStat,
  resetStats,
  setConfiguring,
  setError
} = filterSlice.actions;
var filter_default = filterSlice.reducer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  incrementStat,
  resetStats,
  setConfiguring,
  setEnabled,
  setError,
  setGlobalEnabled,
  setSimilarityThreshold,
  setStats
});
