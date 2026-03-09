import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { stringifySRT, parseSRT } from '../utils/srtUtils';
import type { Subtitle } from '../utils/srtUtils';

interface SubtitlesEditorProps {
  initialSubtitles: Subtitle[];
  onSave: (updatedSubtitles: Subtitle[]) => void;
}

export const SubtitlesEditor = ({ initialSubtitles, onSave }: SubtitlesEditorProps) => {
  const [content, setContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize content when props change
  useEffect(() => {
    setContent(stringifySRT(initialSubtitles));
  }, [initialSubtitles]);

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current && !isCollapsed) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, isCollapsed]);

  const handleSave = () => {
    const updatedSubtitles = parseSRT(content);
    onSave(updatedSubtitles);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-sm mt-6 transition-all duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-[#1a1a1a] bg-gray-50/50 dark:bg-[#0f0f0f]/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          📝 Translated SRT Content
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-[#1a1a1a] hover:bg-gray-300 dark:hover:bg-[#222] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={16} /> {isSaved ? 'Saved!' : 'Save Edits'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[300px] p-4 font-mono text-sm bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:border-[#667eea] dark:focus:border-[#667eea] text-gray-800 dark:text-gray-300 resize-none overflow-hidden"
            placeholder="Translated content will appear here..."
          />
        </div>
      )}

      {/* Toggle Bottom Bar */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="py-2.5 bg-gray-50 dark:bg-[#141414] border-t border-gray-200 dark:border-[#1a1a1a] flex justify-center items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-gray-500 dark:text-gray-400 text-sm font-medium"
      >
        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        {isCollapsed ? 'Expand Editor' : 'Collapse Editor'}
      </div>
    </div>
  );
};