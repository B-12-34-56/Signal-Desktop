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
var dynamodb_exports = {};
__export(dynamodb_exports, {
  ensureTableExists: () => ensureTableExists,
  getContentHashByHash: () => getContentHashByHash,
  getContentHashesByType: () => getContentHashesByType,
  initializeDynamoDB: () => initializeDynamoDB,
  saveContentHash: () => saveContentHash
});
module.exports = __toCommonJS(dynamodb_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
let region = "us-east-1";
const TABLE_NAME = "SignalContentHashes";
let client;
let docClient;
function initializeDynamoDB(awsRegion) {
  if (awsRegion) {
    region = awsRegion;
  }
  client = new import_client_dynamodb.DynamoDBClient({ region });
  docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
  return { client, docClient };
}
__name(initializeDynamoDB, "initializeDynamoDB");
async function ensureTableExists() {
  if (!client || !docClient) {
    initializeDynamoDB();
  }
  try {
    const { TableNames } = await docClient.send(new import_lib_dynamodb.ListTablesCommand({}));
    if (!TableNames.includes(TABLE_NAME)) {
      const params = {
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: "contentHash", KeyType: "HASH" },
          { AttributeName: "timestamp", KeyType: "RANGE" }
        ],
        AttributeDefinitions: [
          { AttributeName: "contentHash", AttributeType: "S" },
          { AttributeName: "timestamp", AttributeType: "S" },
          { AttributeName: "contentType", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "ContentTypeIndex",
            KeySchema: [
              { AttributeName: "contentType", KeyType: "HASH" },
              { AttributeName: "timestamp", KeyType: "RANGE" }
            ],
            Projection: {
              ProjectionType: "ALL"
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      };
      await docClient.send(new import_lib_dynamodb.CreateTableCommand(params));
      console.log(`Created table ${TABLE_NAME}`);
    }
    return true;
  } catch (error) {
    console.error("Error ensuring table exists:", error);
    return false;
  }
}
__name(ensureTableExists, "ensureTableExists");
async function saveContentHash(data) {
  if (!client || !docClient) {
    initializeDynamoDB();
  }
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        contentHash: data.contentHash,
        contentType: data.contentType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        deviceId: data.deviceId,
        userId: data.userId
      }
    };
    await docClient.send(new import_lib_dynamodb.PutCommand(params));
    return true;
  } catch (error) {
    console.error("Error saving content hash to DynamoDB:", error);
    return false;
  }
}
__name(saveContentHash, "saveContentHash");
async function getContentHashByHash(contentHash) {
  if (!client || !docClient) {
    initializeDynamoDB();
  }
  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "contentHash = :hash",
      ExpressionAttributeValues: {
        ":hash": contentHash
      }
    };
    const { Items } = await docClient.send(new import_lib_dynamodb.QueryCommand(params));
    return Items && Items.length > 0 ? Items[0] : null;
  } catch (error) {
    console.error("Error getting content hash from DynamoDB:", error);
    return null;
  }
}
__name(getContentHashByHash, "getContentHashByHash");
async function getContentHashesByType(contentType) {
  if (!client || !docClient) {
    initializeDynamoDB();
  }
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "ContentTypeIndex",
      KeyConditionExpression: "contentType = :type",
      ExpressionAttributeValues: {
        ":type": contentType
      }
    };
    const { Items } = await docClient.send(new import_lib_dynamodb.QueryCommand(params));
    return Items || [];
  } catch (error) {
    console.error("Error getting content hashes by type from DynamoDB:", error);
    return [];
  }
}
__name(getContentHashesByType, "getContentHashesByType");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ensureTableExists,
  getContentHashByHash,
  getContentHashesByType,
  initializeDynamoDB,
  saveContentHash
});
