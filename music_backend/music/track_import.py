import json
from pathlib import Path
from urllib.parse import quote_plus, urlparse
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils.text import slugify

from .models import Track


def get_or_create_track(song_title, user, artist='Unknown Artist', preview_url='', artwork_url=''):
    title = (song_title or '').strip()
    if not title:
        return None

    track = Track.objects.filter(title=title).first()
    if track is not None:
        normalized_artwork = (artwork_url or '').strip()
        # Keep existing artwork, but enrich older records that do not have it yet.
        if normalized_artwork and not (track.artwork_url or '').strip():
            track.artwork_url = normalized_artwork
            track.save(update_fields=['artwork_url'])
        return track

    media_root = Path(settings.MEDIA_ROOT)
    audio_exts = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}

    # 1) Try local media library first.
    for candidate in media_root.rglob('*'):
        if not candidate.is_file() or candidate.suffix.lower() not in audio_exts:
            continue
        if candidate.stem == title:
            relative_audio_path = candidate.relative_to(media_root).as_posix()
            return Track.objects.create(
                title=title,
                artist=(artist or 'Unknown Artist').strip() or 'Unknown Artist',
                artwork_url=(artwork_url or '').strip(),
                audio_file=relative_audio_path,
                duration=0,
                genre='',
                uploaded_by=user,
            )

    # 2) Fallback: download internet preview file if provided.
    preview = (preview_url or '').strip()
    if not preview:
        preview = _lookup_preview_url(title, artist)
    if preview:
        downloaded_path = _download_preview_to_media(title, preview)
        if downloaded_path is not None:
            return Track.objects.create(
                title=title,
                artist=(artist or 'Unknown Artist').strip() or 'Unknown Artist',
                artwork_url=(artwork_url or '').strip(),
                audio_file=downloaded_path,
                duration=0,
                genre='',
                uploaded_by=user,
            )

    return None


def _lookup_preview_url(song_title, artist=''):
    query_parts = [song_title.strip()]
    if artist and artist.strip():
        query_parts.append(artist.strip())

    query = ' '.join(part for part in query_parts if part)
    if len(query) < 2:
        return ''

    encoded = quote_plus(query)
    url = f'https://itunes.apple.com/search?term={encoded}&entity=song&limit=5'
    req = Request(url, headers={'User-Agent': 'ShumaqMusic/1.0'})

    try:
        with urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception:
        return ''

    for item in payload.get('results', []):
        preview = (item.get('previewUrl') or '').strip()
        if preview:
            return preview
    return ''


def _download_preview_to_media(song_title, preview_url):
    media_root = Path(settings.MEDIA_ROOT)
    target_dir = media_root / 'tracks' / 'internet'
    target_dir.mkdir(parents=True, exist_ok=True)

    parsed = urlparse(preview_url)
    ext = Path(parsed.path).suffix.lower()
    if ext not in {'.mp3', '.m4a', '.wav', '.ogg'}:
        ext = '.m4a'

    filename = f"{slugify(song_title) or 'track'}{ext}"
    filepath = target_dir / filename

    counter = 1
    while filepath.exists():
        filepath = target_dir / f"{slugify(song_title) or 'track'}-{counter}{ext}"
        counter += 1

    req = Request(preview_url, headers={'User-Agent': 'ShumaqMusic/1.0'})
    try:
        with urlopen(req, timeout=10) as response:
            content = response.read()
    except Exception:
        return None

    if not content:
        return None

    filepath.write_bytes(content)
    return filepath.relative_to(media_root).as_posix()
