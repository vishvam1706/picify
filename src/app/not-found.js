import Link from 'next/link';

export const metadata = {
  title: '404 — Page Not Found | Picify',
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Big decorative P */}
      <div className="relative mb-6 select-none">
        <span className="text-[12rem] font-black leading-none text-primary/10 dark:text-primary/5">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-primary rounded-full text-white flex items-center justify-center font-black text-5xl shadow-2xl">
            P
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-3">Oops! Nothing to pin here</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved.
        Let's get you back to discovering awesome content!
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
        >
          Back to Home
        </Link>
        <Link
          href="/explore"
          className="px-8 py-3 rounded-full bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
        >
          Explore Pins
        </Link>
      </div>
    </div>
  );
}
