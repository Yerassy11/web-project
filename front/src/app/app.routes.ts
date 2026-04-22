import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { AuthPageComponent } from './pages/auth-page.component';
import { TracksPageComponent } from './pages/tracks-page.component';
import { PlaylistsPageComponent } from './pages/playlists-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';
import { StatisticsPageComponent } from './pages/statistics-page.component';
import { RecommendationsPageComponent } from './pages/recommendations-page.component';
import { PlayerPageComponent } from './pages/player-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'Shumaq - Home' },
  { path: 'auth', component: AuthPageComponent, title: 'Shumaq - Auth' },
  { path: 'tracks', component: TracksPageComponent, title: 'Shumaq - Tracks' },
  { path: 'playlists', component: PlaylistsPageComponent, title: 'Shumaq - Playlists' },
  { path: 'profile', component: ProfilePageComponent, title: 'Shumaq - Profile' },
  { path: 'statistics', component: StatisticsPageComponent, title: 'Shumaq - Statistics' },
  { path: 'recommendations', component: RecommendationsPageComponent, title: 'Shumaq - Recommendations' },
  { path: 'player', component: PlayerPageComponent, title: 'Shumaq - Player' },
  { path: '**', redirectTo: '' }
];
