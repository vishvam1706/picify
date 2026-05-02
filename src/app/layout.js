import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Toaster from '@/components/ui/Toaster';
import LayoutShell from '@/components/layout/LayoutShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: 'Picify | The Visual Discovery Engine',
  description: 'Find inspiration, discover ideas, and save what you love on Picify.',
  keywords: 'Pinterest clone, images, visual, boards, AI pins, discovery',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background overflow-x-hidden`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              {/* Mobile top navbar (hidden on desktop) */}
              <Navbar />
              {/* Desktop left sidebar */}
              <Sidebar />
              {/* Main content — offset dynamically with sidebar state */}
              <LayoutShell>
                {children}
              </LayoutShell>
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
