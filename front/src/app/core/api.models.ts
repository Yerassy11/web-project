export interface UserProfile {
  id: number;
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  created_at: string;
  playlist_count: number;
  frequent_songs: string[];
}

export interface TokenPair {
  refresh: string;
  access: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export interface Track {
  title: string;
  artist: string;
  audio_file: string;
  duration: number;
  genre: string;
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
