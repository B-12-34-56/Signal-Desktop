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
var InboxArchiveTab_exports = {};
__export(InboxArchiveTab_exports, {
  InboxArchiveTab: () => InboxArchiveTab
});
module.exports = __toCommonJS(InboxArchiveTab_exports);
var import_jsx_runtime = require("react/jsx-runtime");
const InboxArchiveTab = /* @__PURE__ */ __name(({ i18n }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "left-pane-tab inbox-archive-tab", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: i18n("leftPane.inboxArchive.title") }) });
}, "InboxArchiveTab");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InboxArchiveTab
});
