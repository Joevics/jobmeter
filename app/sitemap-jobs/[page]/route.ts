import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jobmeter.app';
const JOBS_TABLE = 'jobs_nigeria';
const JOBS_PER_SITEMAP = 1000;

// Jobs created before this date keep their old /jobs/slug URL format.
// Jobs created on or after this date get the new /jobs/country/slug format.
const COUNTRY_URL_CUTOFF = '2026-05-30';

function buildJobUrl(job: { slug: string; country: string[] | null; created_at: string }): string {
  const isNew = job.created_at >= COUNTRY_URL_CUTOFF;
  if (isNew && Array.isArray(job.country) && job.country.length > 0) {
    const countrySlug = job.country[0]
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return `${siteUrl}/jobs/${countrySlug}/${job.slug}`;
  }
  return `${siteUrl}/jobs/${job.slug}`;
}

/**
 * Paginated job sitemap
 * Place at: app/sitemap-jobs/[page]/route.ts
 */
export async function GET(
  _request: Request,
  { params }: { params: { page: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not found');
      return new Response('Missing Supabase credentials', { status: 500 });
    }

    const page = parseInt(params.page, 10);
    if (isNaN(page) || page < 1) {
      return new Response('Invalid page number', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const from = (page - 1) * JOBS_PER_SITEMAP;
    const to = from + JOBS_PER_SITEMAP - 1;

    const { data: jobs, error } = await supabase
      .from(JOBS_TABLE)
      .select('slug, updated_at, country, created_at')
      .in('status', ['active', 'expired_indexed'])
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching jobs for sitemap page ${page}:`, error);
      return new Response('Error fetching jobs', { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return new Response('Page not found', { status: 404 });
    }

    console.log(`📄 Job sitemap page ${page}: ${jobs.length} jobs (rows ${from}–${to})`);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${jobs
  .map((job) => `  <url>
    <loc>${buildJobUrl(job)}</loc>
    <lastmod>${job.updated_at ? new Date(job.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`)
  .join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating job sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}

export const revalidate = 3600;