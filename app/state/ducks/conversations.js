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
var conversations_exports = {};
__export(conversations_exports, {
  addConversation: () => addConversation,
  default: () => conversations_default,
  removeConversation: () => removeConversation,
  setConversations: () => setConversations
});
module.exports = __toCommonJS(conversations_exports);
var import_toolkit = require("@reduxjs/toolkit");
const initialState = {
  items: [],
  loading: false
};
const slice = (0, import_toolkit.createSlice)({
  name: "conversations",
  initialState,
  reducers: {
    setConversations(state, action) {
      state.items = action.payload;
      state.loading = false;
      state.error = void 0;
    },
    addConversation(state, action) {
      state.items.push(action.payload);
    },
    removeConversation(state, action) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    }
  }
});
const {
  setConversations,
  addConversation,
  removeConversation
} = slice.actions;
var conversations_default = slice.reducer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addConversation,
  removeConversation,
  setConversations
});
