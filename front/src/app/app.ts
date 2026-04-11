import { Component, computed, signal } from '@angular/core';

type Mood = 'sad' | 'focus' | 'gym' | 'night' | 'relax';
type AuthMode = 'signup' | 'login';
type PlaylistType = 'system' | 'user' | 'ai';

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  bpm: number;
  moodTags: Mood[];
  liked: boolean;
  rating: number;
  listens: string;
  cover: string;
}

interface Album {
  title: string;
  artist: string;
  year: number;
  mood: Mood;
  cover: string;
}

interface Artist {
  name: string;
  genre: string;
  listeners: string;
  note: string;
}

interface Playlist {
  id: number;
  title: string;
  type: PlaylistType;
  curator: string;
  description: string;
  tracks: number;
  duration: string;
  moods: Mood[];
  saved: boolean;
}

interface Scenario {
  id: string;
  title: string;
  summary: string;
  mood: Mood;
  triggers: string[];
  recommendation: string;
}

interface InfoCard {
  title: string;
  description: string;
  cue: string;
}

interface MetricCard {
  label: string;
  value: string;
}

interface HistoryItem {
  title: string;
  detail: string;
  time: string;
}

interface AdminAction {
  title: string;
  description: string;
  metric: string;
}

interface ModerationItem {
  title: string;
  reason: string;
  status: string;
}

interface AnalyticsBar {
  label: string;
  value: string;
  width: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly brand = 'Shumaq';
  readonly moodTags: Mood[] = ['sad', 'focus', 'gym', 'night', 'relax'];
  readonly ratingScale = [1, 2, 3, 4, 5];
  readonly genreCatalog = [
    'lo-fi hip-hop',
    'phonk',
    'indie pop',
    'ambient',
    'neo soul',
    'night drive'
  ];
  readonly playlistTypes: { key: PlaylistType; title: string; description: string }[] = [
    {
      key: 'system',
      title: 'System playlists',
      description: 'Редакторские подборки и стартовые сценарии для новых слушателей.'
    },
    {
      key: 'user',
      title: 'User playlists',
      description: 'Личные подборки пользователя и сохраненные коллекции.'
    },
    {
      key: 'ai',
      title: 'AI / mood-generated',
      description: 'Подборки, которые система собирает по настроению и паттернам.'
    }
  ];
  readonly authMode = signal<AuthMode>('signup');
  readonly selectedMood = signal<Mood>('night');
  readonly activeScenarioId = signal('night-lofi');

  readonly profile = {
    name: 'Aliya Sarsen',
    handle: 'aliya-night',
    city: 'Kyzylorda',
    initials: 'AS',
    bio: 'Любит ночные lo-fi сессии, утром переключается на focus, а перед тренировкой включает phonk.',
    favoriteGenres: ['lo-fi', 'phonk', 'indie pop', 'ambient'],
    favoriteArtists: ['Moldanazar', 'Jinsang', 'Idealism', 'Joji'],
    moodPreferences: ['night', 'focus', 'relax']
  };

