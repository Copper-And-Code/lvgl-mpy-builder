// MicroPython code generator for the LVGL binding of lv_micropython (LVGL 9.3)
import { generateCode } from './codeGenerator';
import { DEFAULT_ARCHITECTURE } from './templateLoader';

export function generateMicroPythonCode(projectData, architecture = DEFAULT_ARCHITECTURE) {
  return generateCode(projectData, 'micropython', architecture);
}

export default generateMicroPythonCode;
