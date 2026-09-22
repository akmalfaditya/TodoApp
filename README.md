# Todo App — Full-Stack Learning Project

Aplikasi Todo full-stack production-grade yang dibangun menggunakan arsitektur modular modern: **Clean / Layered Architecture di backend (.NET 8)** dan **Feature-Based Architecture di frontend (React 19 + TypeScript + Tailwind CSS)**. Project ini dirancang sebagai materi referensi komprehensif bagi developer yang ingin mempelajari bagaimana membangun sistem aplikasi web enterprise secara terstruktur, teruji, dan sesuai praktik rekayasa perangkat lunak standar industri.

Fitur utama aplikasi mencakup autentikasi berbasis JWT dengan role-based authorization (`Admin` dan `User`), manajemen tugas (*Todos*) CRUD dengan pembaruan instan (*optimistic updates*), pemfilteran dan pencarian di sisi klien, serta panel administrator untuk pengelolaan pengguna, perubahan peranan, dan penguncian akun dengan pengamanan mandiri (*self-lockout prevention*).

---

## 1. Overview

TodoApp bukan sekadar aplikasi todo biasa, melainkan implementasi referensi sistem berarsitektur bersih (*Clean Architecture*) yang memisahkan tanggung jawab kode secara ketat.

### Fitur Utama
1. **Sistem Autentikasi & Otorisasi**:
   - Pendaftaran akun baru (*Register*) dan autentikasi (*Login*).
   - Penerbitan JWT Token dengan masa berlaku terkonfigurasi.
   - Otorisasi berbasis peran (*Role-Based Access Control*): `Admin` dan `User`.
   - Sesi login persisten di frontend menggunakan `localStorage` via Zustand middleware.
   - Auto-logout otomatis saat token kedaluwarsa atau tidak valid (HTTP 401).

2. **Manajemen Tugas (Todos CRUD)**:
   - Tambah tugas baru dengan judul, deskripsi, prioritas (`Low`, `Medium`, `High`), dan tenggat waktu (*due date*).
   - Toggle status selesai/belum selesai secara instan (*Optimistic UI updates*).
   - Edit detail tugas melalui modal dialog interaktif.
   - Hapus tugas dengan konfirmasi dialog.
   - Filter status (*All*, *Active*, *Completed*), pencarian teks instan, dan pengurutan (*Sort by date, priority, deadline*).
   - **Isolasi Data**: Pengguna biasa hanya dapat mengakses dan memodifikasi todo miliknya sendiri.

3. **Panel Khusus Administrator (Admin Panel)**:
   - Daftar seluruh pengguna sistem dalam format tabel responsif.
   - Peningkatan / penurunan peranan pengguna (`User` $\leftrightarrow$ `Admin`).
   - Kunci / buka kunci akses login pengguna (*Toggle Lockout*).
   - Hapus akun pengguna secara permanen beserta seluruh tugas miliknya (*Cascade Delete*).
   - **Self-Protection Guard**: Administrator yang sedang aktif tidak dapat mengubah role akunnya sendiri, mengunci dirinya sendiri, maupun menghapus akunnya sendiri.
   - **Role-Aware Visibility**: Administrator dapat melihat label pemilik tugas (`Owner: {ownerId}`) saat melihat daftar todo.

---

## 2. Tech Stack

