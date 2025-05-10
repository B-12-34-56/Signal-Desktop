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
var LeftPaneDialog_exports = {};
__export(LeftPaneDialog_exports, {
  LeftPaneDialog: () => LeftPaneDialog
});
module.exports = __toCommonJS(LeftPaneDialog_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_LeftPaneMode = require("../constants/LeftPaneMode");
var import_LeftPaneFilterTab = require("./LeftPaneFilterTab");
var import_InboxArchiveTab = require("./InboxArchiveTab");
var import_MessageRequestsTab = require("./MessageRequestsTab");
function LeftPaneDialog({
  mode,
  i18n
  // … rest of your props …
}) {
  switch (mode) {
    case import_LeftPaneMode.LeftPaneMode.INBOX_ARCHIVE:
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_InboxArchiveTab.InboxArchiveTab, { i18n });
    case import_LeftPaneMode.LeftPaneMode.MESSAGE_REQUESTS:
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_MessageRequestsTab.MessageRequestsTab, { i18n });
    // ← your new filter case goes here
    case import_LeftPaneMode.LeftPaneMode.FILTER:
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_LeftPaneFilterTab.SmartFilterTab,
        {
          i18n
        }
      );
    // … other cases …
    default:
      return null;
  }
}
__name(LeftPaneDialog, "LeftPaneDialog");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LeftPaneDialog
});
