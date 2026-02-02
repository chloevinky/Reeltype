const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  runtime?: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
  tagline: string;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY!);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Discover popular movies
 */
export async function discoverMovies(page = 1, options: {
  genres?: number[];
  minRating?: number;
  year?: number;
} = {}): Promise<TMDBDiscoverResponse> {
  const params: Record<string, string> = {
    page: page.toString(),
    sort_by: 'popularity.desc',
    include_adult: 'false',
    include_video: 'false',
    'vote_count.gte': '100',
  };

  if (options.genres?.length) {
    params.with_genres = options.genres.join(',');
  }
  if (options.minRating) {
    params['vote_average.gte'] = options.minRating.toString();
  }
  if (options.year) {
    params.primary_release_year = options.year.toString();
  }

  return tmdbFetch<TMDBDiscoverResponse>('/discover/movie', params);
}

/**
 * Search movies by title
 */
export async function searchMovies(query: string, page = 1): Promise<TMDBDiscoverResponse> {
  return tmdbFetch<TMDBDiscoverResponse>('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
}

/**
 * Get movie details
 */
export async function getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${tmdbId}`);
}

/**
 * Get trending movies
 */
export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<TMDBDiscoverResponse> {
  return tmdbFetch<TMDBDiscoverResponse>(`/trending/movie/${timeWindow}`);
}

/**
 * Get genre list
 */
export async function getGenres(): Promise<{ genres: { id: number; name: string }[] }> {
  return tmdbFetch('/genre/movie/list');
}

/**
 * Convert TMDB movie to our cache format
 */
export function movieToCacheFormat(movie: TMDBMovie) {
  return {
    tmdbId: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    overview: movie.overview,
    releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
    genres: movie.genre_ids,
  };
}