  readonly scenarios: Scenario[] = [
    {
      id: 'night-lofi',
      title: 'Late Night Lo-Fi',
      summary: 'Если человек часто слушает lo-fi ночью, главная лента перестраивается под night/focus подборки.',
      mood: 'night',
      triggers: ['lo-fi after 22:00', 'steady skips below 5%', 'repeat sessions at night'],
      recommendation: 'Night Shift Lo-Fi'
    },
    {
      id: 'focus-flow',
      title: 'Deep Focus Flow',
      summary: 'Если пользователь долго слушает без пропусков во время учебы или работы, поднимаем focus-сеты.',
      mood: 'focus',
      triggers: ['long study sessions', 'low skip rate', 'calm instrumental preference'],
      recommendation: 'Desert Focus'
    },
    {
      id: 'gym-phonk',
      title: 'Gym Phonk Boost',
      summary: 'Если пользователь часто совмещает phonk и gym, выдаем плотные aggressive workout mixes.',
      mood: 'gym',
      triggers: ['phonk in recent history', 'gym mood active', 'high BPM preference'],
      recommendation: 'Aggressive Workout Mix'
    },
    {
      id: 'sad-mode',
      title: 'Sad Mood Recovery',
      summary: 'Если выбрано настроение sad, интерфейс предлагает мягкие и меланхоличные подборки.',
      mood: 'sad',
      triggers: ['sad mood selected', 'slower tracks saved', 'late evening reflective sessions'],
      recommendation: 'Midnight Letters'
    },
    {
      id: 'relax-reset',
      title: 'Relax Reset',
      summary: 'Если человек уходит в режим отдыха, показываем длинные ambient и soft evening коллекции.',
      mood: 'relax',
      triggers: ['late evening chill', 'ambient repeats', 'soft transitions'],
      recommendation: 'Balcony Sessions'
    }
  ];

  readonly albums: Album[] = [
    {
      title: 'After 22',
      artist: 'Jinsang',
      year: 2025,
      mood: 'night',
      cover: 'linear-gradient(160deg, #1f3157 0%, #4067a4 100%)'
    },
    {
      title: 'Iron Pulse',
      artist: 'Sxwxl',
      year: 2026,
      mood: 'gym',
      cover: 'linear-gradient(160deg, #2c1e1e 0%, #df6a4f 100%)'
    },
    {
      title: 'Blue Room',
      artist: 'Kina',
      year: 2025,
      mood: 'sad',
      cover: 'linear-gradient(160deg, #294057 0%, #7ab9d9 100%)'
    },
    {
      title: 'Focus Bloom',
      artist: 'Idealism',
      year: 2026,
      mood: 'focus',
      cover: 'linear-gradient(160deg, #21544a 0%, #8fd3b0 100%)'
    }
  ];

  readonly artists: Artist[] = [
    {
      name: 'Moldanazar',
      genre: 'indie pop',
      listeners: '1.9M',
      note: 'Теплые синты и меланхоличные мелодии.'
    },
    {
      name: 'Jinsang',
      genre: 'lo-fi',
      listeners: '2.4M',
      note: 'Ночной грув для учебы и глубокого фокуса.'
    },
    {
      name: 'Idealism',
      genre: 'ambient beats',
      listeners: '1.2M',
      note: 'Чистый воздух, паузы и минималистичные текстуры.'
    },
    {
      name: 'Sxwxl',
      genre: 'phonk',
      listeners: '780K',
      note: 'Грубый бас и энергия под тренировку.'
    }
  ];

  readonly recentListening: HistoryItem[] = [
    {
      title: 'Night Shift Lo-Fi',
      detail: 'System playlist · 32 tracks · focus / night',
      time: '5 min ago'
    },
    {
      title: 'Soft Static',
      detail: 'Idealism · Focus Bloom',
      time: '18 min ago'
    },
    {
      title: 'Pressure Lane',
      detail: 'Sxwxl · Iron Pulse',
      time: 'Yesterday'
    }
  ];

  readonly listeningHistory: HistoryItem[] = [
    {
      title: 'Gym Rush',
      detail: 'Liked after 3 full listens',
      time: 'Monday · 07:10'
    },
    {
      title: 'Grey Rain',
      detail: 'Rated 4/5 in sad lane',
      time: 'Sunday · 22:34'
    },
    {
      title: 'Balcony Sessions',
      detail: 'Playlist saved from user collection',
      time: 'Sunday · 20:05'
    },
    {
      title: 'Night Tram',
      detail: 'Repeated 2 times during focus mode',
      time: 'Saturday · 00:14'
    }
  ];

