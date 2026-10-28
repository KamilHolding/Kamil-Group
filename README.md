# Kamil Group Hub

Aplikasi PWA untuk mengelola link aplikasi seluruh perusahaan dalam satu tempat.
Struktur data: **Perusahaan → Divisi → Aplikasi (link)**. Satu divisi boleh punya banyak aplikasi.

Teknologi: HTML/JS murni (tanpa build), Firebase Auth + Firestore + Storage, di-host di GitHub Pages.

## Isi folder
```
icons/              ikon PWA & logo
.nojekyll           agar GitHub Pages tidak memproses file lewat Jekyll
index.html          seluruh aplikasi (config Firebase ada di dalamnya)
manifest.json       pengaturan PWA
service-worker.js   cache agar cepat dibuka
```

## Langkah setup

### 1. Firebase Authentication
Console → Build → Authentication → Sign-in method → aktifkan **Email/Password** (dan **Google** jika ingin).

### 2. Firestore Rules
Console → Firestore Database → Rules → ganti isinya dengan ini lalu **Publish**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function role() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function hasUser() {
      return signedIn() && exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }
    function isAdmin()  { return hasUser() && role() == 'admin'; }
    function isMember() { return hasUser() && role() in ['member', 'admin']; }

    match /users/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if signedIn() && request.auth.uid == uid
                    && request.resource.data.role == 'pending'
                    && request.resource.data.keys().hasOnly(['email','name','role','createdAt']);
      allow update, delete: if isAdmin();
    }
    match /companies/{id} { allow read: if isMember(); allow write: if isAdmin(); }
    match /apps/{id}      { allow read: if isMember(); allow write: if isAdmin(); }
  }
}
```

### 3. Storage Rules (untuk upload logo perusahaan, opsional)
Console → Storage → Get started → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin'
        && request.resource.size < 2 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```
Jika Storage belum bisa diaktifkan, kolom "URL logo" di form perusahaan tetap bisa dipakai.

### 4. Authorized domains
Authentication → Settings → Authorized domains → **Add domain**: `USERNAME.github.io`
(tanpa ini login akan gagal dengan error "unauthorized domain").

### 5. Upload ke GitHub
Upload semua isi folder ini ke repository (bukan folder pembungkusnya), lalu
Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
Alamat: `https://USERNAME.github.io/NAMA-REPO/`

### 6. Jadikan akun pertama sebagai Admin
1. Buka aplikasi, daftar dengan email Anda (status awal: *Menunggu persetujuan*).
2. Firebase Console → Firestore → koleksi `users` → dokumen milik Anda → ubah field `role` menjadi `admin`.
3. Refresh aplikasi. Menu pojok kanan atas sekarang punya **Mode kelola** dan **Kelola pengguna**.

Selanjutnya, pengguna baru yang mendaftar akan muncul di *Kelola pengguna*; ubah perannya ke **Anggota** atau **Admin**.

## Peran
| Peran | Bisa lihat link | Bisa tambah/ubah/hapus | Kelola pengguna |
|---|---|---|---|
| Menunggu | tidak | tidak | tidak |
| Anggota | ya | tidak | tidak |
| Admin | ya | ya | ya |

## Catatan
- `apiKey` Firebase di `index.html` memang publik; keamanan data dijaga oleh Rules di atas.
- Setelah mengubah file, naikkan `V` di `service-worker.js` agar pengguna menerima versi baru.
