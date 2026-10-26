// Shared entry point of the C and MicroPython generators: builds the code
// model and renders it with the template of the target architecture.

import { buildProjectCode } from './core/project';
import { commentText } from './core/emit';
import { convertFonts } from './core/fonts';
import { renderTemplate, DEFAULT_ARCHITECTURE } from './templateLoader';

export async function generateCode(projectData, language, architecture = DEFAULT_ARCHITECTURE) {
  // First pass: the custom fonts used, converted before the final pass
  const { fontRequests } = buildProjectCode(projectData, language);
  const fonts = fontRequests.length ? await convertFonts(fontRequests, language) : undefined;
  const project = buildProjectCode(projectData, language, { fonts });
  return renderTemplate(language, architecture, {
    projectName: commentText(projectData.projectName || 'Untitled'),
    generatedDate: new Date().toISOString(),
    hasEventCallbacks: project.eventCallbacks.length > 0,
    eventCallbacks: project.eventCallbacks,
    declarations: project.declarations,
    pageCount: project.pages.length,
    lastPageIndex: project.pages.length - 1,
    baseName: project.baseName,
    pages: project.pages,
  });
}