  readonly adminActions: AdminAction[] = [
    {
      title: 'Добавить треки',
      description: 'Загрузка новых релизов, авторов и метаданных для каталога.',
      metric: '+12 за неделю'
    },
    {
      title: 'Загрузить обложки',
      description: 'Визуальная витрина для альбомов, треков и подборок.',
      metric: '18 cover assets'
    },
    {
      title: 'Mood-категории',
      description: 'Редактирование sad, focus, gym, night, relax и новых сценариев.',
      metric: '5 active moods'
    },
    {
      title: 'Редактировать подборки',
      description: 'Перестройка system и AI-плейлистов под аналитику прослушиваний.',
      metric: '9 curated mixes'
    },
    {
      title: 'Банить контент',
      description: 'Модерация дубликатов, спорных загрузок и нарушений прав.',
      metric: '3 flagged items'
    },
    {
      title: 'Смотреть статистику',
      description: 'Контроль retention, saves, ratings и времени прослушивания.',
      metric: '91K weekly plays'
    }
  ];

  readonly moderationQueue: ModerationItem[] = [
    {
      title: 'Gym Rush Bootleg',
      reason: 'Possible copyright claim',
      status: 'Hold'
    },
    {
      title: 'Rain Tape Duplicate',
      reason: 'Duplicate upload detected',
      status: 'Merge'
    },
    {
      title: 'Blue Hour Cover',
      reason: 'Low-resolution artwork',
      status: 'Review'
    }
  ];

  readonly analyticsBars: AnalyticsBar[] = [
    {
      label: 'Night / focus playlist clicks',
      value: '62%',
      width: '62%'
    },
    {
      label: 'Gym / phonk conversion to saves',
      value: '48%',
      width: '48%'
    },
    {
      label: 'Sad mood session completion',
      value: '71%',
      width: '71%'
    }
  ];

  readonly tracks = signal<Track[]>([
    {
      id: 1,
      title: 'Night Tram',
      artist: 'Jinsang',
      album: 'After 22',
      genre: 'lo-fi',
      duration: '3:24',
      bpm: 86,
      moodTags: ['night', 'focus'],
      liked: true,
      rating: 5,
      listens: '12.4K',
      cover: 'linear-gradient(160deg, #243b6b 0%, #69a0e0 100%)'
    },
    {
      id: 2,
      title: 'Pressure Lane',
      artist: 'Sxwxl',
      album: 'Iron Pulse',
      genre: 'phonk',
      duration: '2:41',
      bpm: 142,
      moodTags: ['gym', 'night'],
      liked: true,
      rating: 4,
      listens: '28.1K',
      cover: 'linear-gradient(160deg, #381d1d 0%, #eb7f5a 100%)'
    },
    {
      id: 3,
      title: 'Grey Rain',
      artist: 'Kina',
      album: 'Blue Room',
      genre: 'sad pop',
      duration: '3:11',
      bpm: 74,
      moodTags: ['sad', 'relax'],
      liked: false,
      rating: 4,
      listens: '9.2K',
      cover: 'linear-gradient(160deg, #35526a 0%, #8cc5e2 100%)'
    },
    {
      id: 4,
      title: 'Soft Static',
      artist: 'Idealism',
      album: 'Focus Bloom',
      genre: 'ambient',
      duration: '4:08',
      bpm: 92,
      moodTags: ['focus', 'relax'],
      liked: true,
      rating: 5,
      listens: '18.7K',
      cover: 'linear-gradient(160deg, #27564e 0%, #86d3b3 100%)'
    },
    {
      id: 5,
      title: 'Paper Lights',
      artist: 'Moldanazar',
      album: 'City Echo',
      genre: 'indie pop',
      duration: '3:47',
      bpm: 103,
      moodTags: ['night', 'relax'],
      liked: false,
      rating: 3,
      listens: '7.5K',
      cover: 'linear-gradient(160deg, #5f374a 0%, #efb48e 100%)'
    },
    {
      id: 6,
      title: 'Velvet Air',
      artist: 'Tomppabeats',
      album: 'Cloud Notes',
      genre: 'chill beats',
      duration: '2:58',
      bpm: 88,
      moodTags: ['focus', 'night', 'relax'],
      liked: true,
      rating: 5,
      listens: '15.6K',
      cover: 'linear-gradient(160deg, #35576d 0%, #d8e4c2 100%)'
    }
  ]);

