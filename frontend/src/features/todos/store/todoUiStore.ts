import { create } from 'zustand';

export type TodoFilter = 'all' | 'active' | 'completed';
export type TodoSortBy = 'dueDate' | 'priority' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface TodoUiState {
  filter: TodoFilter;
  sortBy: TodoSortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  setFilter: (filter: TodoFilter) => void;
  setSortBy: (sortBy: TodoSortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setSearchQuery: (query: string) => void;
}

export const useTodoUiStore = create<TodoUiState>((set) => ({
  filter: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

export default useTodoUiStore;

