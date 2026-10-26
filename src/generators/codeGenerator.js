// Shared entry point of the C and MicroPython generators: builds the code
// model and renders it with the template of the target architecture.

import { buildProjectCode } from './core/project';
import { commentText } from './core/emit';
import { loadTemplate, DEFAULT_ARCHITECTURE } from './templateLoader';

export async function generateCode(projectData, language, architecture = DEFAULT_ARCHITECTURE) {
  const project = buildProjectCode(projectData, language);
  const isMultiPage = Array.isArray(projectData.pages) && projectData.pages.length > 0;
  const common = {
    projectName: commentText(projectData.projectName || 'Untitled'),
    generatedDate: new Date().toISOString(),
    hasEventCallbacks: project.eventCallbacks.length > 0,
    eventCallbacks: project.eventCallbacks,
    declarations: project.declarations,
  };

  if (isMultiPage) {
    const template = await loadTemplate(`${language}_multipage`, architecture);
    return template({
      ...common,
      pageCount: project.pages.length,
      lastPageIndex: project.pages.length - 1,
      baseName: project.baseName,
      pages: project.pages,
    });
  }

  const [page] = project.pages;
  const template = await loadTemplate(language, architecture);
  return template({
    ...common,
    canvasWidth: page.width,
    canvasHeight: page.height,
    functionName: `${project.baseName}_create`,
    widgets: page.widgets,
  });
}
