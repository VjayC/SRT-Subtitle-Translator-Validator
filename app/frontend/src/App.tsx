import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { TemplateProvider } from './context/TemplateContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TemplateManager } from './pages/TemplateManager';
import { Settings } from './pages/Settings';

function App() {
  // 1. Set up our React state to control the downloading UI
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Auto-check for updates on startup
  useEffect(() => {
    const checkForUpdatesOnStartup = async () => {
      try {
        const update = await check();
        
        if (update) {
          // A new version was found! Prompt the user using a native OS dialog.
          const wantsUpdate = await ask(
            `Version ${update.version} is available! Would you like to download and install it now?\n\nRelease Notes:\n${update.body || 'Bug fixes and performance improvements.'}`,
            { 
              title: 'SRT Translator Update Available', 
              kind: 'info',
              okLabel: 'Install Update',
              cancelLabel: 'Remind Me Later'
            }
          );

          if (wantsUpdate) {
            // 2. Trigger our React overlay instead of the blocking native message box
            setIsUpdating(true);
            
            let downloaded = 0;
            let totalLength = 0;

            // 3. Start the download and listen to the progress events
            await update.downloadAndInstall((event) => {
              switch (event.event) {
                case 'Started':
                  // The server tells us how big the update file is
                  totalLength = event.data.contentLength || 0;
                  break;
                case 'Progress':
                  // Add the newly downloaded chunk to our total
                  downloaded += event.data.chunkLength;
                  if (totalLength > 0) {
                    // Calculate the percentage and update the React state!
                    const percent = Math.round((downloaded / totalLength) * 100);
                    setUpdateProgress(percent);
                  }
                  break;
                case 'Finished':
                  // Lock it to 100% just to be safe
                  setUpdateProgress(100);
                  break;
              }
            });

            // 4. Once downloadAndInstall finishes, restart the app
            await relaunch();
          }
        } else {
          console.log("App is up to date.");
        }
      } catch (error) {
        console.error('Background update check failed:', error);
        // Safety fallback: Hide the overlay if something crashes
        setIsUpdating(false); 
      }
    };

    const timer = setTimeout(() => {
      checkForUpdatesOnStartup();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SettingsProvider>
      <TemplateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="templates" element={<TemplateManager />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TemplateProvider>

      {/* --- NEW: The Global Updating Overlay --- */}
      {isUpdating && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 9999 // Ensure it sits on top of absolutely everything
        }}>
          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '12px',
            width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '1.25rem', fontWeight: 'bold' }}>
              Downloading Update...
            </h2>
            
            {/* The Progress Bar Container */}
            <div style={{ 
              background: '#e5e7eb', borderRadius: '9999px', 
              height: '12px', width: '100%', overflow: 'hidden' 
            }}>
              {/* The Blue Fill */}
              <div style={{
                background: '#3b82f6',
                height: '100%',
                width: `${updateProgress}%`,
                transition: 'width 0.2s ease-out'
              }} />
            </div>
            
            <p style={{ margin: '1rem 0 0 0', color: '#4b5563', fontWeight: '500' }}>
              {updateProgress}% Completed
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              The application will restart automatically.
            </p>
          </div>
        </div>
      )}
    </SettingsProvider>
  );
}

export default App;