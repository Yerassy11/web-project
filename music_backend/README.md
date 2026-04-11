#  Music Backend — Django + DRF

A RESTful API backend for a Spotify-like music web app, built with Django, Django REST Framework, PostgreSQL, and JWT authentication.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Django 4.2 + Django REST Framework  |
| Database       | PostgreSQL                          |
| Auth           | JWT via `djangorestframework-simplejwt` |
| File uploads   | Django `FileField` / `ImageField`   |
| CORS           | `django-cors-headers`               |

---

## Project Structure

```
music_backend/
├── music_backend/        ← Django project (settings, urls, wsgi)
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/                ← Custom user model, register, login, logout, profile
│   ├── models.py         (Model 1: User + custom UserManager)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── music/                ← Albums and Tracks
│   ├── models.py         (Model 2: Album, Model 3: Track)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── playlists/            ← User playlists
│   ├── models.py         (Model 4: Playlist + PlaylistTrack through model)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── manage.py
├── requirements.txt
├── .env.example
└── music_backend_postman.json
```

---

## Requirements Checklist

| Requirement                                      | Where                                                            |
|--------------------------------------------------|------------------------------------------------------------------|
| ≥ 4 models                                       | `User`, `Album`, `Track`, `Playlist` (+`PlaylistTrack` through)  |
| 1 custom model manager                           | `UserManager` in `users/models.py`                               |
| ≥ 2 ForeignKey relationships                     | `Track→Album`, `Track→User`, `Album→User`, `Playlist→User`       |
| ≥ 2 `serializers.Serializer`                     | `RegisterSerializer`, `LoginSerializer`, `TrackUploadSerializer`, `AlbumCreateSerializer`, `AddTrackSerializer` |
| ≥ 2 `serializers.ModelSerializer`                | `UserSerializer`, `UserUpdateSerializer`, `TrackSerializer`, `AlbumSerializer`, `PlaylistSerializer`, `PlaylistWriteSerializer` |
| ≥ 2 FBV with DRF decorators                      | `register_view`, `login_view`, `track_list_create`, `track_detail`, `playlist_add_track`, `playlist_remove_track` |
| ≥ 2 CBV with `APIView`                           | `LogoutView`, `MeView`, `AlbumListCreateView`, `AlbumDetailView`, `PlaylistListCreateView`, `PlaylistDetailView` |
| Token-based auth (login + logout)                | `POST /api/v1/auth/login/`, `POST /api/v1/auth/logout/`          |
| Full CRUD for ≥ 1 model                          | **Track** (list, create, retrieve, update, delete) via FBV       |
| Objects linked to `request.user` on create       | Albums, Tracks, Playlists all set `uploaded_by`/`owner`          |
| CORS for Angular dev server                      | `django-cors-headers`, configured in `settings.py`               |
| Postman collection                               | `music_backend_postman.json`                                     |

---

## Setup

### 1. Clone & create virtual environment

```bash
git clone <your-repo-url>
cd music_backend

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set your DB credentials and SECRET_KEY
```

### 4. Create PostgreSQL database

```bash
psql -U postgres
CREATE DATABASE music_db;
\q
```

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Create superuser (optional, for /admin)

```bash
python manage.py createsuperuser
```

### 7. Start the development server

```bash
python manage.py runserver
```

API is now available at **http://localhost:8000/api/v1/**

---

## API Endpoints

### Auth — `/api/v1/auth/`

| Method | Endpoint          | Auth     | Description                    |
|--------|-------------------|----------|--------------------------------|
| POST   | `register/`       | Public   | Create account, returns tokens |
| POST   | `login/`          | Public   | Login, returns tokens          |
| POST   | `logout/`         | Required | Blacklist refresh token        |
| GET    | `me/`             | Required | Get own profile                |
| PATCH  | `me/`             | Required | Update own profile             |
| POST   | `token/refresh/`  | Public   | Get new access token           |

### Music — `/api/v1/music/`

| Method | Endpoint          | Auth         | Description              |
|--------|-------------------|--------------|--------------------------|
| GET    | `albums/`         | Public       | List all albums          |
| POST   | `albums/`         | Required     | Create album             |
| GET    | `albums/<id>/`    | Public       | Get album + its tracks   |
| PUT    | `albums/<id>/`    | Owner only   | Full update              |
| PATCH  | `albums/<id>/`    | Owner only   | Partial update           |
| DELETE | `albums/<id>/`    | Owner only   | Delete album             |
| GET    | `tracks/`         | Public       | List all tracks          |
| POST   | `tracks/`         | Required     | Upload track (multipart) |
| GET    | `tracks/<id>/`    | Required     | Get track                |
| PUT    | `tracks/<id>/`    | Owner only   | Full update              |
| PATCH  | `tracks/<id>/`    | Owner only   | Partial update           |
| DELETE | `tracks/<id>/`    | Owner only   | Delete track             |

### Playlists — `/api/v1/playlists/`

| Method | Endpoint                           | Auth       | Description                   |
|--------|------------------------------------|------------|-------------------------------|
| GET    | `/`                                | Optional   | List playlists                |
| POST   | `/`                                | Required   | Create playlist               |
| GET    | `<id>/`                            | Optional   | Get playlist + tracks         |
| PATCH  | `<id>/`                            | Owner only | Update playlist               |
| DELETE | `<id>/`                            | Owner only | Delete playlist               |
| POST   | `<id>/tracks/add/`                 | Owner only | Add track to playlist         |
| DELETE | `<id>/tracks/<track_id>/remove/`   | Owner only | Remove track from playlist    |

---

## Authentication

All protected endpoints require the header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `/api/v1/auth/login/` or `/api/v1/auth/register/`.  
Access tokens expire in **2 hours**. Use `/api/v1/auth/token/refresh/` with the refresh token to get a new one.

---

## Postman Collection

Import `music_backend_postman.json` into Postman.

The **Login** request has a test script that automatically saves `access` and `refresh` tokens to collection variables — so all other requests work immediately after logging in.
