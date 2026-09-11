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
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tugas berdasarkan judul atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Filter buttons & Sort controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter tabs */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filter === opt.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TodoSortBy)}
              className="text-xs font-medium border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Waktu Dibuat</option>
              <option value="dueDate">Tenggat Waktu</option>
              <option value="priority">Prioritas</option>
            </select>

            <button
              type="button"
              onClick={toggleSortOrder}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              title={`Urutan: ${sortOrder === 'asc' ? 'Menaik (Asc)' : 'Menurun (Desc)'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoFilterBar;

