import { Metadata } from 'next';
import ResourcesPageClient from '@/components/resources/ResourcesPageClient';

// Cache forever at Vercel edge — same strategy as job slug pages.
export const revalidate = false;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const metadata: Metadata = {
  title: 'Browse Jobs by Category | JobMeter',
  description: 'Explore job opportunities across different categories and locations in Nigeria. Find accountant jobs, tech jobs, healthcare jobs, and more.',
  keywords: ['job categories', 'job search', 'careers', 'employment', 'Nigeria jobs'],
  openGraph: {
    title: 'Browse Jobs by Category | JobMeter',
    description: 'Explore job opportunities across different categories and locations in Nigeria.',
    type: 'website',
  },
};

// Plain fetch — integrates with Next.js cache unlike the supabase client.
async function getCategoryPages() {
  const params = new URLSearchParams({
    select: 'id,category,location,slug,h1_title,meta_description,job_count,view_count',
    is_published: 'eq.true',
    order: 'job_count.desc',
  });

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/category_pages?${params}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: false },
      }
    );
    if (!res.ok) {
      console.error('[resources] Failed to fetch category pages:', res.status);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error('[resources] Unexpected error:', e);
    return [];
  }
}

export default async function ResourcesPage() {
  const pages = await getCategoryPages();
  return <ResourcesPageClient pages={pages} />;
}