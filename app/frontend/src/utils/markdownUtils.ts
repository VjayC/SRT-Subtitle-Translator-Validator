export const parseMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Fix Tables: Add explicit border and background classes to th and td
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm;
  html = html.replace(tableRegex, function(_match, headerRow, bodyRows) {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter((h: string) => h);
      const headerHtml = '<tr>' + headers.map((h: string) => '<th class="border border-gray-300 dark:border-[#444] bg-gray-100 dark:bg-[#222] px-4 py-2 text-left font-semibold">' + h + '</th>').join('') + '</tr>';
      const rows = bodyRows.trim().split('\n');
      const bodyHtml = rows.map((row: string) => {
          const cells = row.split('|').map((c: string) => c.trim()).filter((c: string) => c);
          return '<tr>' + cells.map((c: string) => '<td class="border border-gray-300 dark:border-[#444] px-4 py-2">' + c.replace(/&lt;br&gt;/g, '<br>') + '</td>').join('') + '</tr>';
      }).join('');
      return '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 dark:border-[#444] text-sm">' + headerHtml + bodyHtml + '</table></div>';
  });

  // Fix Lists: Dynamic list-style based on nesting depth
  let lines = html.split('\n');
  let result = [];
  let listStack: { type: string, indent: number }[] = []; 
  
  const getListStyle = (type: string, depth: number) => {
      if (type === 'ol') return 'list-decimal';
      if (depth === 0) return 'list-disc';
      if (depth === 1) return 'list-[circle]';
      return 'list-[square]';
  };

  for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);

      if (match) {
          let indent = match[1].length;
          let isOrdered = /^\d+\./.test(match[2]);
          let listType = isOrdered ? 'ol' : 'ul';
          let content = match[3];

          if (listStack.length === 0) {
              result.push(`<${listType} class="${getListStyle(listType, 0)} ml-6 mb-2">`);
              listStack.push({ type: listType, indent: indent });
          } else {
              let lastItem = listStack[listStack.length - 1];

              if (indent > lastItem.indent) {
                  result.push(`<${listType} class="${getListStyle(listType, listStack.length)} ml-6 my-1">`);
                  listStack.push({ type: listType, indent: indent });
              } else if (indent < lastItem.indent) {
                  while (listStack.length > 0 && indent < listStack[listStack.length - 1].indent) {
                      let closed = listStack.pop()!;
                      result.push(`</${closed.type}>`);
                  }
                  if (listStack.length > 0 && listStack[listStack.length - 1].type !== listType) {
                      let closed = listStack.pop()!;
                      result.push(`</${closed.type}><${listType} class="${getListStyle(listType, listStack.length)} ml-6 mb-2">`);
                      listStack.push({ type: listType, indent: indent });
                  }
              } else {
                  if (lastItem.type !== listType) {
                      listStack.pop();
                      result.push(`</${lastItem.type}><${listType} class="${getListStyle(listType, listStack.length)} ml-6 mb-2">`);
                      listStack.push({ type: listType, indent: indent });
                  }
              }
          }
          result.push(`<li>${content}</li>`);
      } else {
          while (listStack.length > 0) {
              let closed = listStack.pop()!;
              result.push(`</${closed.type}>`);
          }
          result.push(line);
      }
  }
  while (listStack.length > 0) {
      let closed = listStack.pop()!;
      result.push(`</${closed.type}>`);
  }
  html = result.join('\n');

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 border-b pb-2">$1</h1>');
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-600 dark:text-gray-400">$1</blockquote>');
  html = html.replace(/\^\^(.*?)\^\^/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/60 text-gray-900 dark:text-gray-100 px-0 rounded font-semibold">$1</mark>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-[#222] px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono text-sm">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline">$1</a>');
  html = html.replace(/ {2,}\n/g, '<br>\n'); 

  let finalLines = html.split('\n');
  let groupedHtml = [];
  let pBuffer: string[] = []; 

  const flushBuffer = () => {
      if (pBuffer.length > 0) {
          groupedHtml.push(`<p class="mb-4">${pBuffer.join('\n')}</p>`); 
          pBuffer = [];
      }
  };

  const blockTags = ['<h', '<ul', '<ol', '<li', '<block', '<pre', '<table', '<div', '</ul', '</ol', '</li', '</table', '</block', '</pre', '</div', '</h'];
  const isBlock = (line: string) => blockTags.some(tag => line.trim().startsWith(tag));

  for (let i = 0; i < finalLines.length; i++) {
      let line = finalLines[i];
      if (isBlock(line) || line.trim() === '') {
          flushBuffer();
          if (line.trim() !== '') groupedHtml.push(line);
      } else {
          pBuffer.push(line);
      }
  }
  flushBuffer();

  return groupedHtml.join('\n');
};