import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/constants';
import type { Blog } from '@/types';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      setPost(data as Blog | null);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 pb-20">
        <div className="container-page">
          <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="container-page">
          <h1 className="font-display text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you are looking for does not exist.</p>
          <Link to="/blog"><button className="btn-secondary"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24">
      <div className="container-narrow">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-600 mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Calendar className="h-4 w-4" />
          {formatDate(post.published_at)}
          {post.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-2">
                {post.tags.map((t) => (
                  <span key={t} className="text-brand-600">#{t}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">{post.title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">{post.excerpt}</p>

        <div className="aspect-video rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 flex items-center justify-center mb-10 border border-border">
          <span className="font-display text-5xl font-bold text-brand-300">FS</span>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground leading-relaxed text-lg">{post.content}</p>
        </div>
      </div>
    </div>
  );
}
