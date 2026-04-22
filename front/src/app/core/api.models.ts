export interface FrequentSong {
  title: string;
  artist: string;
  duration: number;
  play_count: number;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  created_at: string;
  playlist_count: number;
  favorites_count: number;
  frequent_songs: FrequentSong[];
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
  artwork_url: string;
  audio_file: string;
  duration: number;
  genre: string;
  uploaded_by: number;
  uploaded_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface InternetSongResult {
  title: string;
  artist: string;
  preview_url: string;
  artwork_url: string;
  source: string;
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
