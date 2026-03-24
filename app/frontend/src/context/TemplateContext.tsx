import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TemplateData } from '../utils/templateUtils';
import type { ScriptRange } from '../utils/validationUtils';

export interface SavedTemplate extends TemplateData {
  id: string;
  name: string;
  rawContent: string;
}

interface TemplateContextType {
  templates: SavedTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<SavedTemplate[]>>; // Added here
  saveTemplate: (template: SavedTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  reorderTemplates: (orderedIds: string[]) => Promise<void>;
  activeTemplate: SavedTemplate | null;
  setActiveTemplate: (template: SavedTemplate | null) => void;
  isLoading: boolean;
  
  // NEW: Global state for the Dashboard inputs so they survive tab switching
  placeholderValues: Record<string, string>;
  setPlaceholderValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeScripts: ScriptRange[];
  setActiveScripts: React.Dispatch<React.SetStateAction<ScriptRange[]>>;
}

export const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

const API_URL = 'http://localhost:8080/api/templates';

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<SavedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the new global states
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [activeScripts, setActiveScripts] = useState<ScriptRange[]>([]);

  useEffect(() => {
    const fetchTemplates = () => {
      fetch(API_URL)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          setTemplates(data);
          setIsLoading(false);
        })
        .catch(() => { 
          console.warn("Backend not ready, retrying templates in 1s...");
          setTimeout(fetchTemplates, 1000); 
        });
    };
    
    fetchTemplates();
  }, []);

  const saveTemplate = async (template: SavedTemplate) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      if (response.ok) {
        const saved = await response.json();
        setTemplates(prev => {
          const exists = prev.findIndex(t => t.id === saved.id);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = saved;
            return updated;
          }
          return [...prev, saved];
        });
      }
    } catch (err) {
      console.error("Failed to save template.", err);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (activeTemplate?.id === id) {
        setActiveTemplate(null);
        setPlaceholderValues({});
        setActiveScripts([]);
      }
    } catch (err) {
      console.error("Failed to delete template.", err);
    }
  };

  // NEW: Function to save the order
  const reorderTemplates = async (orderedIds: string[]) => {
    try {
      await fetch(`${API_URL}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderedIds)
      });
    } catch (err) {
      console.error("Failed to save template order.", err);
    }
  };

  return (
    <TemplateContext.Provider value={{ 
      templates, setTemplates, saveTemplate, deleteTemplate, reorderTemplates, activeTemplate, setActiveTemplate, isLoading,
      placeholderValues, setPlaceholderValues, activeScripts, setActiveScripts 
    }}>
      {children}
    </TemplateContext.Provider>
  );
};