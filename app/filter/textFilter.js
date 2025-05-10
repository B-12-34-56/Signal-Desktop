"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var textFilter_exports = {};
__export(textFilter_exports, {
  filterText: () => filterText,
  getTextSimilarity: () => getTextSimilarity
});
module.exports = __toCommonJS(textFilter_exports);
var crypto = __toESM(require("crypto"));
function filterText(text) {
  if (!text || text.length < 5) {
    return { isFiltered: false };
  }
  const normalizedText = text.toLowerCase().trim();
  const textHash = crypto.createHash("sha256").update(normalizedText).digest("hex");
  return {
    isFiltered: false,
    textHash
  };
}
__name(filterText, "filterText");
function getTextSimilarity(text1, text2) {
  const a = text1.toLowerCase();
  const b = text2.toLowerCase();
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          // substitution
          Math.min(
            matrix[i][j - 1] + 1,
            // insertion
            matrix[i - 1][j] + 1
            // deletion
          )
        );
      }
    }
  }
  const maxLength = Math.max(a.length, b.length);
  const distance = matrix[b.length][a.length];
  return 100 - distance * 100 / maxLength;
}
__name(getTextSimilarity, "getTextSimilarity");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  filterText,
  getTextSimilarity
});
