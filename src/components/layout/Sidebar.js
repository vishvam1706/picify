import Link from 'next/link';

export default function Sidebar() {
  // A simple optional sidebar for desktop
  return (
    <aside className="w-64 fixed left-0 top-16 bottom-0 hidden lg:flex flex-col border-r border-border bg-background p-4 gap-2">
      <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent hover:text-accent-foreground font-semibold transition-colors">
        Home
      </Link>
      <Link href="/explore" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent hover:text-accent-foreground font-semibold transition-colors">
        Explore
      </Link>
      <Link href="/trending" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent hover:text-accent-foreground font-semibold transition-colors">
        Trending
      </Link>
      <hr className="my-2 border-border" />
      <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent hover:text-accent-foreground font-semibold transition-colors">
        Settings
      </Link>
    </aside>
  );
}
