import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/constants';
import type { Blog } from '@/types';

export function BlogPage() {
  const [posts, setPosts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      setPosts((data as Blog[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Blog"
            title="Trading Insights & Education"
            subtitle="Expert analysis, trading tips, and industry insights to help you become a better trader."
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {featured && (
                <Link to={`/blog/${featured.slug}`} className="block mb-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-2xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-soft-lg transition-all group">
                    <div className="aspect-video lg:aspect-auto lg:h-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                      <span className="font-display text-4xl font-bold text-brand-300">FS</span>
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featured.published_at)}
                        {featured.tags.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-brand-600">{featured.tags[0]}</span>
                          </>
                        )}
                      </div>
                      <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4 group-hover:text-brand-700 transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
                      <span className="flex items-center gap-2 text-brand-600 text-sm font-medium">
                        Read More <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="card-elevated overflow-hidden group"
                    >
                      <div className="aspect-video bg-gradient-to-br from-brand-50 to-brand-100/50 flex items-center justify-center">
                        <span className="font-display text-2xl font-bold text-brand-300">FS</span>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.published_at)}
                        </div>
                        <h3 className="font-display text-lg font-bold mb-2 group-hover:text-brand-700 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
