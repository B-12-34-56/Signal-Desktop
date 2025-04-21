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
var LeftPane_exports = {};
__export(LeftPane_exports, {
  LeftPaneMode: () => LeftPaneMode
});
module.exports = __toCommonJS(LeftPane_exports);
var LeftPaneMode = /* @__PURE__ */ ((LeftPaneMode2) => {
  LeftPaneMode2[LeftPaneMode2["INBOX_ARCHIVE"] = 0] = "INBOX_ARCHIVE";
  LeftPaneMode2[LeftPaneMode2["MESSAGE_REQUESTS"] = 1] = "MESSAGE_REQUESTS";
  LeftPaneMode2[LeftPaneMode2["COMPOSE"] = 2] = "COMPOSE";
  LeftPaneMode2[LeftPaneMode2["CONVERSATIONS"] = 3] = "CONVERSATIONS";
  LeftPaneMode2[LeftPaneMode2["CONTACTS"] = 4] = "CONTACTS";
  LeftPaneMode2[LeftPaneMode2["FILTER"] = 5] = "FILTER";
  return LeftPaneMode2;
})(LeftPaneMode || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LeftPaneMode
});