  readonly playlists = signal<Playlist[]>([
    {
      id: 1,
      title: 'Night Shift Lo-Fi',
      type: 'system',
      curator: 'Shumaq editorial',
      description: 'Ночной поток для учебы, кода и спокойной концентрации.',
      tracks: 32,
      duration: '1h 48m',
      moods: ['night', 'focus'],
      saved: true
    },
    {
      id: 2,
      title: 'Desert Focus',
      type: 'system',
      curator: 'Shumaq editorial',
      description: 'Спокойные ритмы и прозрачные текстуры для глубокой работы.',
      tracks: 24,
      duration: '1h 16m',
      moods: ['focus', 'relax'],
      saved: false
    },
    {
      id: 3,
      title: 'Road to Kyzylorda',
      type: 'user',
      curator: 'Aliya Sarsen',
      description: 'Личный плейлист с теплым night drive настроением.',
      tracks: 19,
      duration: '58m',
      moods: ['night', 'relax'],
      saved: true
    },
    {
      id: 4,
      title: 'Balcony Sessions',
      type: 'user',
      curator: 'Aliya Sarsen',
      description: 'Медленные треки для позднего вечера и пауз между задачами.',
      tracks: 14,
      duration: '43m',
      moods: ['relax', 'sad'],
      saved: false
    },
    {
      id: 5,
      title: 'Aggressive Workout Mix',
      type: 'ai',
      curator: 'Shumaq AI',
      description: 'Phonk, hard bass и быстрые переходы для активной тренировки.',
      tracks: 27,
      duration: '1h 05m',
      moods: ['gym', 'night'],
      saved: true
    },
    {
      id: 6,
      title: 'Midnight Letters',
      type: 'ai',
      curator: 'Shumaq AI',
      description: 'Подборка под sad mood с мягким вокалом и тихой драмой.',
      tracks: 22,
      duration: '1h 11m',
      moods: ['sad', 'relax'],
      saved: false
    }
  ]);

  readonly heroStats = computed<MetricCard[]>(() => [
    {
      label: 'Tracks',
      value: `${this.tracks().length}`
    },
    {
      label: 'Saved playlists',
      value: `${this.playlists().filter((playlist) => playlist.saved).length}`
    },
    {
      label: 'Liked tracks',
      value: `${this.tracks().filter((track) => track.liked).length}`
    },
    {
      label: 'Mood matches',
      value: `${this.tracks().filter((track) => track.moodTags.includes(this.selectedMood())).length}`
    }
  ]);

  readonly profileStats = computed<MetricCard[]>(() => [
    {
      label: 'Avatar status',
      value: 'Online'
    },
    {
      label: 'Favorite artists',
      value: `${this.profile.favoriteArtists.length}`
    },
    {
      label: 'Mood now',
      value: this.selectedMood()
    }
  ]);

  readonly activeScenario = computed(
    () => this.scenarios.find((scenario) => scenario.id === this.activeScenarioId()) ?? this.scenarios[0]
  );

  readonly featuredTracks = computed(() => {
    const currentMood = this.selectedMood();

    return this.tracks()
      .filter((track) => track.moodTags.includes(currentMood))
      .sort((left, right) => Number(right.liked) - Number(left.liked) || right.rating - left.rating);
  });

  readonly moodPlaylists = computed(() => {
    const currentMood = this.selectedMood();

    return this.playlists()
      .filter((playlist) => playlist.moods.includes(currentMood))
      .sort((left, right) => Number(right.saved) - Number(left.saved));
  });

