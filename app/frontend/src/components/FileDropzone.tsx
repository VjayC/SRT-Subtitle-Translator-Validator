import { useState, useRef } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface FileDropzoneProps {
  label: string;
  accept: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const FileDropzone = ({ label, accept, onFileSelect, selectedFile }: FileDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Generate a safe ID for accessibility linking
  const inputId = label.replace(/\s+/g, '-').toLowerCase();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(accept.replace('.', ''))) {
        onFileSelect(file);
      } else {
        alert(`Invalid file type. Please upload a ${accept} file.`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'relative w-full p-4 flex items-center justify-between border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200',
          isDragOver 
            ? 'bg-[#667eea]/10 border-[#667eea] scale-[1.02]' 
            : selectedFile
              ? 'bg-[#667eea]/5 border-[#667eea]' 
              : 'bg-gray-50 dark:bg-[#141414] border-gray-300 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
        )}
      >
        <input
          id={inputId}
          type="file"
          ref={inputRef}
          accept={accept}
          onChange={handleFileChange}
          title={`Upload ${label}`}
          placeholder={`Upload ${label}`}
          className="hidden"
        />
        
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedFile ? (
            <CheckCircle className="text-[#667eea] flex-shrink-0" size={20} />
          ) : (
            <FileText className="text-gray-400 flex-shrink-0" size={20} />
          )}
          <span className={clsx(
            'truncate text-sm font-medium',
            selectedFile ? 'text-[#667eea]' : 'text-gray-500 dark:text-gray-400'
          )}>
            {selectedFile ? selectedFile.name : `📄 Choose or drag ${accept} file here...`}
          </span>
        </div>
      </div>
    </div>
  );
};