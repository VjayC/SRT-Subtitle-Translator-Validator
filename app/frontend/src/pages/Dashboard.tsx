import { openUrl } from '@tauri-apps/plugin-opener';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { useState, useContext, useEffect, useRef } from 'react';
import { TemplateContext } from '../context/TemplateContext.tsx';
import { FileDropzone } from '../components/FileDropzone.tsx';
import { ModeSlider } from '../components/ModeSlider.tsx';
import type { AppMode } from '../components/ModeSlider.tsx';
import { Play, Loader2, AlertCircle, Wrench, Plus, Download, SkipForward, ChevronRight, FileText, CheckCircle } from 'lucide-react';

import { useSRTParser } from '../hooks/useSRTParser.ts';
import { useTranslator } from '../hooks/useTranslator.ts';
import { useValidation } from '../hooks/useValidation.ts';
import { SubtitlesEditor } from '../components/SubtitlesEditor.tsx';
import { ValidationDashboard } from '../components/ValidationDashboard.tsx';
import { stringifySRT } from '../utils/srtUtils.ts';
import type { Subtitle } from '../utils/srtUtils.ts';
import { parseMarkdown } from '../utils/markdownUtils.ts';
import { parseScriptInput, scriptRanges } from '../utils/validationUtils.ts';
import type { ScriptRange } from '../utils/validationUtils.ts';