  readonly recommendationCards = computed<InfoCard[]>(() => {
    const scenario = this.activeScenario();
    const primaryPlaylist = this.moodPlaylists()[0];
    const firstTrack = this.featuredTracks()[0];

    return [
      {
        title: scenario.recommendation,
        description: `Система увидела сигнал: ${scenario.triggers.join(', ')}.`,
        cue: `Scenario: ${scenario.title}`
      },
      {
        title: primaryPlaylist?.title ?? 'Adaptive mood set',
        description:
          primaryPlaylist?.description ??
          'Алгоритм поднимает наверх подборки, совпадающие с текущим настроением.',
        cue: `Playlist lane: ${this.selectedMood()}`
      },
      {
        title: firstTrack ? `${firstTrack.title} · ${firstTrack.artist}` : 'Taste profile',
        description: firstTrack
          ? `У трека ${firstTrack.rating}/5 и уже ${firstTrack.listens} прослушиваний.`
          : 'Подбираем треки по любимым артистам и рейтингам.',
        cue: 'Signals: likes, rating, recent listening'
      }
    ];
  });

  readonly adminStats = computed<MetricCard[]>(() => [
    {
      label: 'Tracks in catalog',
      value: `${this.tracks().length}`
    },
    {
      label: 'Playlists active',
      value: `${this.playlists().length}`
    },
    {
      label: 'Moderation queue',
      value: `${this.moderationQueue.length}`
    },
    {
      label: 'Mood tags',
      value: `${this.moodTags.length}`
    }
  ]);

  setAuthMode(mode: AuthMode): void {
    this.authMode.set(mode);
  }

  selectMood(mood: Mood): void {
    this.selectedMood.set(mood);
    const nextScenario = this.scenarios.find((scenario) => scenario.mood === mood);

    if (nextScenario) {
      this.activeScenarioId.set(nextScenario.id);
    }
  }

  activateScenario(id: string): void {
    const nextScenario = this.scenarios.find((scenario) => scenario.id === id);

    if (!nextScenario) {
      return;
    }

    this.activeScenarioId.set(id);
    this.selectedMood.set(nextScenario.mood);
  }

  toggleTrackLike(id: number): void {
    this.tracks.update((tracks) =>
      tracks.map((track) => (track.id === id ? { ...track, liked: !track.liked } : track))
    );
  }

  setTrackRating(id: number, rating: number): void {
    this.tracks.update((tracks) =>
      tracks.map((track) => (track.id === id ? { ...track, rating } : track))
    );
  }

  togglePlaylistSave(id: number): void {
    this.playlists.update((playlists) =>
      playlists.map((playlist) =>
        playlist.id === id ? { ...playlist, saved: !playlist.saved } : playlist
      )
    );
  }

  playlistsByType(type: PlaylistType): Playlist[] {
    const currentMood = this.selectedMood();

    return this.playlists()
      .filter((playlist) => playlist.type === type)
      .sort((left, right) => {
        const leftScore = Number(left.saved) + Number(left.moods.includes(currentMood));
        const rightScore = Number(right.saved) + Number(right.moods.includes(currentMood));

        return rightScore - leftScore;
      });
  }

  isMoodMatch(moods: Mood[]): boolean {
    return moods.includes(this.selectedMood());
  }

  trackMoodLabel(track: Track): string {
    return track.moodTags.join(' · ');
  }

  recommendationExplanation(): string {
    switch (this.selectedMood()) {
      case 'focus':
        return 'Фокус уводит ленту в спокойные биты, длинные сеты и низкую отвлекаемость.';
      case 'gym':
        return 'Для gym алгоритм повышает BPM, тяжелый бас и энергичные подборки.';
      case 'night':
        return 'Night-поведение включает ночные обложки, drive-сеты и lo-fi подборки после 22:00.';
      case 'sad':
        return 'Sad-модель снижает темп и выводит мягкие, поддерживающие рекомендации.';
      case 'relax':
        return 'Relax-поток подает атмосферные треки, мягкие переходы и длинные ambient-плейлисты.';
    }
  }
}
