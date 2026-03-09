import { openUrl } from '@tauri-apps/plugin-opener';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, FileText, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.48-1.54 6.48-7.46 0-1.3-.46-2.4-1.22-3.3.12-.3.54-1.54-.12-3.26 0 0-1-.3-3.3 1.2a11.3 11.3 0 0 0-6 0c-2.3-1.5-3.3-1.2-3.3-1.2-.66 1.72-.24 2.96-.12 3.26-.76.9-1.22 2-1.22 3.3 0 5.92 3.32 7.12 6.48 7.46-.8.7-1.14 1.9-1.14 3.02V22"></path>
    <line x1="9" y1="20" x2="10" y2="20"></line>
    <line x1="9" y1="20" x2="4" y2="22"></line>
  </svg>
);

export const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/templates', label: 'Templates', icon: FileText },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleExternalLink = async (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    try {
      await openUrl(url);
    } catch (err) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Title and GitHub Link */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                SRT Translator
              </h1>
              <a 
                href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator/tree/main?tab=readme-ov-file#prerequisites" 
                onClick={(e) => handleExternalLink(e, "https://github.com/VjayC/SRT-Subtitle-Translator-Validator/tree/main?tab=readme-ov-file#prerequisites")}
                title="View Documentation on GitHub"
                className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors mt-0.5"
              >
                <GithubIcon size={20} />
              </a>
            </div>
            
            {/* Nav Links */}
            <nav className="flex gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive 
                        ? 'bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 text-[#667eea] dark:text-[#889cf4]' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};