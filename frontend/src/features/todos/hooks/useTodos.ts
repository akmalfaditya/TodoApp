import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleComplete,
} from '../api';
import type { Todo, CreateTodoPayload, UpdateTodoPayload } from '../../../types/todo';

export const TODOS_QUERY_KEY = ['todos'] as const;

export const useTodosQuery = () => {
  return useQuery<Todo[]>({
    queryKey: TODOS_QUERY_KEY,
    queryFn: fetchTodos,
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTodoPayload) => createTodo(payload),
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);

      const optimisticTodo: Todo = {
        id: `temp-${Date.now()}`,
        title: newTodo.title,
        description: newTodo.description ?? null,
        isCompleted: false,
        priority: newTodo.priority,
        dueDate: newTodo.dueDate ?? null,
        ownerId: '',
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) => [
        optimisticTodo,
        ...old,
      ]);

      return { previousTodos };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useToggleComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleComplete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((item) =>
          item.id === id
            ? { ...item, isCompleted: !item.isCompleted, updatedAt: new Date().toISOString() }
            : item
        )
      );

      return { previousTodos };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoPayload }) =>
      updateTodo(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.map((item) =>
          item.id === id
            ? {
                ...item,
                ...payload,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      return { previousTodos };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TODOS_QUERY_KEY });
      const previousTodos = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY);

      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previousTodos };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
    },
  });
};
