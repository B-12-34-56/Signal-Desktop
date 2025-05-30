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
  addConversation: () => import_conversations.addConversation,
  fetchConversations: () => fetchConversations,
  removeConversation: () => import_conversations.removeConversation,
  setConversations: () => import_conversations.setConversations
});
module.exports = __toCommonJS(conversations_exports);
var import_conversations = require("../ducks/conversations");
const fetchConversations = /* @__PURE__ */ __name(() => async (dispatch) => {
  try {
    const response = await fetch("/api/conversations");
    const data = await response.json();
    dispatch((0, import_conversations.setConversations)(data));
  } catch (error) {
    console.error("fetchConversations failed", error);
  }
}, "fetchConversations");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addConversation,
  fetchConversations,
  removeConversation,
  setConversations
});
