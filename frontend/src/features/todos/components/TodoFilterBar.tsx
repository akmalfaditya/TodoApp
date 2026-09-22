import React from 'react';
import { Filter, ArrowUpDown, Search } from 'lucide-react';
import { useTodoUiStore, type TodoFilter, type TodoSortBy } from '../store/todoUiStore';

export const TodoFilterBar: React.FC = () => {
  const {
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    searchQuery,
    setSearchQuery,
  } = useTodoUiStore();

  const filterOptions: { label: string; value: TodoFilter }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Aktif', value: 'active' },
    { label: 'Selesai', value: 'completed' },
  ];

  return (
    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-xs space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Search input with enterprise styling */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari tugas berdasarkan judul atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 rounded-md border border-zinc-200/80 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder-zinc-400 transition-colors"
          />
        </div>

        {/* Filter buttons & Sort controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="inline-flex rounded-md border border-zinc-200/80 bg-zinc-100/80 p-0.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                  filter === opt.value
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TodoSortBy)}
              className="text-xs font-medium border border-zinc-200/80 rounded-md px-2 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option value="createdAt">Waktu Dibuat</option>
              <option value="dueDate">Tenggat Waktu</option>
              <option value="priority">Prioritas</option>
            </select>

            <button
              type="button"
              onClick={toggleSortOrder}
              className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md border border-zinc-200/80 transition-colors cursor-pointer"
              title={`Urutan: ${sortOrder === 'asc' ? 'Menaik (Asc)' : 'Menurun (Desc)'}`}
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoFilterBar;
