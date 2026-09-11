import { useState } from 'react';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Card } from './components/ui/Card';
import { Spinner } from './components/ui/Spinner';
import { CheckCircle2, ListTodo } from 'lucide-react';

export function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-sm">
            <ListTodo className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            TodoApp Frontend
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Vite + React + TypeScript + Tailwind CSS Setup (Spec 09)
          </p>
        </header>

        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              UI Components Verification
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Live Spinner:</span>
              <Spinner size="sm" className="text-blue-600" />
            </div>
          </div>

          {/* Input section */}
          <div className="space-y-4">
            <Input
              label="Task Title"
              placeholder="e.g. Selesaikan dokumentasi API"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Ketikkan judul tugas di sini"
            />

            <Input
              label="Invalid Input Test"
              defaultValue="Invalid value"
              error="Judul task tidak boleh kosong atau lebih dari 200 karakter."
            />
          </div>

          {/* Button section */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-gray-700">
              Button Variants & Loading State
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 2000);
                }}
              >
                Primary Button
              </Button>

              <Button variant="secondary">
                Secondary Button
              </Button>

              <Button variant="danger">
                Danger Button
              </Button>

              <Button
                variant="primary"
                isLoading={isLoading}
                onClick={() => setIsLoading(!isLoading)}
              >
                {isLoading ? 'Processing...' : 'Click for Loading'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
