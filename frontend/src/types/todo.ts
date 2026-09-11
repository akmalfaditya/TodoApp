export type TodoPriority = 'Low' | 'Medium' | 'High';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: TodoPriority;
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueDate?: string;
}

export type UpdateTodoPayload = CreateTodoPayload & { isCompleted: boolean };

