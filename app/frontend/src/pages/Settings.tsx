import { useState, useContext, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { Server, Key, Terminal, Cpu, Save, CheckCircle, RefreshCw, Download } from 'lucide-react';

// Tauri API imports
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export const Settings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('Settings must be used within a SettingsProvider');
  }

  const { settings, updateSettings } = context;
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Updater States
  const [appVersion, setAppVersion] = useState<string>('Loading...');
  const [updateStatus, setUpdateStatus] = useState<string>('Check for Updates');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Fetch the current app version natively from Tauri on mount
  useEffect(() => {
    getVersion()
      .then(version => setAppVersion(`v${version}`))
      .catch(() => setAppVersion('Web Mode (Dev)')); // Fallback if run in a normal browser
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const checkForUpdates = async () => {
    try {
      setIsCheckingUpdate(true);
      setUpdateStatus('Checking GitHub...');
      
      const update = await check();
      
      if (update) {
        setUpdateStatus(`Downloading v${update.version}...`);
        await update.downloadAndInstall();
        
        setUpdateStatus('Restarting App...');
        await relaunch();
      } else {
        setUpdateStatus('App is up to date!');
        setTimeout(() => setUpdateStatus('Check for Updates'), 3000);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateStatus('Update Failed');
      setTimeout(() => setUpdateStatus('Check for Updates'), 3000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Global Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your API endpoints, translation models, and background proxy commands.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
            {isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Updates Card (NEW) */}
        <div className="md:col-span-2 bg-gradient-to-r from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#121212] border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#667eea]/10 rounded-full text-[#667eea] dark:text-[#889cf4]">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Application Updates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current installed version: <span className="font-mono text-indigo-500 dark:text-indigo-400 font-semibold">{appVersion}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={checkForUpdates}
            disabled={isCheckingUpdate || appVersion === 'Web Mode (Dev)'}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isCheckingUpdate ? "animate-spin text-[#667eea]" : ""} />
            {updateStatus}
          </button>
        </div>

        {/* LLM API Configuration Card */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a] bg-gray-50/50 dark:bg-[#0f0f0f]/50 flex items-center gap-2">
            <Server size={18} className="text-[#667eea]" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">LLM API Configuration</h3>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                CLI Proxy API Endpoint
              </label>
              <input
                type="text"
                name="apiEndpoint"
                value={localSettings.apiEndpoint}
                onChange={handleChange}
                placeholder="http://localhost:8317/v1/chat/completions"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Key size={14} className="text-gray-400" /> API Key
              </label>
              <input
                type="password"
                name="apiKey"
                value={localSettings.apiKey}
                onChange={handleChange}
                placeholder="Enter your API key..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
              />
            </div>
          </div>
        </div>

        {/* AI Models Card */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a] bg-gray-50/50 dark:bg-[#0f0f0f]/50 flex items-center gap-2">
            <Cpu size={18} className="text-[#764ba2]" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Models</h3>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Language Detection Model (Lite)
              </label>
              <input
                type="text"
                name="liteModel"
                value={localSettings.liteModel}
                onChange={handleChange}
                placeholder="gemini-3-flash-preview"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#764ba2]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Translation Model (Main)
              </label>
              <input
                type="text"
                name="mainModel"
                value={localSettings.mainModel}
                onChange={handleChange}
                placeholder="gemini-3.1-pro-preview"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#764ba2]/50"
              />
            </div>
          </div>
        </div>

        {/* CLI Proxy Commands Card (Spans full width) */}
        <div className="md:col-span-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1a1a1a] bg-gray-50/50 dark:bg-[#0f0f0f]/50 flex items-center gap-2">
            <Terminal size={18} className="text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">CLI Proxy API Launch Commands</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="cliCommandWindows" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Windows Command
              </label>
              <input
                id="cliCommandWindows"
                type="text"
                name="cliCommandWindows"
                value={localSettings.cliCommandWindows}
                onChange={handleChange}
                placeholder='e.g., cli-proxy-api.exe --config "%USERPROFILE%\Downloads\config.yaml"'
                title="Windows CLI Proxy Command"
                className="w-full px-4 py-2 font-mono bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label htmlFor="cliCommandMac" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                macOS Command
              </label>
              <input
                id="cliCommandMac"
                type="text"
                name="cliCommandMac"
                value={localSettings.cliCommandMac}
                onChange={handleChange}
                placeholder='e.g., /opt/homebrew/opt/cliproxyapi/bin/cliproxyapi --config "$HOME/Downloads/config.yaml"'
                title="macOS CLI Proxy Command"
                className="w-full px-4 py-2 font-mono bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label htmlFor="cliCommandLinux" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Linux Command
              </label>
              <input
                id="cliCommandLinux"
                type="text"
                name="cliCommandLinux"
                value={localSettings.cliCommandLinux}
                onChange={handleChange}
                placeholder='e.g., cli-proxy-api --config "$HOME/Downloads/config.yaml"'
                title="Linux CLI Proxy Command"
                className="w-full px-4 py-2 font-mono bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};