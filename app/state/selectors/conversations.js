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
var conversations_exports = {};
__export(conversations_exports, {
  getConversationById: () => getConversationById,
  getConversations: () => getConversations
});
module.exports = __toCommonJS(conversations_exports);
const getConversations = /* @__PURE__ */ __name((state) => state.conversations.items, "getConversations");
const getConversationById = /* @__PURE__ */ __name((state, id) => state.conversations.items.find((c) => c.id === id), "getConversationById");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getConversationById,
  getConversations
});
