import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { AuthPageComponent } from './pages/auth-page.component';
import { TracksPageComponent } from './pages/tracks-page.component';
import { PlaylistsPageComponent } from './pages/playlists-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'Shumaq - Home' },
  { path: 'auth', component: AuthPageComponent, title: 'Shumaq - Auth' },
  { path: 'tracks', component: TracksPageComponent, title: 'Shumaq - Tracks' },
  { path: 'playlists', component: PlaylistsPageComponent, title: 'Shumaq - Playlists' },
  { path: 'profile', component: ProfilePageComponent, title: 'Shumaq - Profile' },
  { path: '**', redirectTo: '' }
];
