// Shared entry point of the C and MicroPython generators: builds the code
// model and renders it with the template of the target architecture.

import { buildProjectCode } from './core/project';
import { commentText } from './core/emit';
import { loadTemplate, DEFAULT_ARCHITECTURE } from './templateLoader';

export async function generateCode(projectData, language, architecture = DEFAULT_ARCHITECTURE) {
  const project = buildProjectCode(projectData, language);
  const template = await loadTemplate(`${language}_multipage`, architecture);
  return template({
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
