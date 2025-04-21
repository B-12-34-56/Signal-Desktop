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
var imageHash_exports = {};
__export(imageHash_exports, {
  compareImageHashes: () => compareImageHashes,
  getImageHash: () => getImageHash
});
module.exports = __toCommonJS(imageHash_exports);
var crypto = __toESM(require("crypto"));
var import_image_js = require("image-js");
async function getImageHash(imageData) {
  try {
    const image = await import_image_js.Image.load(imageData);
    const resized = image.resize({ width: 8, height: 8 });
    const gray = resized.grey();
    let sum = 0;
    for (let i = 0; i < gray.data.length; i++) {
      sum += gray.data[i];
    }
    const avg = sum / gray.data.length;
    let binaryHash = "";
    for (let i = 0; i < gray.data.length; i++) {
      binaryHash += gray.data[i] >= avg ? "1" : "0";
    }
    const hexHash = Number.parseInt(binaryHash, 2).toString(16).padStart(16, "0");
    return hexHash;
  } catch (error) {
    console.error("Error generating image hash:", error);
    return crypto.createHash("sha256").update(imageData).digest("hex");
  }
}
__name(getImageHash, "getImageHash");
function compareImageHashes(hash1, hash2) {
  const binary1 = Number.parseInt(hash1, 16).toString(2).padStart(64, "0");
  const binary2 = Number.parseInt(hash2, 16).toString(2).padStart(64, "0");
  let distance = 0;
  for (let i = 0; i < binary1.length; i++) {
    if (binary1[i] !== binary2[i]) {
      distance++;
    }
  }
  return 100 - distance * 100 / 64;
}
__name(compareImageHashes, "compareImageHashes");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  compareImageHashes,
  getImageHash
});
