export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface Artist {
  id: number;
  name: string;
  bio: string;
}

export interface Track {
  id: number;
  title: string;
  artist: number;
  artist_name: string;
  audio_url: string;
  duration_seconds: number;
  genre: string;
  likes_count: number;
}

export interface Playlist {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  user: number;
  tracks: Track[];
  created_at: string;
}
