// app/pro-apply/page.tsx   (or wherever your old Pro Apply page was)

import { redirect } from 'next/navigation';

export default function ProApplyPage() {
  // Permanent redirect (301) to the new page
  redirect('/apply-for-me');
}