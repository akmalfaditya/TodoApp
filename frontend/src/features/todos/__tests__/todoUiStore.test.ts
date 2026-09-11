import { describe, it, expect, beforeEach } from 'vitest';
import { useTodoUiStore } from '../store/todoUiStore';

describe('todoUiStore', () => {
  beforeEach(() => {
    useTodoUiStore.setState({
      filter: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      searchQuery: '',
    });
  });

  it('should initialize with default UI state', () => {
    const state = useTodoUiStore.getState();
    expect(state.filter).toBe('all');
    expect(state.sortBy).toBe('createdAt');
    expect(state.sortOrder).toBe('desc');
    expect(state.searchQuery).toBe('');
  });

  it('should update filter state', () => {
    useTodoUiStore.getState().setFilter('active');
    expect(useTodoUiStore.getState().filter).toBe('active');

    useTodoUiStore.getState().setFilter('completed');
    expect(useTodoUiStore.getState().filter).toBe('completed');
  });

  it('should update sort and toggle sort order', () => {
    useTodoUiStore.getState().setSortBy('priority');
    expect(useTodoUiStore.getState().sortBy).toBe('priority');

    useTodoUiStore.getState().toggleSortOrder();
    expect(useTodoUiStore.getState().sortOrder).toBe('asc');

    useTodoUiStore.getState().toggleSortOrder();
    expect(useTodoUiStore.getState().sortOrder).toBe('desc');
  });

  it('should update search query', () => {
    useTodoUiStore.getState().setSearchQuery('Meeting');
    expect(useTodoUiStore.getState().searchQuery).toBe('Meeting');
  });
});

