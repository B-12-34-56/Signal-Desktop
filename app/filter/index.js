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
  FilterImageUpload: () => import_FilterImageUpload.FilterImageUpload,
  FilterService: () => import_FilterService.FilterService,
  FilterTab: () => import_FilterTab.FilterTab,
  ImageTagService: () => import_imageTagService.ImageTagService,
  ImageUploadService: () => import_imageUploadService.ImageUploadService,
  compareImageHashes: () => import_imageHash.compareImageHashes,
  filterText: () => import_textFilter.filterText,
  getImageHash: () => import_imageHash.getImageHash,
  getTextSimilarity: () => import_textFilter.getTextSimilarity,
  renderFilterImageUpload: () => import_FilterImageUpload2.renderFilterImageUpload
});
module.exports = __toCommonJS(filter_exports);
var import_FilterTab = require("./FilterTab");
var import_FilterService = require("./FilterService");
var import_imageHash = require("./imageHash");
var import_textFilter = require("./textFilter");
var import_imageUploadService = require("./imageUploadService");
var import_imageTagService = require("./imageTagService");
var import_FilterImageUpload = require("./FilterImageUpload");
var import_FilterImageUpload2 = require("./FilterImageUpload");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FilterImageUpload,
  FilterService,
  FilterTab,
  ImageTagService,
  ImageUploadService,
  compareImageHashes,
  filterText,
  getImageHash,
  getTextSimilarity,
  renderFilterImageUpload
});
