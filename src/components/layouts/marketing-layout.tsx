import { Outlet } from 'react-router-dom';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
