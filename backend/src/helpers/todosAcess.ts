import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { String } from 'aws-sdk/clients/cloudsearchdomain'

const XAWS = AWSXRay.captureAWS(AWS)
const createdAtIndex = process.env.CreatedAtIndex

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
    }
  
    async getAllTodos(userId: string): Promise<TodoItem[]> {
      const result = await this.docClient.query({
        TableName: this.todoTable,
        IndexName: createdAtIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
          },
      }).promise()
  
      const items = result.Items
      return items as TodoItem[]
    }
  
    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
      await this.docClient.put({
        TableName: this.todoTable,
        Item: {
          ...todoItem
        }
      }).promise()
  
      return todoItem
    }
  
    async getSignedUrl(bucketKey: string): Promise<string> {
      return this.s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: bucketKey,
        Expires: this.urlExpiration
      })
    }
  
    async updateAttachmentUrl(userId: String,todoId: string, attachmentUrl: string) {
      await this.docClient.update({
        TableName: this.todoTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      }).promise()
    }
  
    async updateTodo(updateTodoRequest: UpdateTodoRequest, userId: string, todoId: string): Promise<void> {
      await this.docClient.update({
        TableName: this.todoTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        },
        UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
        ExpressionAttributeValues:{
            ":name": updateTodoRequest.name,
            ":dueDate": updateTodoRequest.dueDate,
            ":done": updateTodoRequest.done
        },
        ExpressionAttributeNames: {
          "#name": "name"
        }
      }).promise()
    }
  
    async deleteTodo(userId: string, todoId: string): Promise<void> {
      await this.docClient.delete({
        TableName: this.todoTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        }
      }).promise()
    }
  
    async deleteTodoItemAttachment(bucketKey: string): Promise<void> {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: bucketKey
      }).promise()
    }
}