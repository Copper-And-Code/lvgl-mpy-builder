// C code generator for LVGL 9.6 (only non-deprecated APIs, also valid in 9.3)
import { generateCode } from './codeGenerator';
import { DEFAULT_ARCHITECTURE } from './templateLoader';

export function generateCCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  return generateCode(projectData, 'c', architecture);
}

export default generateCCode;