| Layer | Teknologi / Library | Alasan & Peran dalam Arsitektur |
|---|---|---|
| **Backend Runtime** | .NET 8 (C# 12) | Performa tinggi, ekosistem type-safe enterprise, dukungan LTS, arsitektur dependensi bawaan yang matang. |
| **Backend Database** | SQLite (via EF Core) | Serverless, tanpa dependensi server eksternal, sangat portabel untuk demonstrasi dan evaluasi mandiri. |
| **Backend ORM** | Entity Framework Core 8 | Data mapping object-relational modern, abstraksi migrasi database, dan konfigurasi Fluent API yang rapi. |
| **Backend Identity & Auth**| ASP.NET Core Identity & JWT Bearer | Standar industri untuk hashing password (PBKDF2), manajemen pengguna/role, dan token otorisasi stateless. |
| **Backend Mapping** | AutoMapper 14 | Menghilangkan boilerplate pemetaan manual antara Entity basis data dan Data Transfer Object (DTO). |
| **Backend Validation** | FluentValidation | Deklarasi aturan validasi request yang ekspresif, terpisah dari model DTO, dan terisolasi dari kontroler. |
| **Backend Docs** | Swashbuckle (Swagger UI) | Dokumentasi API interaktif dengan dukungan otentikasi JWT Bearer langsung dari antarmuka browser. |
| **Backend Testing** | xUnit + Moq + EF Core InMemory | Framework pengujian unit testing standar industri untuk memvalidasi business logic dan exception handling. |
| **Frontend Runtime** | React 19 + TypeScript | Library komponen UI deklaratif dengan type-safety statis untuk mencegah bug saat runtime. |
| **Frontend Build Tool** | Vite 8 | Waktu bootstrap instan (*Hot Module Replacement*) dan proses bundler produksi yang sangat cepat via Rollup/Rolldown. |
| **Frontend Styling** | Tailwind CSS 3.4 | Utilitas styling CSS fungsional dengan design tokens yang konsisten, tanpa isolasi file CSS per komponen. |
| **Frontend Routing** | React Router DOM 7 | Routing SPA deklaratif dengan struktur nested layout dan rute terproteksi berbasis status login & role. |
| **Frontend Server State** | TanStack Query v5 (React Query) | Pengelolaan caching data server, sinkronisasi otomatis, invalidasi query, dan *optimistic updates*. |
| **Frontend UI State** | Zustand 5 | State management ringan untuk filter/sort UI dan persistensi token autentikasi ke `localStorage`. |
| **Frontend HTTP Client**| Axios 1.20 | Klien HTTP berbasis promise dengan request interceptor (injeksi Bearer token) dan response interceptor (auto-logout 401). |
| **Frontend Testing** | Vitest + Testing Library + jsdom | Lingkungan pengujian unit dan komponen React yang cepat, terintegrasi langsung dengan konfigurasi Vite. |

---

## 3. Arsitektur Backend (Layered / Clean Architecture)

Backend dibangun di folder `backend/src/` dan dipecah menjadi 4 project terpisah guna memastikan **Inward Dependency Rule** (ketergantungan hanya boleh mengarah ke dalam, tidak boleh melingkar).

```
                 ┌───────────────────────────┐
                 │       TodoApp.Api         │  (Presentation Layer: Controllers, Middleware)
                 └─────────────┬─────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│   TodoApp.Infrastructure  │         │    TodoApp.Application    │  (Use Cases, DTOs, Services)
└─────────────┬─────────────┘         └─────────────┬─────────────┘
              │                                     │
              └──────────────────┬──────────────────┘
                                 ▼
                    ┌───────────────────────────┐
                    │      TodoApp.Domain       │  (Pure POCO Entities, Interfaces)
                    └───────────────────────────┘
```

### Tanggung Jawab Tiap Project

1. **`TodoApp.Domain`** (`backend/src/TodoApp.Domain`):
   - **Tanggung Jawab**: Inti domain aplikasi. Berisi POCO Entities (`TodoItem`, `BaseEntity`), enum (`TodoPriority`), kontrak repository (`IGenericRepository<T>`, `ITodoRepository`), dan custom domain exceptions (`NotFoundException`, `ForbiddenException`, `ValidationAppException`).
   - **Aturan Ketat**: **100% Pure C#**. Tidak memiliki referensi ke NuGet eksternal dan tidak memiliki referensi ke project lain sama sekali.

2. **`TodoApp.Application`** (`backend/src/TodoApp.Application`):
   - **Tanggung Jawab**: Menampung *business logic* dan use case aplikasi. Berisi antarmuka service (`ITodoService`, `IAuthService`, `IAdminUserService`), DTOs (`CreateTodoRequestDto`, `TodoResponseDto`, dll.), validator FluentValidation, AutoMapper profiles, model hasil operasi (`ServiceResult<T>`), dan konstanta sistem (`Roles.cs`).
   - **Dependensi**: Hanya bergantung pada `TodoApp.Domain`.

3. **`TodoApp.Infrastructure`** (`backend/src/TodoApp.Infrastructure`):
   - **Tanggung Jawab**: Akses data dan implementasi teknis eksternal. Berisi `ApplicationDbContext`, konfigurasi Fluent API (`TodoItemConfiguration`), implementasi repository (`GenericRepository`, `TodoRepository`), implementasi `AuthService` dan `AdminUserService`, token generator (`JwtTokenService`), serta database seeder (`IdentitySeeder`).
   - **Dependensi**: Bergantung pada `TodoApp.Application` dan `TodoApp.Domain`.

4. **`TodoApp.Api`** (`backend/src/TodoApp.Api`):
   - **Tanggung Jawab**: Presentation Layer (REST API Controllers, ASP.NET Core Middleware, konfigurasi Swagger, CORS policy, dan Dependency Injection composition root di `Program.cs`).
   - **Dependensi**: Mengorkestrasikan `TodoApp.Application` dan `TodoApp.Infrastructure`.

---

### Alur Satu Request Nyata: `POST /api/todos`

Berikut adalah jejak eksekusi dari klien HTTP hingga basis data:

```
[Client Request] 
      │  POST /api/todos  (Header: Authorization: Bearer {token})
      ▼
[Kestrel & Middleware Pipeline]
      │  1. ExceptionHandlingMiddleware (siap menangkap unhandled exception)
      │  2. UseRouting & UseCors ("AllowFrontend")
      │  3. UseAuthentication (Memvalidasi signature & expiry JWT token)
      │  4. UseAuthorization (Memeriksa klaim pengguna)
      ▼
[TodosController.Create]
      │  Ekstrak CurrentUserId dari claim (ClaimTypes.NameIdentifier / "sub")
      │  Panggil _todoService.CreateAsync(dto, CurrentUserId)
      ▼
[TodoService.CreateAsync]
      │  1. Jalankan FluentValidation: CreateTodoRequestDtoValidator
      │     (Jika gagal: return ServiceResult.ValidationFailure)
      │  2. Mapping DTO -> Entity: _mapper.Map<TodoItem>(dto)
      │  3. Set properti server: todo.OwnerId = currentUserId; todo.CreatedAt = DateTime.UtcNow;
      │  4. Panggil _todoRepository.AddAsync(todo)
      ▼
[TodoRepository & ApplicationDbContext]
      │  EF Core menambahkan entitas ke DbSet<TodoItem>
      │  await _context.SaveChangesAsync() -> Dieksekusi sebagai SQL INSERT ke tabel TodoItems di SQLite
      ▼
[TodoService (Return Flow)]
      │  Mapping Entity -> Response DTO: _mapper.Map<TodoResponseDto>(todo)
      │  Log event secara terstruktur: _logger.LogInformation(...)
      │  Return ServiceResult<TodoResponseDto>.Success(dto)
      ▼
[ApiControllerBase.HandleResult]
      │  Mengecek result.IsSuccess == true
      │  Mengembalikan StatusCode(201, result.Data)
      ▼
[HTTP Response 201 Created] (Body: JSON TodoResponseDto)
```

---

### Pola Desain Backend yang Digunakan

#### 1. Service Result Pattern (`ServiceResult<T>`)
Daripada menggunakan exception untuk alur bisnis normal (yang membebani alokasi memori stack-trace dan membuat alur kode sulit diprediksi), service mengembalikan objek `ServiceResult<T>`:

```csharp
// TodoApp.Application/Common/Models/ServiceResult.cs
public class ServiceResult<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? ErrorMessage { get; private set; }
    public ServiceErrorType ErrorType { get; private set; }
    public List<string> ValidationErrors { get; private set; } = new();

    public static ServiceResult<T> Success(T data) => new() { IsSuccess = true, Data = data };
    public static ServiceResult<T> NotFound(string message) => Failure(message, ServiceErrorType.NotFound);
    public static ServiceResult<T> Forbidden(string message) => Failure(message, ServiceErrorType.Forbidden);
    public static ServiceResult<T> ValidationFailure(List<string> errors) => new() { ... };
}
```

Di kontroler, fungsi helper `HandleResult` pada `ApiControllerBase` secara otomatis memetakan tipe error ini ke HTTP Status Code yang benar:
- `IsSuccess == true` $\rightarrow$ `HTTP 200 OK` atau `HTTP 201 Created`
- `ServiceErrorType.NotFound` $\rightarrow$ `HTTP 404 Not Found`
- `ServiceErrorType.Forbidden` $\rightarrow$ `HTTP 403 Forbidden`
- `ServiceErrorType.Validation` $\rightarrow$ `HTTP 400 Bad Request` (`errors: [...]`)
- `ServiceErrorType.Unauthorized` $\rightarrow$ `HTTP 401 Unauthorized`

#### 2. Repository & Generic Repository Pattern
Service tidak berinteraksi langsung dengan `ApplicationDbContext`. Mengapa?
- **Pemisahan Kepedulian**: Logika bisnis pada Service tidak terikat pada dialek query EF Core.
- **Kemudahan Pengujian (Testability)**: Service dapat diuji menggunakan unit test dengan mocking `ITodoRepository` tanpa harus membuat in-memory database EF Core.
- **Pencegahan Kebocoran Abstraksi**: Operasi query spesifik terisolasi di `TodoRepository`.

#### 3. AutoMapper 14
Profil pemetaan dikelompokkan berdasarkan modul fitur:
- Definisi: `TodoApp.Application/Features/Todos/Mappings/TodoMappingProfile.cs`
- Pendaftaran: Didaftarkan secara otomatis melalui assembly scanning di `DependencyInjection.cs`:
  ```csharp
  services.AddAutoMapper(typeof(MappingProfile).Assembly);
  ```
- Eksekusi: Disuntikkan via dependency injection (`IMapper`) ke service.

#### 4. FluentValidation
Validasi request dibuat deklaratif terpisah dari DTO:
- File: `TodoApp.Application/Features/Todos/Validators/CreateTodoRequestDtoValidator.cs`
  ```csharp
  public class CreateTodoRequestDtoValidator : AbstractValidator<CreateTodoRequestDto>
  {
      public CreateTodoRequestDtoValidator()
      {
          RuleFor(x => x.Title)
              .NotEmpty().WithMessage("Title wajib diisi.")
              .MaximumLength(200).WithMessage("Title maksimal 200 karakter.");

          RuleFor(x => x.DueDate)
              .Must(date => !date.HasValue || date.Value.Date >= DateTime.UtcNow.Date)
              .WithMessage("DueDate tidak boleh di masa lalu.")
              .When(x => x.DueDate.HasValue);
      }
  }
  ```
- Otomatis discan dan didaftarkan menggunakan `services.AddValidatorsFromAssembly(assembly)`.

#### 5. Fluent API (EF Core Configuration)
Seluruh aturan mapping entitas ke tabel database dipisahkan ke dalam class konfigurasi `IEntityTypeConfiguration<T>` di layer Infrastructure, tanpa mengotori domain entity dengan data annotation:
- File: `TodoApp.Infrastructure/Persistence/Configurations/TodoItemConfiguration.cs`
  ```csharp
  public class TodoItemConfiguration : IEntityTypeConfiguration<TodoItem>
  {
      public void Configure(EntityTypeBuilder<TodoItem> builder)
      {
          builder.ToTable("TodoItems");
          builder.HasKey(t => t.Id);
          builder.Property(t => t.Title).IsRequired().HasMaxLength(200);
          builder.Property(t => t.Priority).HasConversion<string>().HasMaxLength(20);
          builder.HasIndex(t => t.OwnerId);
          builder.HasOne<ApplicationUser>()
                 .WithMany()
                 .HasForeignKey(t => t.OwnerId)
                 .OnDelete(DeleteBehavior.Cascade);
      }
  }
  ```
- Keunggulan: Domain entity `TodoItem` tetap berupa pure C# POCO, mendukung konversi tipe enum ke string basis data, dan konfigurasi relasi cascade delete tersentralisasi.

#### 6. Autentikasi & Otorisasi Bertingkat
- **Otorisasi Level-Endpoint**: Menggunakan atribut deklaratif `[Authorize]` dan `[Authorize(Roles = Roles.Admin)]`. Dilakukan oleh middleware sebelum request mencapai method controller.
- **Otorisasi Level-Data (Resource Ownership)**: Diimplementasikan di dalam `TodoService`:
  ```csharp
  if (!isAdmin && todo.OwnerId != currentUserId)
  {
      return ServiceResult<TodoResponseDto>.Forbidden("Anda tidak memiliki akses ke todo ini.");
  }
  ```
  Pengguna dengan role `User` hanya bisa melihat dan memodifikasi data miliknya sendiri. Pengguna dengan role `Admin` memiliki privilege untuk melihat dan mengelola seluruh data.

---

## 4. Arsitektur Frontend

Frontend di folder `frontend/src/` mengadopsi pendekatan **Feature-Based Architecture**:

```
frontend/src/
├── api/                # Konfigurasi klien Axios dan interceptor global
├── components/
│   ├── layout/         # Layout aplikasi (AppLayout dengan navbar, AuthLayout)
│   └── ui/             # Mini Design System (Button, Input, Card, Spinner, Modal, Toast)
├── features/
│   ├── auth/           # Modul Autentikasi: api, hooks, pages (Login, Register)
│   ├── todos/          # Modul Todos: api, hooks, store, components, pages
│   └── admin/          # Modul Admin: api, hooks, components (UserTable), pages
├── routes/             # Definisi AppRouter dan komponen ProtectedRoute
├── stores/             # Global persistent authStore (Zustand)
├── styles/             # Tailwind CSS entry (index.css)
└── types/              # TypeScript interface DTO sinkron dengan backend
```

Filosofi struktur ini: semua kode yang berubah bersama ditempatkan bersama (*colocation*). Modul `features/todos` berisi API, hook, store lokal, dan komponen spesifik Todo, sehingga modular dan mudah dipelihara.

---

### State Management: Server State vs UI State

Pemisahan tanggung jawab state management adalah salah satu konsep terpenting dalam arsitektur frontend modern:

| Kategori State | Library | Contoh Nyata di Repo | Mengapa Dipisah? |
|---|---|---|---|
| **Server State** | **TanStack Query** | `['todos']` di `useTodos.ts`, `['admin-users']` di `useAdminUsers.ts` | Data ini dimiliki oleh server, bersifat asinkron, perlu strategi caching, deduplikasi request, invalidasi otomatis, dan penanganan status loading/error. |
| **UI State (Lokal)** | **Zustand** | `filter`, `sortBy`, `searchQuery` di `todoUiStore.ts` | Data ini hanya relevan di browser klien saat ini, bersifat sinkron, tidak memerlukan round-trip network ke server saat berubah. |
| **Global Persistent State**| **Zustand + Persist**| `token`, `user` di `authStore.ts` | Data sesi login yang perlu dibaca dari komponen mana pun dan harus bertahan setelah pengguna me-refresh halaman (F5) via `localStorage`. |

#### Cara Kerja TanStack Query (Optimistic Updates)
Contoh nyata implementasi penambahan tugas di `src/features/todos/hooks/useTodos.ts`:

```typescript
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTodoPayload) => createTodo(payload),
    // 1. Dijalankan sebelum request HTTP dikirim ke backend
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Buat entri lokal sementara
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

      // Perbarui cache secara instan di UI
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [optimisticTodo, ...old]);

      // Kembalikan snapshot untuk rollback jika gagal
      return { previousTodos };
    },
    // 2. Jika network error / backend menolak: rollback ke data semula
    onError: (_err, _newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },
    // 3. Setelah selesai (berhasil/gagal): refetch data asli dari server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};
```

---

### Routing & Route Protection

Routing diatur menggunakan `createBrowserRouter` di `src/routes/AppRouter.tsx`:
- **Grup Publik (`AuthLayout`)**: `/login` dan `/register` (Centered card tanpa navbar).
- **Grup Terproteksi (`AppLayout` dibungkus `ProtectedRoute`)**:
  - `/` $\rightarrow$ `TodosPage` (Bisa diakses oleh `User` dan `Admin`).
  - `/admin/users` $\rightarrow$ Dibungkus lagi dengan `<ProtectedRoute requiredRole="Admin">` $\rightarrow$ `AdminUsersPage`.
- **Catch-all**: `*` $\rightarrow$ `NotFoundPage` (404).

#### Logika `ProtectedRoute.tsx`
1. Jika `!isAuthenticated()` $\rightarrow$ Redirect ke `/login` (menyimpan URL asal di `location.state.from` agar dapat kembali setelah login).
2. Jika `requiredRole` diisi dan user tidak memilikinya $\rightarrow$ Redirect ke `/` (beranda). **Catatan Penting**: Pengguna biasa tidak diarahkan ke 404 agar sistem tidak membocorkan informasi keberadaan rute admin.
3. Jika lolos $\rightarrow$ Me-render `children` atau `<Outlet />`.

> **Prinsip Keamanan**: Role-based routing di frontend adalah **User Experience (UX)** agar antarmuka rapi dan relevan. Pertahanan keamanan sesungguhnya **selalu berada di backend** melalui atribut `[Authorize(Roles = "Admin")]`.

---

### Alur Data Lengkap: Penambahan Todo Baru

```
1. [User Interaction] 
   Pengguna mengetik judul & memilih prioritas di TodoForm.tsx, lalu menekan tombol "Simpan Tugas".
2. [Mutation Trigger] 
   Form memanggil useCreateTodo().mutateAsync(payload).
3. [Optimistic Cache Update] 
   React Query menjalankan onMutate:
   - Menghentikan refetch aktif.
   - Menyimpan snapshot cache saat ini.
   - Menambahkan todo baru langsung ke cache ['todos'] dengan ID sementara.
   - TodoItem baru langsung muncul di layar tanpa menunggu respons server.
4. [HTTP Request] 
   Axios mengirim POST /api/todos.
   Request Interceptor otomatis mengambil token JWT dari authStore dan menyisipkan:
   Authorization: Bearer eyJhbGciOi...
5. [Server Processing & Settlement]
   - Jika Berhasil: Server mengembalikan 201 Created dengan entity asli dari database.
     onSettled menginvalidasi query ['todos'] untuk menyinkronkan ID dan metadata server.
   - Jika Gagal: onError mengembalikan isi cache ke snapshot previousTodos. 
     UI menampilkan pesan error.
```

---

## 5. Role & Permission Matrix

| Fitur / Tindakan | Endpoint Backend | Akses Publik | Role `User` | Role `Admin` | Keterangan |
|---|---|:---:|:---:|:---:|---|
| **Pendaftaran Akun** | `POST /api/auth/register` | ✅ | ✅ | ✅ | Terbuka untuk umum |
| **Masuk Sistem (Login)** | `POST /api/auth/login` | ✅ | ✅ | ✅ | Menghasilkan JWT token |
| **Lihat Profil Diri** | `GET /api/auth/me` | ❌ | ✅ | ✅ | Membaca klaim dari token aktif |
| **Lihat Daftar Todo** | `GET /api/todos` | ❌ | ✅ (Milik sendiri) | ✅ (Semua todo) | Backend memfilter otomatis |
| **Lihat Detail Todo** | `GET /api/todos/{id}` | ❌ | ✅ (Milik sendiri) | ✅ (Semua todo) | 403 Forbidden jika bukan miliknya |
| **Tambah Todo Baru** | `POST /api/todos` | ❌ | ✅ | ✅ | OwnerId diikat otomatis ke token |
| **Edit Todo** | `PUT /api/todos/{id}` | ❌ | ✅ (Milik sendiri) | ✅ (Semua todo) | 403 Forbidden jika bukan miliknya |
| **Toggle Status Todo** | `PATCH /api/todos/{id}/complete`| ❌ | ✅ (Milik sendiri) | ✅ (Semua todo) | 403 Forbidden jika bukan miliknya |
| **Hapus Todo** | `DELETE /api/todos/{id}` | ❌ | ✅ (Milik sendiri) | ✅ (Semua todo) | 403 Forbidden jika bukan miliknya |
| **Lihat Daftar Pengguna**| `GET /api/admin/users` | ❌ | ❌ | ✅ | Khusus administrator |
| **Lihat Detail Pengguna**| `GET /api/admin/users/{id}` | ❌ | ❌ | ✅ | Khusus administrator |
| **Ubah Peran Pengguna** | `PUT /api/admin/users/{id}/role`| ❌ | ❌ | ✅ | Tidak bisa ubah akun sendiri |
| **Kunci Akun Pengguna** | `PATCH /api/admin/users/{id}/toggle-lock`| ❌ | ❌ | ✅ | Tidak bisa kunci akun sendiri |
| **Hapus Pengguna** | `DELETE /api/admin/users/{id}` | ❌ | ❌ | ✅ | Tidak bisa hapus akun sendiri |

---

## 6. Cara Menjalankan Project

### Prasyarat
- **.NET 8 SDK** terpasang (`dotnet --version` $\ge$ 8.0).
- **Node.js** terpasang (`node -v` $\ge$ 20.0).
- **EF Core CLI tool** terpasang secara global:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

---

### Menjalankan Backend

1. Buka terminal di folder root repository, lalu masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Pulihkan dependensi NuGet:
   ```bash
   dotnet restore
   ```
3. (Opsional/Disarankan) Atur JWT Key via .NET Secret Manager untuk keamanan development:
   ```bash
   cd src/TodoApp.Api
   dotnet user-secrets init
   dotnet user-secrets set "Jwt:Key" "KunciRahasiaKustomYangSangatAmanDanPanjang32Karakter!"
   cd ../..
   ```
4. Jalankan migrasi database EF Core (SQLite basis data `TodoApp.db` akan dibuat secara otomatis):
   ```bash
   dotnet ef database update --project src/TodoApp.Infrastructure --startup-project src/TodoApp.Api
   ```
5. Jalankan backend API:
   ```bash
   dotnet run --project src/TodoApp.Api --launch-profile http
   ```
   - REST API aktif di: `http://localhost:5056`
   - Dokumentasi Swagger UI: `http://localhost:5056/swagger`
   - Endpoint Health Check: `http://localhost:5056/health`

---

### Menjalankan Frontend

1. Buka terminal baru di folder root repository, lalu masuk ke folder frontend:
   ```bash
   cd frontend
   ```
2. Pasang dependensi npm:
   ```bash
   npm install
   ```
3. Pastikan konfigurasi environment sudah sesuai:
   File `.env` sudah dikonfigurasi mengarah ke backend:
   ```env
   VITE_API_BASE_URL=http://localhost:5056/api
   ```
4. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
   - Buka browser di: `http://localhost:5173`

---

### Menjalankan Seluruh Pengujian Otomatis (Testing)

Untuk memastikan integritas seluruh kode backend dan frontend:

```bash
# 1. Menjalankan 20 unit tests backend (.NET xUnit)
dotnet test backend/TodoApp.sln

# 2. Menjalankan 34 unit & component tests frontend (Vitest)
cd frontend
npm test

# 3. Menjalankan kompilasi & build produksi frontend
npm run build
```

---

### Akun Bawaan Seeder (*Default Seed Accounts*)

Database seeder (`IdentitySeeder.cs`) secara otomatis mengisi akun pengujian berikut saat aplikasi pertama kali dijalankan:

| Role | Nama Lengkap | Email | Password Bawaan |
|---|---|---|---|
| **Admin** | Administrator | `admin@todoapp.local` | `Admin@12345` |
| **User** | John Doe | `john.doe@todoapp.local` | `User@12345` |
| **User** | Jane Smith | `jane.smith@todoapp.local` | `User@12345` |

---

## 7. Struktur Folder Lengkap

```
TodoApp/
├── backend/
│   ├── src/
│   │   ├── TodoApp.Domain/                 # [Domain Layer]
│   │   │   ├── Entities/                   # TodoItem.cs, BaseEntity.cs
│   │   │   ├── Enums/                      # TodoPriority.cs
│   │   │   ├── Exceptions/                 # NotFoundException, ForbiddenException, dll.
│   │   │   └── Interfaces/                 # IGenericRepository.cs, ITodoRepository.cs
│   │   ├── TodoApp.Application/            # [Application Layer]
│   │   │   ├── Common/                     # Constants (Roles), Models (ServiceResult), Mappings
│   │   │   ├── Features/
│   │   │   │   ├── Auth/                   # Dtos, IAuthService.cs
│   │   │   │   ├── Todos/                  # Dtos, Validators, ITodoService.cs, TodoService.cs
│   │   │   │   └── Admin/                  # Dtos, Validators, IAdminUserService.cs
│   │   │   └── Identity/                   # ApplicationUser.cs, IJwtTokenService.cs
│   │   ├── TodoApp.Infrastructure/         # [Infrastructure Layer]
│   │   │   ├── Identity/                   # JwtTokenService.cs
│   │   │   ├── Persistence/
│   │   │   │   ├── ApplicationDbContext.cs
│   │   │   │   ├── Configurations/         # TodoItemConfiguration.cs (Fluent API)
│   │   │   │   ├── Repositories/           # GenericRepository.cs, TodoRepository.cs
│   │   │   │   └── Seed/                   # IdentitySeeder.cs
│   │   │   └── Services/                   # AuthService.cs, AdminUserService.cs
│   │   └── TodoApp.Api/                    # [Presentation Layer]
│   │       ├── Controllers/                # AuthController, TodosController, AdminUsersController
│   │       ├── Middleware/                 # ExceptionHandlingMiddleware.cs
│   │       ├── Program.cs                  # DI Root, Pipeline Configuration
│   │       └── appsettings.json
│   └── tests/
│       └── TodoApp.UnitTests/              # 20 Unit Tests (Domain, Admin, Todos, Middleware)
│
├── frontend/
│   ├── src/
│   │   ├── api/                            # client.ts (Axios + Interceptors)
│   │   ├── components/
│   │   │   ├── layout/                     # AppLayout.tsx, AuthLayout.tsx
│   │   │   └── ui/                         # Button, Input, Card, Spinner, ConfirmDialog, Toast
│   │   ├── features/
│   │   │   ├── auth/                       # api.ts, useAuth.ts, LoginPage, RegisterPage
│   │   │   ├── todos/                      # api.ts, useTodos.ts, todoUiStore.ts, TodoList, TodoItem, TodoForm
│   │   │   └── admin/                      # api.ts, useAdminUsers.ts, UserTable, AdminUsersPage
│   │   ├── lib/                            # queryClient.ts (TanStack Query client)
│   │   ├── routes/                         # AppRouter.tsx, ProtectedRoute.tsx, NotFoundPage.tsx
│   │   ├── stores/                         # authStore.ts (Zustand + Persist)
│   │   ├── styles/                         # index.css (Tailwind directives)
│   │   ├── types/                          # auth.ts, todo.ts, admin.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── .env
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json                        # 34 Vitest Component & Unit Tests
└── README.md
```

---

## 8. Keterbatasan & Pengembangan Lanjutan

Aplikasi ini sengaja menyederhanakan beberapa aspek infrastruktur guna memusatkan fokus pembelajaran pada pola arsitektur inti. Berikut adalah trade-off yang disadari beserta arah peningkatan untuk level production skala besar:

1. **Refresh Token**:
   - *Kondisi Saat Ini*: Autentikasi menggunakan access token tunggal dengan masa kedaluwarsa tetap (default 60 menit). Pengguna harus login ulang saat token habis.
   - *Pengembangan Lanjutan*: Menerapkan sistem Refresh Token berbasis rotasi token (*sliding expiration*) yang disimpan dalam `HttpOnly, Secure Cookie` untuk mencegah serangan XSS.

2. **Paginasi di Sisi Server (Server-Side Pagination)**:
   - *Kondisi Saat Ini*: Data Todo dan User dimuat seluruhnya sekaligus, lalu difilter dan diurutkan di sisi klien (*client-side filtering*). Pendekatan ini sangat cepat dan ideal untuk dataset puluhan hingga ratusan entri.
   - *Pengembangan Lanjutan*: Menambahkan query parameter `?pageNumber=1&pageSize=20` pada endpoint backend serta integrasi `useInfiniteQuery` pada TanStack Query untuk menangani jutaan baris data.

3. **Rate Limiting & Throttling**:
   - *Kondisi Saat Ini*: Belum ada pembatasan frekuensi request per IP.
   - *Pengembangan Lanjutan*: Menambahkan middleware rate limiting bawaan .NET 8 (`AddRateLimiter`) untuk melindungi endpoint `/api/auth/login` dari serangan *brute force*.

4. **Kontainerisasi (Docker)**:
   - *Kondisi Saat Ini*: Aplikasi dijalankan langsung via SDK lokal (`dotnet run` dan `npm run dev`).
   - *Pengembangan Lanjutan*: Menyediakan `Dockerfile` multi-stage build untuk API dan SPA frontend, beserta file `docker-compose.yml` untuk orkestrasinya.

---

## 9. Codebase Knowledge Base & Machine Reference
Repositori ini dilengkapi dengan basis pengetahuan mendalam (*Repository Knowledge Base*) yang dikelola melalui skill `knowledgecache` di folder `.agent/knowledge/`. Basis pengetahuan ini mencakup 12 dokumen referensi teknis yang detail untuk setiap aspek sistem:
- **Pintu Masuk Utama**: [.agent/knowledge/codebase-map.md](.agent/knowledge/codebase-map.md)
- **Modul Deep-Dive**: Dependencies ([01](.agent/knowledge/deep-dive/01-tech-stack.md)), Arsitektur & Request Lifecycle ([02](.agent/knowledge/deep-dive/02-architecture.md)), Directory Map ([03](.agent/knowledge/deep-dive/03-directory-structure.md)), Data Model & ER Diagram ([04](.agent/knowledge/deep-dive/04-data-model.md)), API Contracts ([05](.agent/knowledge/deep-dive/05-api-contracts.md)), Frontend Inventory ([06](.agent/knowledge/deep-dive/06-frontend-inventory.md)), Conventions ([07](.agent/knowledge/deep-dive/07-conventions.md)), Business Rules ([08](.agent/knowledge/deep-dive/08-business-rules.md)), Test Coverage Map ([09](.agent/knowledge/deep-dive/09-test-coverage-map.md)), Konfigurasi & Environment ([10](.agent/knowledge/deep-dive/10-config-and-environments.md)), Technical Debt Register ([11](.agent/knowledge/deep-dive/11-technical-debt-register.md)), dan Glossary ([12](.agent/knowledge/deep-dive/12-glossary.md)).

---

## 10. Lisensi
Project ini dibuat untuk tujuan edukasi dan pembelajaran pola arsitektur Clean Architecture serta React modern. Bebas digunakan dan dimodifikasi untuk pengembangan pribadi.

