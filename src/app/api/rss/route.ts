import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const { data: articles, error } = await supabase
        .from('articles')
        .select(`
      id,
      title,
      body,
      created_at,
      updated_at,
      profiles (display_name)
    `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching articles for RSS:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nius.app';

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nius Articles</title>
    <link>${siteUrl}</link>
    <description>Latest articles from Nius</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${articles.map((article: any) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteUrl}/article/${article.id}</link>
      <guid isPermaLink="true">${siteUrl}/article/${article.id}</guid>
      <pubDate>${new Date(article.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${article.body.substring(0, 300)}...]]></description>
      <author>${article.profiles?.display_name || 'Nius Author'}</author>
    </item>
    `).join('')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
    });
}
