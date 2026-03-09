import { useState, useContext, useEffect } from 'react';
import { TemplateContext } from '../context/TemplateContext';
import { parseTemplate } from '../utils/templateUtils';
import { Plus, Save, Trash2, CheckCircle, AlertCircle, FileText, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

export const TemplateManager = () => {
  const templateContext = useContext(TemplateContext);
  
  if (!templateContext) {
    throw new Error('TemplateManager must be used within a TemplateProvider');
  }

  const { templates, saveTemplate, deleteTemplate } = templateContext;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    if (activeId) {
      const selected = templates.find(t => t.id === activeId);
      if (selected) {
        setTemplateName(selected.name);
        setTemplateContent(selected.rawContent);
        setError(null);
        setSuccess(null);
      }
    }
  }, [activeId, templates]);

  const handleNewTemplate = () => {
    setActiveId(null);
    setTemplateName('');
    setTemplateContent('');
    setError(null);
    setSuccess(null);
  };

  const handleValidateAndSave = async () => {
    setError(null);
    setSuccess(null);

    if (!templateName.trim()) {
      setError('Please provide a name for this template.');
      return;
    }

    if (!templateContent.trim()) {
      setError('Template content cannot be empty.');
      return;
    }

    const parsedData = parseTemplate(templateContent);

    if (!parsedData.isConfigValid) {
      setError(parsedData.errorMessage || 'Invalid Template Configuration.');
      return;
    }

    const newId = activeId || crypto.randomUUID();
    await saveTemplate({
      ...parsedData,
      id: newId,
      name: templateName.trim(),
      rawContent: templateContent
    });

    setActiveId(newId);
    setSuccess('Template validated and saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Sidebar: Saved Templates */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Saved Templates</h2>
          <button 
            onClick={handleNewTemplate}
            title="Create New Template"
            className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 bg-[#667eea] text-white rounded-lg hover:bg-[#764ba2] transition-colors"
          >
            <Plus size={16} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-2 space-y-2">
          {templates.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No templates saved yet.
            </div>
          ) : (
            templates.map((tmpl) => (
              <div 
                key={tmpl.id}
                onClick={() => setActiveId(tmpl.id)}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border',
                  activeId === tmpl.id 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                    : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tmpl.name}
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(tmpl.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete Template"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="w-full lg:w-2/3 flex flex-col overflow-hidden">
        
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl flex flex-col h-full shadow-sm">
          {/* Editor Header */}
          <div className="p-4 border-b border-gray-200 dark:border-[#1a1a1a] flex flex-wrap gap-4 items-center justify-between bg-gray-50/50 dark:bg-[#0f0f0f]/50">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="template-name-input" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Template Name
              </label>
              <input 
                id="template-name-input"
                type="text" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Movie (Tenglish), TV Show (Tenglish)"
                className="w-full px-3 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
              />
            </div>
            <button 
              onClick={handleValidateAndSave}
              className="flex items-center gap-2 mt-5 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Save size={16} /> Validate & Save
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
            {/* Validation Feedback */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-start gap-2">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {/* Collapsible Syntax Guide */}
            <div className="border border-gray-200 dark:border-[#333] rounded-lg overflow-hidden flex-shrink-0">
              <button 
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#141414] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Info size={16} className="text-[#667eea]" /> Template Syntax Guide
                </span>
                {showGuide ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>
              
              {showGuide && (
                <div className="p-4 bg-white dark:bg-[#0a0a0a] text-xs text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-[#333]">
                  <pre className="bg-gray-100 dark:bg-[#141414] border border-gray-200 dark:border-[#222] p-3 rounded-md font-mono text-pink-600 dark:text-pink-400 mb-4 overflow-x-auto whitespace-pre-wrap">
@Config{"\n"}
{"{{"}http://localhost:8317/v1/chat/completions{"}}"}{"\n"}
{"{{"}gemini-3-flash-preview{"}}"} {"{{"}gemini-3.1-pro-preview{"}}"}{"\n"}
{"{{"}Basic Latin{"}}"} {"{{"}Latin Supplement{"}}"} {"{{"}Telugu{"}}"}{"\n"}
{"{{"}TV show{"}}"} {"{{"}Psych{"}}"} {"{{"}2006{"}}"} {"{{"}, S01E01{"}}"} {"{{"}, (Title){"}}"}{"\n\n"}
You are translating subtitles for the {"{{"}Enter movie or TV show{"}}"} {"{{"}Movie/TV Show Name{"}}"} ({"{{"}Release Year{"}}"})...
                  </pre>

                  <h4 className="font-bold text-gray-900 dark:text-white mb-1.5">Configuration Format:</h4>
                  <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-600 dark:text-gray-400">
                    <li><strong>Line 1:</strong> <code className="bg-gray-100 dark:bg-[#222] px-1 rounded">@Config</code> marker</li>
                    <li><strong>Line 2:</strong> API endpoint URL</li>
                    <li><strong>Line 3:</strong> Two model Names for Language Detection and Translation</li>
                    <li><strong>Line 4:</strong> Allowed script ranges (language scripts or Unicode ranges)</li>
                    <li><strong>Line 5:</strong> Default values for placeholders in the prompt body</li>
                    <li><strong>Line 6:</strong> Empty line (required separator)</li>
                    <li><strong>Lines 7+:</strong> Your prompt template with <code className="bg-gray-100 dark:bg-[#222] px-1 rounded">{"{{"}placeholders{"}}"}</code></li>
                  </ul>
                  
                  <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-r-lg">
                    <p className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                      <Info size={14} /> TIP
                    </p>
                    <p className="text-blue-700 dark:text-blue-400">
                      The number of default values on Line 5 <strong>MUST</strong> match the number of unique <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">{"{{"}placeholders{"}}"}</code> in your body text.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Text Area */}
            <div className="flex flex-col flex-1 min-h-[300px]">
              <label htmlFor="template-content-area" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Prompt Template Content
              </label>
              <textarea 
                id="template-content-area"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="Paste your @Config template here..."
                title="Template Content Editor"
                wrap="off"
                className="flex-1 w-full p-4 font-mono text-sm bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#1a1a1a] rounded-lg focus:outline-none focus:border-[#667eea] resize-none text-gray-800 dark:text-gray-300 overflow-x-auto whitespace-pre"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};