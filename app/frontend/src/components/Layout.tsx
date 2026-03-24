import { openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, FileText, Settings as SettingsIcon, Minus, Square, X } from 'lucide-react';
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
  const isMac = navigator.userAgent.includes('Mac');
  
  // Render custom controls only on Windows/Linux
  const showCustomControls = !isMac && '__TAURI_INTERNALS__' in window;
  const appWindow = showCustomControls ? getCurrentWindow() : null;

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
      {/* 1. select-none: Prevents text highlighting from stealing the drag event.
        2. [-webkit-app-region:drag]: Triggers native OS dragging on macOS.
        3. data-tauri-drag-region: Triggers Tauri's IPC dragging on Windows/Linux.
      */}
      <header 
        className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#1a1a1a] select-none [-webkit-app-region:drag]" 
        data-tauri-drag-region
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-tauri-drag-region>
          <div className="flex justify-between items-center h-16" data-tauri-drag-region>
            
            {/* Title and GitHub Link */}
            <div className={clsx("flex items-center gap-3", isMac ? "pl-[72px]" : "")} data-tauri-drag-region>
              <h1 
                className="text-xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent pointer-events-none" 
                data-tauri-drag-region
              >
                SRT Translator
              </h1>
              {/* [-webkit-app-region:no-drag] ensures the user can still click the link */}
              <a 
                href="https://github.com/VjayC/SRT-Subtitle-Translator-Validator#desktop-application-specifics" 
                onClick={(e) => handleExternalLink(e, "https://github.com/VjayC/SRT-Subtitle-Translator-Validator#desktop-application-specifics")}
                title="View Documentation on GitHub"
                className="text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors mt-0.5 [-webkit-app-region:no-drag]"
              >
                <GithubIcon size={20} />
              </a>
            </div>
            
            {/* Nav Links & Windows Controls Container */}
            <div className="flex items-center gap-4">
              {/* [-webkit-app-region:no-drag] ensures nav buttons are clickable */}
              <nav className="flex gap-1 [-webkit-app-region:no-drag]"> 
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

              {/* Custom Title Bar Controls for Windows/Linux */}
              {showCustomControls && appWindow && (
                <div className="flex items-center gap-1 pl-4 border-l border-gray-200 dark:border-gray-800 [-webkit-app-region:no-drag]">
                  <button 
                    onClick={() => appWindow.minimize()} 
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Minimize"
                  >
                    <Minus size={18} />
                  </button>
                  <button 
                    onClick={() => appWindow.toggleMaximize()} 
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Maximize"
                  >
                    <Square size={14} />
                  </button>
                  <button 
                    onClick={() => appWindow.close()} 
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-red-500 rounded transition-colors"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

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