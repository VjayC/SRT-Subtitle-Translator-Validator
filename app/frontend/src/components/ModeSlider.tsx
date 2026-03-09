import { clsx } from 'clsx';

export type AppMode = 'translate' | 'batch' | 'validate';

interface ModeSliderProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  isProcessing: boolean;
}

export const ModeSlider = ({ currentMode, setMode, isProcessing }: ModeSliderProps) => {
  const modes: { id: AppMode; label: string; tooltip: string }[] = [
    { id: 'translate', label: 'Translate', tooltip: 'For translating the entire file. Recommended for SRT files with around 800 to 900 indexes.' },
    { id: 'batch', label: 'Batch Translate', tooltip: 'For translating the file in batches. Recommended for files with over 900 indexes.' },
    { id: 'validate', label: 'Validate', tooltip: 'For validating an already translated SRT file.' },
  ];

  // Calculate the position of the sliding background accurately taking padding into account
  const activeIndex = modes.findIndex(m => m.id === currentMode);

  return (
    <div 
      className={clsx(
        "relative flex bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-1 mb-6 transition-opacity",
        isProcessing && "opacity-50 pointer-events-none" // Disable while processing
      )}
    >
      {/* Sliding Background */}
      <div 
        className="absolute top-1 bottom-1 bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 dark:from-[#667eea]/30 dark:to-[#764ba2]/30 rounded-lg transition-all duration-300 ease-out z-0"
        style={{ 
          width: 'calc(33.333% - 2.66px)',
          left: `calc(${activeIndex * 33.333}% + ${4 - activeIndex * 2.66}px)`
        }}
      />
      
      {/* Mode Buttons */}
      {modes.map((mode) => (
        <div key={mode.id} className="flex-1 relative group flex justify-center">
          <button
            onClick={() => setMode(mode.id)}
            className={clsx(
              "w-full relative z-10 py-3 text-sm font-medium rounded-lg transition-colors duration-200",
              currentMode === mode.id 
                ? "text-[#667eea] dark:text-[#889cf4]" 
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {mode.label}
          </button>
          
          {/* Custom Native Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[220px] p-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs text-center rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
            {mode.tooltip}
            {/* Tooltip Arrow Pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
          </div>
        </div>
      ))}
    </div>
  );
};