import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Blog = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    const post = searchParams.get('post');
    let url = 'https://app.trysoro.com/api/embed/648b588d-c7a7-4af7-8888-cf32aacfb8dc';
    if (post) url += `?post=${encodeURIComponent(post)}`;
    script.src = url;
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [searchParams]);

  return (
    <div className="cinematic-bg flex flex-col">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div id="soro-blog" ref={containerRef} className="soro-blog-container" />
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
