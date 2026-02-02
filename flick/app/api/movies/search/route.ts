import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchMovies } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    const tmdbResponse = await searchMovies(query, page);

    const movies = tmdbResponse.results.map(m => ({
      tmdbId: m.id,
      title: m.title,
      posterPath: m.poster_path,
      overview: m.overview,
      releaseYear: m.release_date ? parseInt(m.release_date.split('-')[0]) : null,
      voteAverage: m.vote_average,
    }));

    return NextResponse.json({
      movies,
      page: tmdbResponse.page,
      hasMore: tmdbResponse.page < tmdbResponse.total_pages,
      total: tmdbResponse.total_results,
    });
  } catch (error) {
    console.error('Failed to search movies:', error);
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 });
  }
}
