import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import CategoryJobList, { RawJobRow } from '@/components/category/CategoryJobList';
import CategoryContent from '@/components/category/CategoryContent';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin } from 'lucide-react';
import AdUnit from '@/components/ads/AdUnit';

// Cache forever — page is fully static until a new deploy or on-demand
// revalidation clears it.
export const revalidate = false;

// Slugs not in generateStaticParams are built on first request, then cached
// forever the same way (no automatic expiry).
export const dynamicParams = true;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

interface CategoryPage {
  id: string;
  category: string;
  location: string | null;
  slug: string;
  meta_title: string;
  meta_description: string;
  seo_keywords: string[] | null;
  h1_title: string;
  about_role: string | null;
  who_should_apply: string | null;
  how_to_stand_out: string | null;
  key_responsibilities: string[] | null;
  faqs: any;
  related_categories: string[] | null;
  related_locations: string[] | null;
  view_count: number;
  job_count: number;
  town: string | null;
}

interface RelatedCategory {
  slug: string;
  h1_title: string;
  job_count: number;
  location: string | null;
  town: string | null;
}

// ─── Plain fetch helpers — integrate with Next.js cache ──────────────────────

const getCategoryPage = cache(async (slug: string): Promise<CategoryPage | null> => {
  const params = new URLSearchParams({
    slug: `eq.${slug}`,
    is_published: 'eq.true',
    limit: '1',
  });
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/category_pages?${params}`,
    {
      headers: SUPABASE_HEADERS,
      next: { revalidate: false },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
});

const getInitialJobs = cache(async (page: CategoryPage): Promise<RawJobRow[]> => {
  const params = new URLSearchParams({
    select: 'id,slug,title,company,location,salary_range,employment_type,posted_date,created_at',
    'status': 'in.(active,expired,expired_indexed)',
    category: `eq.${page.category}`,
    order: 'created_at.desc',
    limit: '20',
  });
  if (page.location) params.set('location->>state', `eq.${page.location}`);

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/jobs?${params}`,
    {
      headers: SUPABASE_HEADERS,
      next: { revalidate: false },
    }
  );
  if (!res.ok) return [];
  return await res.json();
});

const getRelatedCategories = cache(async (page: CategoryPage): Promise<RelatedCategory[]> => {
  // Build all candidate slugs in a single query instead of up to 5 sequential ones.
  // We fetch by location/town match first, then fall back to related_categories
  // and related_locations arrays — all in one request using an `or` filter.
  const orParts: string[] = [];

  if (page.town) orParts.push(`town.eq.${page.town}`);
  if (page.location) orParts.push(`location.eq.${page.location}`);

  const explicitSlugs = [
    ...(page.related_categories || []),
    ...(page.related_locations || []),
  ].filter(Boolean);

  if (explicitSlugs.length > 0) {
    orParts.push(`slug.in.(${explicitSlugs.join(',')})`);
  }

  if (orParts.length === 0) return [];

  const params = new URLSearchParams({
    select: 'slug,h1_title,job_count,location,town',
    is_published: 'eq.true',
    'slug': `neq.${page.slug}`,
    or: `(${orParts.join(',')})`,
    order: 'job_count.desc',
    limit: '6',
  });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/category_pages?${params}`,
    {
      headers: SUPABASE_HEADERS,
      next: { revalidate: false },
    }
  );
  if (!res.ok) return [];
  return await res.json();
});

export async function generateStaticParams() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/category_pages?select=slug&is_published=eq.true&order=job_count.desc&limit=200`,
    {
      headers: SUPABASE_HEADERS,
      next: { revalidate: false },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((page: { slug: string }) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getCategoryPage(params.slug);
  if (!page) return { title: 'Category Not Found | JobMeter' };

  const keywords = page.seo_keywords?.join(', ') || 'jobs, careers, employment';
  const url = `https://jobmeter.app/resources/${page.slug}`;
  const shouldAddNearMe =
    !!page.location && page.meta_title.length + ' (Hiring near me)'.length <= 70;
  const title = shouldAddNearMe ? `${page.meta_title} (Hiring near me)` : page.meta_title;

  return {
    title,
    description: page.meta_description,
    keywords: keywords.split(',').map(k => k.trim()),
    authors: [{ name: 'JobMeter' }],
    openGraph: {
      title,
      description: page.meta_description,
      url,
      siteName: 'JobMeter',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.meta_description,
    },
    alternates: { canonical: url },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const page = await getCategoryPage(params.slug);
  if (!page) notFound();

  const [initialJobs, relatedCategories] = await Promise.all([
    getInitialJobs(page),
    getRelatedCategories(page),
  ]);

  // View count increment is intentionally moved to a client-side effect
  // via CategoryJobList so it doesn't run during server render / cache
  // population — only on genuine user visits.

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.h1_title,
    description: page.meta_description,
    url: `https://jobmeter.app/resources/${page.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name: page.h1_title,
      description: page.meta_description,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jobmeter.app' },
        { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://jobmeter.app/resources' },
        { '@type': 'ListItem', position: 3, name: page.h1_title, item: `https://jobmeter.app/resources/${page.slug}` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              {page.location ? <MapPin size={32} /> : <Briefcase size={32} />}
              <h1 className="text-4xl font-bold">{page.h1_title}</h1>
            </div>
            <p className="text-lg text-white max-w-3xl">{page.meta_description}</p>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <span className="flex items-center gap-2">
                <Briefcase size={16} />
                {page.job_count} active jobs
              </span>
              {page.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={16} />
                  {page.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link href="/resources" className="hover:text-blue-600">Categories</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {page.h1_title.replace(' | JobMeter', '')}
              </span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Categories
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CategoryJobList
                category={page.category}
                location={page.location}
                initialJobs={initialJobs}
                pageSlug={params.slug}
              />
            </div>
            <div className="lg:col-span-1">
              <CategoryContent page={page} />
            </div>
          </div>

          {relatedCategories.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Job Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedCategories.map(related => (
                  <Link
                    key={related.slug}
                    href={`/resources/${related.slug}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {related.h1_title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{related.job_count} jobs</span>
                      {related.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {related.town || related.location}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <AdUnit slot="9751041788" format="auto" />
    </>
  );
}