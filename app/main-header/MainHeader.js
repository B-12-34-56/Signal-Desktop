"use strict";
"use client";
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
var MainHeader_exports = {};
__export(MainHeader_exports, {
  default: () => MainHeader_default
});
module.exports = __toCommonJS(MainHeader_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_lucide_react = require("lucide-react");
var import_react_i18next = require("react-i18next");
var import_classnames = __toESM(require("classnames"));
var import_types = require("../../types");
var import_react = require("react");
const MainHeader = /* @__PURE__ */ __name(() => {
  const { t: i18n } = (0, import_react_i18next.useTranslation)();
  const [leftPaneMode, setLeftPaneMode] = (0, import_react.useState)(import_types.LeftPaneMode.NOTES);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      "aria-label": i18n("icu:FilterTab__title"),
      className: (0, import_classnames.default)(
        "module-main-header__tab",
        leftPaneMode === import_types.LeftPaneMode.FILTER ? "module-main-header__tab--active" : null
      ),
      onClick: () => {
        setLeftPaneMode(import_types.LeftPaneMode.FILTER);
      },
      type: "button",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react.Filter, { size: 18 })
    }
  ) }) });
}, "MainHeader");
var MainHeader_default = MainHeader;
