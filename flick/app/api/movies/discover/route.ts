import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes, moviesCache } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { discoverMovies, getGenres } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const genres = searchParams.get('genres')?.split(',').map(Number).filter(Boolean);
  const minRating = parseFloat(searchParams.get('minRating') || '0');

  try {
    let genreLookup = new Map<number, string>();
    try {
      const genreResponse = await getGenres();
      genreLookup = new Map(genreResponse.genres.map((genre) => [genre.id, genre.name]));
    } catch (error) {
      console.warn('Failed to fetch genre list:', error);
    }

    // Get movies from TMDB
    const tmdbResponse = await discoverMovies(page, {
      genres,
      minRating: minRating > 0 ? minRating : undefined,
    });

    // Get user's already-swiped movies
    const userSwipes = await db
      .select({ tmdbId: swipes.tmdbId })
      .from(swipes)
      .where(eq(swipes.userId, session.user.id));

    const swipedIds = new Set(userSwipes.map(s => s.tmdbId));

    // Filter out already swiped movies
    const newMovies = tmdbResponse.results.filter(m => !swipedIds.has(m.id));

    // Cache the movies
    if (newMovies.length > 0) {
      const cacheData = newMovies.map(m => ({
        tmdbId: m.id,
        title: m.title,
        posterPath: m.poster_path,
        overview: m.overview,
        releaseYear: m.release_date ? parseInt(m.release_date.split('-')[0]) : null,
        genres: m.genre_ids,
      }));

      // Upsert into cache
      await Promise.all(
        cacheData.map(movie =>
          db
            .insert(moviesCache)
            .values(movie)
            .onConflictDoUpdate({
              target: moviesCache.tmdbId,
              set: {
                title: movie.title,
                posterPath: movie.posterPath,
                overview: movie.overview,
                releaseYear: movie.releaseYear,
                genres: movie.genres,
                cachedAt: new Date(),
              },
            })
        )
      );
    }

    // Format response
    const movies = newMovies.map(m => ({
      tmdbId: m.id,
      title: m.title,
      posterPath: m.poster_path,
      overview: m.overview,
      releaseYear: m.release_date ? parseInt(m.release_date.split('-')[0]) : null,
      voteAverage: m.vote_average,
      voteCount: m.vote_count,
      genres: m.genre_ids,
      genreNames: m.genre_ids.map(id => genreLookup.get(id)).filter(Boolean),
    }));

    return NextResponse.json({
      movies,
      page: tmdbResponse.page,
      hasMore: tmdbResponse.page < tmdbResponse.total_pages,
    });
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}
