import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { moviesCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMovieDetails } from '@/lib/tmdb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tmdbId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tmdbId } = await params;
  const id = parseInt(tmdbId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
  }

  try {
    // Check cache first
    const cached = await db.query.moviesCache.findFirst({
      where: eq(moviesCache.tmdbId, id),
    });

    // If cached and recent (< 7 days), return cached data
    if (cached && Date.now() - cached.cachedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({
        tmdbId: cached.tmdbId,
        title: cached.title,
        posterPath: cached.posterPath,
        overview: cached.overview,
        releaseYear: cached.releaseYear,
        genres: cached.genres,
        runtime: cached.runtime,
      });
    }

    // Fetch from TMDB
    const movie = await getMovieDetails(id);

    // Update cache
    await db
      .insert(moviesCache)
      .values({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        overview: movie.overview,
        releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
        genres: movie.genres.map(g => g.id),
        runtime: movie.runtime,
      })
      .onConflictDoUpdate({
        target: moviesCache.tmdbId,
        set: {
          title: movie.title,
          posterPath: movie.poster_path,
          overview: movie.overview,
          releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
          genres: movie.genres.map(g => g.id),
          runtime: movie.runtime,
          cachedAt: new Date(),
        },
      });

    return NextResponse.json({
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      overview: movie.overview,
      releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
      genres: movie.genres.map(g => ({ id: g.id, name: g.name })),
      runtime: movie.runtime,
      voteAverage: movie.vote_average,
      tagline: movie.tagline,
    });
  } catch (error) {
    console.error('Failed to fetch movie details:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
