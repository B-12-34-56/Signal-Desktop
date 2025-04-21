import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  CreateTableCommand,
  ListTablesCommand,
} from "@aws-sdk/lib-dynamodb"

// AWS Configuration
let region = "us-east-1" // Default region
const TABLE_NAME = "SignalContentHashes"

// Initialize DynamoDB client
let client: DynamoDBClient
let docClient: any

export function initializeDynamoDB(awsRegion?: string) {
  if (awsRegion) {
    region = awsRegion
  }

  client = new DynamoDBClient({ region })
  docClient = DynamoDBDocumentClient.from(client)

  return { client, docClient }
}

export async function ensureTableExists() {
  if (!client || !docClient) {
    initializeDynamoDB()
  }

  try {
    // Check if table exists
    const { TableNames } = await docClient.send(new ListTablesCommand({}))

    if (!TableNames.includes(TABLE_NAME)) {
      // Create table if it doesn't exist
      const params = {
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: "contentHash", KeyType: "HASH" },
          { AttributeName: "timestamp", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
          { AttributeName: "contentHash", AttributeType: "S" },
          { AttributeName: "timestamp", AttributeType: "S" },
          { AttributeName: "contentType", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "ContentTypeIndex",
            KeySchema: [
              { AttributeName: "contentType", KeyType: "HASH" },
              { AttributeName: "timestamp", KeyType: "RANGE" },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      }

      await docClient.send(new CreateTableCommand(params))
      console.log(`Created table ${TABLE_NAME}`)
    }

    return true
  } catch (error) {
    console.error("Error ensuring table exists:", error)
    return false
  }
}

export async function saveContentHash(data: {
  contentHash: string
  contentType: "image" | "text" | "video"
  deviceId: string
  userId: string
}) {
  if (!client || !docClient) {
    initializeDynamoDB()
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        contentHash: data.contentHash,
        contentType: data.contentType,
        timestamp: new Date().toISOString(),
        deviceId: data.deviceId,
        userId: data.userId,
      },
    }

    await docClient.send(new PutCommand(params))
    return true
  } catch (error) {
    console.error("Error saving content hash to DynamoDB:", error)
    return false
  }
}

export async function getContentHashByHash(contentHash: string) {
  if (!client || !docClient) {
    initializeDynamoDB()
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "contentHash = :hash",
      ExpressionAttributeValues: {
        ":hash": contentHash,
      },
    }

    const { Items } = await docClient.send(new QueryCommand(params))
    return Items && Items.length > 0 ? Items[0] : null
  } catch (error) {
    console.error("Error getting content hash from DynamoDB:", error)
    return null
  }
}

export async function getContentHashesByType(contentType: "image" | "text" | "video") {
  if (!client || !docClient) {
    initializeDynamoDB()
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "ContentTypeIndex",
      KeyConditionExpression: "contentType = :type",
      ExpressionAttributeValues: {
        ":type": contentType,
      },
    }

    const { Items } = await docClient.send(new QueryCommand(params))
    return Items || []
  } catch (error) {
    console.error("Error getting content hashes by type from DynamoDB:", error)
    return []
  }
}
