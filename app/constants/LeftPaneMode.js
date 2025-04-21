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
var LeftPaneMode_exports = {};
__export(LeftPaneMode_exports, {
  LeftPaneMode: () => LeftPaneMode
});
module.exports = __toCommonJS(LeftPaneMode_exports);
var LeftPaneMode = /* @__PURE__ */ ((LeftPaneMode2) => {
  LeftPaneMode2["INBOX_ARCHIVE"] = "INBOX_ARCHIVE";
  LeftPaneMode2["MESSAGE_REQUESTS"] = "MESSAGE_REQUESTS";
  LeftPaneMode2["FILTER"] = "FILTER";
  return LeftPaneMode2;
})(LeftPaneMode || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LeftPaneMode
});
