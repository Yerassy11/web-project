export interface UserProfile {
  id: number;
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  created_at: string;
}

export interface TokenPair {
  refresh: string;
  access: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  cover_image: string | null;
  release_year: number;
  uploaded_by: number;
  uploaded_by_username: string;
  track_count: number;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: number;
  title: string;
  artist: string;
  audio_file: string;
  duration: number;
  genre: string;
  album: number | null;
  album_title: string | null;
  uploaded_by: number;
  uploaded_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  owner: number;
  owner_username: string;
  track_count: number;
  tracks: Track[];
  created_at: string;
  updated_at: string;
}
