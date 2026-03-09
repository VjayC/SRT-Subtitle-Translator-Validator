import { parseScriptInput } from './validationUtils'; // <-- Add this import

export interface TemplateData {
  endpointUrl: string;
  liteModel: string;
  mainModel: string;
  scripts: string[];
  defaultValues: string[];
  bodyText: string;
  placeholders: string[];
  isConfigValid: boolean;
  errorMessage?: string;
}

export const parseTemplate = (rawContent: string): TemplateData => {
  const defaultReturn: TemplateData = {
    endpointUrl: '',
    liteModel: '',
    mainModel: '',
    scripts: [],
    defaultValues: [],
    bodyText: rawContent,
    placeholders: [],
    isConfigValid: false
  };

  const lines = rawContent.split('\n');

  // Enforce @Config rule
  if (!lines[0] || lines[0].trim() !== '@Config') {
    return {
      ...defaultReturn,
      errorMessage: "Template MUST start with '@Config' on the first line."
    };
  }

  // Enforce minimum line count for header
  if (lines.length < 6) {
    return {
      ...defaultReturn,
      errorMessage: "Invalid configuration header format. Ensure you have all 6 lines (including the empty 6th line separator)."
    };
  }

  // Enforce empty 6th line
  if (lines[5].trim() !== '') {
    return {
      ...defaultReturn,
      errorMessage: "Line 6 MUST be completely empty to separate the configuration from the prompt body."
    };
  }

  try {
    const extractTags = (line: string): string[] => {
      const tags: string[] = [];
      const regex = /\{\{(.*?)\}\}/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        tags.push(match[1]);
      }
      return tags;
    };

    const urlTags = extractTags(lines[1]);
    if (urlTags.length !== 1) throw new Error("Line 2 must contain exactly one API endpoint in {{}} tags (can be empty).");
    const endpointUrl = urlTags[0];

    const modelTags = extractTags(lines[2]);
    if (modelTags.length !== 2) throw new Error("Line 3 must contain exactly two models (lite and main) in {{}} tags (can be empty).");
    const liteModel = modelTags[0];
    const mainModel = modelTags[1];

    const scripts = extractTags(lines[3]);
    if (scripts.length === 0) throw new Error("Line 4 must contain at least one allowed script range in {{}} tags.");
    
    // Validate each script/range using your existing logic
    for (const script of scripts) {
      if (!parseScriptInput(script)) {
        throw new Error(`Invalid language script or Unicode range on Line 4: "${script}"`);
      }
    }

    const defaultValues = extractTags(lines[4]);
    
    // Parse Body text (Everything from line 7 onwards)
    const bodyText = lines.slice(6).join('\n');
    
    // Extract unique placeholders from body
    const placeholders: string[] = [];
    const bodyRegex = /\{\{(.*?)\}\}/g;
    let match;
    while ((match = bodyRegex.exec(bodyText)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }

    // Enforce matching placeholder count
    if (defaultValues.length !== placeholders.length) {
      throw new Error(`Line 5 contains ${defaultValues.length} default values, but the prompt body contains ${placeholders.length} unique placeholders. They must match exactly.`);
    }

    return {
      endpointUrl,
      liteModel,
      mainModel,
      scripts,
      defaultValues,
      bodyText,
      placeholders,
      isConfigValid: true
    };
  } catch (err: any) {
    return { ...defaultReturn, errorMessage: err.message };
  }
};