export const Dashboard = () => {
  const [isProxyRunning, setIsProxyRunning] = useState(false);
  const [isProxyLoading, setIsProxyLoading] = useState(false);
  const [latestProxyVersion, setLatestProxyVersion] = useState<string | null>(null);
  const [latestBrewVersion, setLatestBrewVersion] = useState<string | null>(null);

  // Check initial proxy status on mount with auto-retry
  useEffect(() => {
    const checkProxyStatus = () => {
      fetch('http://localhost:8080/api/proxy/status')
        .then(res => res.json())
        .then(data => setIsProxyRunning(data.running))
        .catch(() => { // <-- Removed 'err' here
          console.warn("Backend not ready, retrying proxy status in 1s...");
          setTimeout(checkProxyStatus, 1000);
        });
    };

    checkProxyStatus();
  }, []);

  // Fetch the latest CLIProxyAPI version from GitHub
  useEffect(() => {
    fetch('https://api.github.com/repos/router-for-me/CLIProxyAPI/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data.tag_name) {
          setLatestProxyVersion(data.tag_name);
        }
      })
      .catch(err => console.error('Failed to fetch latest CLIProxyAPI version from GitHub', err));
  }, []);

  // Fetch the latest CLIProxyAPI version from Homebrew
  useEffect(() => {
    fetch('https://formulae.brew.sh/api/formula/cliproxyapi.json')
      .then(res => res.json())
      .then(data => {
        if (data?.versions?.stable) {
          // Homebrew versions usually lack the 'v' prefix, so we add it or just use it raw
          setLatestBrewVersion(data.versions.stable); 
        }
      })
      .catch(err => console.error('Failed to fetch latest CLIProxyAPI version from Homebrew', err));
  }, []);

  const toggleProxy = async () => {
    setIsProxyLoading(true);
    const endpoint = isProxyRunning ? 'stop' : 'start';
    try {
      const res = await fetch(`http://localhost:8080/api/proxy/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      setIsProxyRunning(data.running);
    } catch (err) {
      console.error(`Failed to ${endpoint} proxy`, err);
    } finally {
      setIsProxyLoading(false);
    }
  };

  const templateContext = useContext(TemplateContext);
  if (!templateContext) throw new Error('Must be used within TemplateProvider');

  const {
    templates, activeTemplate, setActiveTemplate,
    placeholderValues, setPlaceholderValues,
    activeScripts, setActiveScripts,
  } = templateContext;

  const [mode, setMode] = useState<AppMode>('translate');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [translatedFile, setTranslatedFile] = useState<File | null>(null);

  const [editablePrompt, setEditablePrompt] = useState<string>('');
  const [previewPrompt, setPreviewPrompt] = useState<string>('');

  const [customRangeInput, setCustomRangeInput] = useState('');
  const [scriptSearch, setScriptSearch] = useState('');

  // ── Batch state ──────────────────────────────────────────────────────────
  const [batchCurrentNum, setBatchCurrentNum] = useState(1);
  const [batchStartIdx, setBatchStartIdx] = useState(1);
  const [batchEndInput, setBatchEndInput] = useState('');
  const [accumulatedSubtitles, setAccumulatedSubtitles] = useState<Subtitle[]>([]);

  // ── Validate: manually parsed translated file ─────────────────────────
  const [validateParsed, setValidateParsed] = useState<Subtitle[]>([]);

  // ── SRT parsing ───────────────────────────────────────────────────────
  const { parsedSubtitles: sourceSubtitles, isParsing: isSourceParsing, error: sourceParseError } = useSRTParser(sourceFile);

  const { parsedSubtitles: uploadedTranslatedSubtitles } = useSRTParser(
    mode === 'validate' ? translatedFile : null
  );

  const [activeSourceSubset, setActiveSourceSubset] = useState<Subtitle[]>([]);

  // Reset it when a new source file is uploaded
  useEffect(() => {
    setActiveSourceSubset(sourceSubtitles);
  }, [sourceSubtitles]);

  const {
    isTranslating,
    loadingMessage,
    translatedSubtitles,
    translationLanguage,
    translationCode,
    isPartialTranslation,
    hasRawOutput,
    error: translationError,
    translate,
    continueTranslation,
    resetTranslation,
    setTranslatedSubtitles,
    downloadRawOutput,
    fixErrors,
  } = useTranslator();

  // --- UPDATED: Clear previous batches AND translation data on new source file ---
  useEffect(() => {
    setBatchCurrentNum(1);
    setBatchStartIdx(1);
    setBatchEndInput('');
    setAccumulatedSubtitles([]);
    resetTranslation(); 
  }, [sourceFile, resetTranslation]);

  // --- ADDED: Clear previous validation UI when a new translated file is dropped ---
  useEffect(() => {
    setValidateParsed([]);
  }, [translatedFile]);

  // For validate mode, show uploaded file's subtitles instead
  const displayedTranslated = mode === 'validate' ? validateParsed : translatedSubtitles;
  const validationSource = mode === 'validate' ? sourceSubtitles : activeSourceSubset;

  const validation = useValidation(
    validationSource,
    displayedTranslated,
    activeScripts.map(s => s.name)
  );

  // ── Autoscroll to results ─────────────────────────────────────────────
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTranslating && (displayedTranslated.length > 0 || isPartialTranslation || translationError || validation.hasErrors)) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [isTranslating, displayedTranslated.length, isPartialTranslation, translationError, validation.hasErrors]);


  // ── Template change ───────────────────────────────────────────────────
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = templates.find(t => t.id === e.target.value) || null;
    setActiveTemplate(selected);

    if (selected) {
      if (selected.placeholders) {
        const initialValues: Record<string, string> = {};
        selected.placeholders.forEach((ph, index) => {
          initialValues[ph] = selected.defaultValues?.[index] || '';
        });
        setPlaceholderValues(initialValues);
      }

      const defaults: ScriptRange[] = [
        { name: 'Basic Latin', start: 0x0020, end: 0x007e, removable: true },
        { name: 'Latin Supplement', start: 0x00a0, end: 0x00ff, removable: true },
        { name: "Special Characters (', \", —, etc.)", start: 0, end: 0, removable: false },
        { name: 'Line Breaks', start: 0, end: 0, removable: false },
      ];

      const templateScripts = (selected.scripts || [])
        .map(s => parseScriptInput(s))
        .filter((s): s is ScriptRange => s !== null);

      const merged = [...defaults];
      templateScripts.forEach(ts => {
        if (!merged.find(m => m.name === ts.name)) merged.push(ts);
      });

      setActiveScripts(merged);
    } else {
      setPlaceholderValues({});
      setActiveScripts([]);
    }
  };

  // ── Generate prompt text ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeTemplate) {
      setEditablePrompt('');
      setPreviewPrompt('');
      return;
    }

    let apiText = activeTemplate.bodyText;
    let uiText = activeTemplate.bodyText;

    if (activeTemplate.placeholders && placeholderValues) {
      activeTemplate.placeholders.forEach(ph => {
        const escapedPh = ph.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\{\\{${escapedPh}\\}\\}`, 'g');
        const val = placeholderValues[ph] || '';
        apiText = apiText.replace(regex, val);
        uiText = uiText.replace(regex, val === '' ? '' : `^^${val}^^`);
      });
    }
    setEditablePrompt(apiText);
    setPreviewPrompt(uiText);
  }, [activeTemplate, placeholderValues]);

  // ── Script management ─────────────────────────────────────────────────
  const handleScriptSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setScriptSearch(val);
    if (scriptRanges[val]) {
      const parsed = parseScriptInput(val);
      if (parsed && !activeScripts.find(s => s.name === parsed.name)) {
        setActiveScripts(prev => [...prev, parsed]);
      }
      setScriptSearch('');
    }
  };

  const handleAddPredefinedScript = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = parseScriptInput(scriptSearch);
      if (parsed && !activeScripts.find(s => s.name === parsed.name)) {
        setActiveScripts([...activeScripts, parsed]);
      }
      setScriptSearch('');
    }
  };

  const handleAddCustomRange = () => {
    const parsed = parseScriptInput(customRangeInput);
    if (parsed) {
      if (!activeScripts.find(s => s.start === parsed.start && s.end === parsed.end)) {
        setActiveScripts([...activeScripts, parsed]);
      } else {
        alert('This range is already added.');
      }
      setCustomRangeInput('');
    } else {
      alert('Invalid format. Please use:\n- U+0C00-U+0C7F\n- U+0C00\n- 0C00-0C7F');
    }
  };

  const handleRemoveScript = (name: string) => {
    setActiveScripts(prev => prev.filter(s => s.name !== name || !s.removable));
  };

  const removableScripts = activeScripts.filter(s => s.removable);
  const permanentScripts = activeScripts.filter(s => !s.removable);

  // ── Mode switching ────────────────────────────────────────────────────
  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    resetTranslation();
    setValidateParsed([]);
    if (newMode !== 'validate') setTranslatedFile(null);
    if (newMode !== 'batch') {
      setBatchCurrentNum(1);
      setBatchStartIdx(1);
      setBatchEndInput('');
      setAccumulatedSubtitles([]);
    }
    
    // Auto-populate default scripts for validation if none are set
    if (newMode === 'validate' && activeScripts.length === 0) {
      setActiveScripts([
        { name: 'Basic Latin', start: 0x0020, end: 0x007e, removable: true },
        { name: 'Latin Supplement', start: 0x00a0, end: 0x00ff, removable: true },
        { name: "Special Characters (', \", —, etc.)", start: 0, end: 0, removable: false },
        { name: 'Line Breaks', start: 0, end: 0, removable: false },
      ]);
    }
  };

  // ── Batch total indexes ───────────────────────────────────────────────
  const batchTotalIndexes =
    sourceSubtitles.length > 0
      ? sourceSubtitles[sourceSubtitles.length - 1].index
      : 0;

  // ── Action handlers ───────────────────────────────────────────────────
  const handleTranslateClick = async () => {
    if (!activeTemplate || sourceSubtitles.length === 0) return;
    setActiveSourceSubset(sourceSubtitles); // Lock full file
    await translate(sourceSubtitles, editablePrompt, activeTemplate);
  };

  const handleBatchTranslateClick = async () => {
    if (!activeTemplate || sourceSubtitles.length === 0) return;

    const endIdx = parseInt(batchEndInput);
    if (isNaN(endIdx) || endIdx < batchStartIdx || endIdx > batchTotalIndexes) {
      alert(`Please enter a valid ending index between ${batchStartIdx} and ${batchTotalIndexes}.`);
      return;
    }

    resetTranslation();
    const batchSubset = sourceSubtitles.filter(
      sub => sub.index >= batchStartIdx && sub.index <= endIdx
    );
    setActiveSourceSubset(batchSubset); // Lock batch subset
    await translate(batchSubset, editablePrompt, activeTemplate);
  };

  const handleBatchNextClick = () => {
    const endIdx = parseInt(batchEndInput);
    setAccumulatedSubtitles(prev => [...prev, ...translatedSubtitles]);
    resetTranslation();

    const newBatchNum = batchCurrentNum + 1;
    const newStartIdx = endIdx + 1;
    setBatchCurrentNum(newBatchNum);
    setBatchStartIdx(newStartIdx);
    setBatchEndInput('');
  };

  const handleValidateClick = () => {
    if (!translatedFile || uploadedTranslatedSubtitles.length === 0) return;
    setValidateParsed(uploadedTranslatedSubtitles);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleContinueTranslation = async () => {
    if (!activeTemplate || activeSourceSubset.length === 0) return;
    // Use the locked subset instead of recalculating
    await continueTranslation(activeSourceSubset, editablePrompt, activeTemplate);
  };

  // ── Download ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    let finalSubtitles: Subtitle[];

    if (mode === 'batch') {
      finalSubtitles = [...accumulatedSubtitles, ...translatedSubtitles];
    } else if (mode === 'validate') {
      finalSubtitles = validateParsed;
    } else {
      finalSubtitles = translatedSubtitles;
    }

    if (finalSubtitles.length === 0) {
      alert('No translated content to download!');
      return;
    }

    const finalSRT = stringifySRT(finalSubtitles);
    const mainModel = activeTemplate?.mainModel || 'translated';
    const formattedModel = mainModel
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const baseName = sourceFile?.name.replace(/\.srt$/i, '') || 'subtitles';

    let filename: string;
    if (translationCode && translationCode.trim() !== '') {
      filename = `${baseName}(${translationLanguage})(${formattedModel}).${translationCode}.srt`;
    } else if (translationLanguage && translationLanguage.trim() !== '') {
      filename = `${baseName}(${translationLanguage})(${formattedModel}).srt`;
    } else {
      filename = `${baseName}(${formattedModel}).srt`;
    }

    const blob = new Blob([finalSRT], { type: 'text/plain' });

    try {
      // 1. Prompt the user for a save location
      const filePath = await save({
        filters: [{ name: 'Subtitle File', extensions: ['srt'] }],
        defaultPath: filename // Use the dynamically generated filename as default
      });

      // 2. Write the file natively
      if (filePath) {
        await writeTextFile(filePath, finalSRT);
      }
    } catch (err) {
      // 3. Web Fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // ── Derived UI state ──────────────────────────────────────────────────
  const parsedBatchEnd = parseInt(batchEndInput);
  const isLastBatch = mode === 'batch' && !isNaN(parsedBatchEnd) && parsedBatchEnd >= batchTotalIndexes;
  
  // 1. You cannot proceed with normal actions if a translation was cut off by safety filters
  const canProceed = !isPartialTranslation;

  // 2. CRITICAL ERROR CHECK: index.html completely hides all buttons on count mismatch
  const hasCountMismatch = validationSource.length > 0 && displayedTranslated.length > 0 && validationSource.length !== displayedTranslated.length;
  const canShowActions = canProceed && !hasCountMismatch;

  // NEW: Define what a structural, blocking error is (Ignoring Script Warnings)
  const hasStructuralErrors = (validation.timestampMismatches?.length > 0) || (validation.sequenceErrors?.length > 0);

  // 3. Strict Next Batch logic (Allows moving forward if only script warnings remain)
  const showNextBatchBtn = mode === 'batch' && canShowActions && !hasStructuralErrors && !isLastBatch;

  // 4. Strict Download logic (Always shows for Translate/Validate, restricted for Batch unless structurally sound)
  const showDownloadBtn = canShowActions && (
    mode !== 'batch' || (mode === 'batch' && !hasStructuralErrors && isLastBatch)
  );

  // 5. Strict Fix Logic: Index sequence errors are unfixable by AI (requires manual review).
  const hasFixableErrors = (validation.timestampMismatches?.length > 0) || (validation.scriptErrors?.length > 0);
  const showFixBtn = canShowActions && hasFixableErrors;

  const showResults =
    (displayedTranslated.length > 0 || isPartialTranslation) && !isTranslating;

  const isActionDisabled =
    isSourceParsing ||
    isTranslating ||
    !sourceFile ||
    (mode !== 'validate' && !activeTemplate) ||
    (mode === 'validate' && !translatedFile);

  const handleExternalLink = async (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    try {
      // Try to securely open via Tauri's native OS bridge
      await openUrl(url);
    } catch (err) {
      // Failsafe fallback if you ever run this in a normal web browser
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Top Row: CLIProxyAPI Control & Template Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Half: CLIProxyAPI Control */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between h-full gap-4">
            
            {/* Left: Title & Status */}
            <div className="flex flex-col min-w-max">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">CLIProxyAPI</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isProxyLoading ? 'Waiting...' : (isProxyRunning ? 'Status: Online' : 'Status: Offline')}
              </p>
            </div>
            
            {/* Middle: Version Reminder (Hidden on very tiny mobile screens, expands to fill space) */}
            <div className="hidden sm:flex flex-col items-center justify-center text-center flex-1 px-2">
              <span className="text-[10px] md:text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">
                Keep CLIProxyAPI up to date!
              </span>
              
              <div className="flex items-center gap-3 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-mono">
                {latestBrewVersion && (
                  <a 
                    href="https://formulae.brew.sh/formula/cliproxyapi" 
                    onClick={(e) => handleExternalLink(e, "https://formulae.brew.sh/formula/cliproxyapi")}
                    className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors decoration-orange-300 dark:decoration-orange-700 underline-offset-4 hover:underline"
                    title="Check Homebrew Formula"
                  >
                    Brew v{latestBrewVersion}
                  </a>
                )}
                
                {latestProxyVersion && latestBrewVersion && (
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                )}
                
                {latestProxyVersion && (
                  <a 
                    href="https://github.com/router-for-me/CLIProxyAPI/releases" 
                    onClick={(e) => handleExternalLink(e, "https://github.com/router-for-me/CLIProxyAPI/releases")}
                    className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors decoration-indigo-300 dark:decoration-indigo-700 underline-offset-4 hover:underline"
                    title="Check GitHub Releases"
                  >
                    GitHub {latestProxyVersion}
                  </a>
                )}
              </div>
            </div>

            {/* Right: Glass LED Button */}
            <button
              onClick={toggleProxy}
              disabled={isProxyLoading}
              className="group relative flex flex-col lg:flex-row items-center justify-center gap-1.5 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#222] hover:border-gray-300 dark:hover:border-[#444] rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
              title={isProxyRunning ? "Click to Stop CLIProxyAPI" : "Click to Start CLIProxyAPI"}
            >
              <div className="relative flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] overflow-hidden flex-shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 lg:w-5 h-2 lg:h-2.5 bg-gradient-to-b from-white/70 to-transparent dark:from-white/20 rounded-t-full z-10 pointer-events-none"></div>
                <div className={`w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full transition-all duration-500 z-0 ${
                  isProxyRunning 
                    ? 'bg-green-500 shadow-[0_0_12px_2px_rgba(34,197,94,0.8),inset_0_-2px_4px_rgba(0,0,0,0.3)]' 
                    : 'bg-red-500 shadow-[0_0_12px_2px_rgba(239,68,68,0.8),inset_0_-2px_4px_rgba(0,0,0,0.3)]'
                }`}></div>
              </div>

              {/* whitespace-nowrap prevents the text from ever breaking, and lg: handles the sizing */}
              <span className="text-[10px] lg:text-sm font-bold text-gray-700 dark:text-gray-300 leading-none lg:leading-normal whitespace-nowrap">
                {isProxyRunning ? 'STOP' : 'START'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Half: Template Selector (Remains unchanged) */}
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <label htmlFor="template-select" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Active Prompt Template
          </label>
          <select
            id="template-select"
            value={activeTemplate?.id || ''}
            onChange={handleTemplateChange}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50 font-medium text-gray-700 dark:text-gray-300"
          >
            <option value="">-- Select a validated template --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Template Config: Placeholders + Scripts + Prompt Preview */}
      {(activeTemplate || mode === 'validate') && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-6 shadow-sm space-y-6">

          {activeTemplate && activeTemplate.placeholders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Template Variables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTemplate.placeholders.map((ph) => {
                  const safeId = `ph-${ph.replace(/\s+/g, '-').toLowerCase()}`;
                  return (
                    <div key={ph}>
                      <label htmlFor={safeId} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        {ph}
                      </label>
                      <input
                        id={safeId}
                        type="text"
                        value={placeholderValues[ph] || ''}
                        onChange={(e) => setPlaceholderValues({ ...placeholderValues, [ph]: e.target.value })}
                        placeholder="Enter here..."
                        title={`Enter value for ${ph}`}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Script Ranges */}
          <div className={(activeTemplate && activeTemplate.placeholders.length > 0) ? "pt-4 border-t border-gray-100 dark:border-[#1a1a1a]" : ""}>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Allowed Script Ranges (Validation)
            </label>

            <div className="flex flex-wrap gap-2 mb-4">
              {removableScripts.map(script => (
                <div key={script.name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50">
                  {script.name}
                  {script.start !== 0
                    ? ` (U+${script.start.toString(16).padStart(4, '0').toUpperCase()}-U+${script.end.toString(16).padStart(4, '0').toUpperCase()})`
                    : ''}
                  <button
                    onClick={() => handleRemoveScript(script.name)}
                    className="text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-100 font-bold ml-1"
                    title="Remove Script"
                  >×</button>
                </div>
              ))}
              {permanentScripts.map(script => (
                <div key={script.name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 border-gray-300 dark:border-[#444]">
                  {script.name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  list="script-options"
                  value={scriptSearch}
                  onChange={handleScriptSearchChange}
                  onKeyDown={handleAddPredefinedScript}
                  placeholder="Search scripts (e.g., Telugu, Arabic, Chinese)"
                  title="Search predefined language scripts"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
                />
                <datalist id="script-options">
                  {Object.keys(scriptRanges).map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRangeInput}
                  onChange={(e) => setCustomRangeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomRange()}
                  placeholder="Custom: U+0C00-U+0C7F or U+0C00"
                  title="Add custom Unicode range"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
                />
                <button
                  onClick={handleAddCustomRange}
                  title="Add Custom Range"
                  aria-label="Add Custom Range"
                  className="px-4 py-2 bg-gray-200 dark:bg-[#222] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-[#333] transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Prompt Preview */}
          {activeTemplate && (
            <div className="pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Translation Prompt (Preview)
              </label>
              <div
                className="w-full h-auto min-h-[12rem] overflow-visible p-4 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] rounded-lg text-sm text-gray-800 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(previewPrompt) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Mode Slider */}
      <ModeSlider currentMode={mode} setMode={handleSetMode} isProcessing={isTranslating} />

      {/* File Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FileDropzone
            label="Input SRT File (Source)"
            accept=".srt"
            selectedFile={sourceFile}
            onFileSelect={setSourceFile}
          />
          {sourceParseError && <p className="text-red-500 text-xs mt-2">{sourceParseError}</p>}
        </div>
        {mode === 'validate' && (
          <FileDropzone
            label="Translated SRT File (To Validate)"
            accept=".srt"
            selectedFile={translatedFile}
            onFileSelect={setTranslatedFile}
          />
        )}
      </div>

      {/* ── BATCH MODE: Range config ─────────────────────────────────── */}
      {mode === 'batch' && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-6 shadow-sm">
          {sourceSubtitles.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Please upload an Input SRT file to configure batch translation.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-[#141414] rounded-xl p-6 border border-gray-100 dark:border-[#1a1a1a] flex flex-col items-center justify-center">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Subtitles Detected</div>
                <div className="text-4xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">{batchTotalIndexes}</div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] p-6 rounded-xl">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Configure Batch <span className="text-[#667eea]">{batchCurrentNum}</span></h4>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <label htmlFor="batch-start-idx" className="text-xs text-gray-500 mb-1 ml-1">Start Index</label>
                    <input
                      id="batch-start-idx"
                      type="number"
                      value={batchStartIdx}
                      disabled
                      title="Batch Start Index"
                      placeholder={String(batchStartIdx)}
                      aria-label="Batch Start Index"
                      className="w-24 text-center px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-500 font-mono font-medium"
                    />
                  </div>
                  <div className="text-gray-400 mt-5">to</div>
                  <div className="flex flex-col">
                    <label htmlFor="batch-end-idx" className="text-xs text-gray-500 mb-1 ml-1">End Index</label>
                    <input
                      id="batch-end-idx"
                      type="number"
                      value={batchEndInput}
                      onChange={e => setBatchEndInput(e.target.value)}
                      min={batchStartIdx}
                      max={batchTotalIndexes}
                      title="Batch End Index"
                      placeholder={String(batchTotalIndexes)}
                      aria-label="Batch End Index"
                      className="w-24 text-center px-4 py-2.5 bg-white dark:bg-[#141414] border-2 border-[#667eea]/30 focus:border-[#667eea] rounded-lg text-gray-900 dark:text-white font-mono font-medium outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {accumulatedSubtitles.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-2 px-4 rounded-lg">
                  <CheckCircle size={16} />
                  <span>{accumulatedSubtitles.length} subtitle(s) already accumulated from previous batches.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Action Button ─────────────────────────────────────────────── */}
      <div className="pt-0">
        <button
          onClick={
            mode === 'translate'
              ? handleTranslateClick
              : mode === 'batch'
              ? handleBatchTranslateClick
              : handleValidateClick
          }
          disabled={isActionDisabled}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-lg font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isTranslating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {mode === 'validate' ? 'Validating...' : 'Translating...'}
            </>
          ) : (
            <>
              <Play size={20} />
              {mode === 'translate'
                ? 'Start Translation'
                : mode === 'batch'
                ? `Translate Batch ${batchCurrentNum}`
                : 'Validate Files'}
            </>
          )}
        </button>
      </div>

      {/* ── Loading indicator ─────────────────────────────────────────── */}
      {isTranslating && (
        <div className="flex items-center justify-center gap-3 py-6 text-gray-500 dark:text-gray-400 text-sm">
          <Loader2 size={18} className="animate-spin text-[#667eea]" />
          <span>
            {mode === 'validate'
              ? 'Validating...'
              : loadingMessage || 'Processing...'}
          </span>
        </div>
      )}

      {/* ── Error display ─────────────────────────────────────────────── */}
      <div ref={resultsRef}>
      {translationError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Error</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{translationError}</p>
          </div>
        </div>
      )}

      {/* ── Partial Translation Warning ───────────────────────────────── */}
      {isPartialTranslation && !isTranslating && (
        <div className="p-5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                ⚠️ Partial Translation Detected
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Translated {translatedSubtitles.length} of{' '}
                {mode === 'batch'
                  ? sourceSubtitles.filter(
                      s => s.index >= batchStartIdx && s.index <= parseInt(batchEndInput)
                    ).length
                  : sourceSubtitles.length}{' '}
                subtitles. The last entry was removed as it may be incomplete.
              </p>
            </div>
          </div>
          <button
            onClick={handleContinueTranslation}
            disabled={isTranslating}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <SkipForward size={16} />
            Continue Translating
          </button>
        </div>
      )}

      {/* ── Results: Editor + Validation Dashboard ────────────────────── */}
      {showResults && displayedTranslated.length > 0 && (
        <div className="space-y-6">
          <SubtitlesEditor
            initialSubtitles={displayedTranslated}
            onSave={(updated) => {
              if (mode === 'validate') {
                setValidateParsed(updated);
              } else {
                setTranslatedSubtitles(updated);
              }
            }}
          />

          <ValidationDashboard
            sourceSubtitles={sourceSubtitles}
            translatedSubtitles={displayedTranslated}
            validation={validation}
          />

          {/* Action buttons row */}
          {canShowActions && (
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              
              {hasRawOutput && (
                <button
                  onClick={downloadRawOutput}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-[#222] transition-colors"
                >
                  <FileText size={18} />
                  Download Raw Output
                </button>
              )}
              
              {showFixBtn && (
                <button
                  onClick={async () => {
                    const fixed = await fixErrors(
                      validationSource,
                      displayedTranslated,
                      validation.timestampMismatches,
                      validation.scriptErrors,
                      activeTemplate!,
                      editablePrompt,
                      mode === 'validate'
                    );
                    if (fixed && mode === 'validate') {
                      setValidateParsed(fixed);
                    }
                  }}
                  disabled={isTranslating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
                >
                  <Wrench size={18} />
                  {isTranslating ? 'Fixing...' : 'Fix All Errors'}
                </button>
              )}

              {/* Batch: "Continue to Next Batch" button */}
              {showNextBatchBtn && (
                <button
                  onClick={handleBatchNextClick}
                  disabled={isTranslating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                  Continue to Next Batch
                </button>
              )}

              {/* Download button */}
              {showDownloadBtn && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Download size={18} />
                  {mode === 'batch'
                    ? `Download Full SRT (${accumulatedSubtitles.length + translatedSubtitles.length} subtitles)`
                    : 'Download Translated SRT'}
                </button>
              )}

              {/* Failsafe: When batch has errors, still allow downloading accumulated previous batches */}
              {mode === 'batch' && accumulatedSubtitles.length > 0 && validation.hasErrors && (
                <button
                  onClick={async () => {
                    const finalSRT = stringifySRT(accumulatedSubtitles);
                    const defaultName = `${sourceFile?.name.replace(/\.srt$/i, '') || 'subtitles'}_partial.srt`;
                    
                    try {
                      const filePath = await save({
                        filters: [{ name: 'Subtitle File', extensions: ['srt'] }],
                        defaultPath: defaultName
                      });
                      if (filePath) {
                        await writeTextFile(filePath, finalSRT);
                      }
                    } catch (err) {
                      const blob = new Blob([finalSRT], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = defaultName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-[#222] transition-colors"
                >
                  <Download size={18} />
                  Download Accumulated ({accumulatedSubtitles.length} subtitles)
                </button>
              )}
            </div>
          )}
        </div>
      )}
      </div>{/* end resultsRef wrapper */}
    </div>
  );
};