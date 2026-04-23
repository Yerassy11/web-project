import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { AuthPageComponent } from './pages/auth-page.component';
import { TracksPageComponent } from './pages/tracks-page.component';
import { PlaylistsPageComponent } from './pages/playlists-page.component';
import { PlaylistDetailPageComponent } from './pages/playlist-detail-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';
import { SearchPageComponent } from './pages/search-page.component';
import { SongPageComponent } from './pages/song-page.component';
import { RecommendationsPageComponent } from './pages/recommendations-page.component';
import { GenreDetailsPageComponent } from './pages/genre-details-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'Shumaq - Home' },
  { path: 'auth', component: AuthPageComponent, title: 'Shumaq - Auth' },
  { path: 'favsongs', component: TracksPageComponent, title: 'Shumaq - Favorite Songs' },
  { path: 'playlists', component: PlaylistsPageComponent, title: 'Shumaq - Playlists' },
  { path: 'playlists/:id', component: PlaylistDetailPageComponent, title: 'Shumaq - Playlist Details' },
  { path: 'song/:title', component: SongPageComponent, title: 'Shumaq - Song' },
  { path: 'search', component: SearchPageComponent, title: 'Shumaq - Search' },
  { path: 'genre/:name', component: GenreDetailsPageComponent, title: 'Shumaq - Genre' },
  { path: 'profile', component: ProfilePageComponent, title: 'Shumaq - Profile' },
  { path: 'recommendations', component: RecommendationsPageComponent, title: 'Shumaq - Recommendations' },
  { path: '**', redirectTo: '' }
];
