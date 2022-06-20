import { createLogger } from '../utils/logger'
import { TodoAccess } from '../dataLayer/todosAcess';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import * as uuid from 'uuid'

const logger = createLogger('todos')
const todoAccess = new TodoAccess()
const todoStorage = new AttachmentUtils()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info(`Retrieving all todos for user ${userId}`)
    return await todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createGroupRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

    const newItem: TodoItem = {
        userId,
        todoId: uuid.v4(),
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: null,
        ...createGroupRequest
    }
    await todoAccess.createTodo(newItem)
    return newItem
}

export async function generateUploadUrl(attachmentId: string): Promise<string> {
    logger.info(`Generating upload URL for attachment ${attachmentId}`)
    const uploadUrl = await todoStorage.getUploadUrl(attachmentId)
    return uploadUrl
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  userId: string,
  todoId: string
): Promise<void> {
    logger.info(`Updating todo ${todoId} for user ${userId}`)
    await todoAccess.updateTodo(updateTodoRequest, userId, todoId)
}

export async function deleteTodo(userId: string, todoId: string) {
  logger.info(`Deleting todo ${todoId} for user ${userId}`)
  await Promise.all([
    todoAccess.deleteTodo(userId, todoId),
    todoAccess.deleteTodoItemAttachment(todoId)
  ])  
}

export async function updateAttachmentUrl(userId: string, todoId: string, attachmentId: string) {
  logger.info(`Generating attachment URL for attachment ${attachmentId}`)
  const attachmentUrl = await todoStorage.getAttachmentUrl(attachmentId)
  await todoAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)
}
