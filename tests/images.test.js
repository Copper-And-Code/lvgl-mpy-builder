import { describe, expect, it } from 'vitest';
import { JPEG_DATA_URL, PNG_DATA_URL, allWidgetsProject } from './fixtures/projects';
import { cByteLines, imageInfo, parseDataUrl } from '../src/generators/core/images';
import { buildProjectCode } from '../src/generators/core/project';

describe('images', () => {
  it('reads PNG and JPEG sizes', () => {
    expect(imageInfo(parseDataUrl(PNG_DATA_URL).bytes)).toEqual({ format: 'png', width: 6, height: 4 });
    expect(imageInfo(parseDataUrl(JPEG_DATA_URL).bytes)).toEqual({ format: 'jpeg', width: 8, height: 5 });
    expect(imageInfo(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it('rejects data URLs that are not base64', () => {
    expect(parseDataUrl('data:image/png,abc')).toBeNull();
    expect(parseDataUrl('not a url')).toBeNull();
  });

  it('formats C byte arrays', () => {
    expect(cByteLines(new Uint8Array([0, 15, 255]), 2)).toEqual(['0x00, 0x0f,', '0xff,']);
  });

  it('embeds each asset once, uses paths for other sources and skips unsupported formats', () => {
    const c = buildProjectCode(allWidgetsProject(), 'c');
    const py = buildProjectCode(allWidgetsProject(), 'micropython');

    expect(c.declarations.match(/static const lv_image_dsc_t img_logo = \{/g)).toHaveLength(1);
    expect(c.declarations).toContain('.header.cf = LV_COLOR_FORMAT_RAW_ALPHA');
    expect(c.declarations).toContain('.header.cf = LV_COLOR_FORMAT_RAW,');
    expect(c.declarations).toContain('Images loaded from files need an LVGL file system driver: A:images/background.png');
    expect(c.declarations).toContain('Not generated (only PNG and JPEG images are supported): anim.gif');
    const cCode = c.pages[0].widgets.join('\n');
    expect(cCode).toContain('lv_image_set_src(ui_image_widget, &img_logo);');
    expect(cCode).toContain('lv_image_set_src(ui_image_from_file, "A:images/background.png");');
    expect(cCode).not.toContain('lv_image_set_src(ui_image_gif');

    expect(py.declarations).toContain('img_photo = lv.image_dsc_t(');
    expect(py.pages[0].widgets.join('\n')).toContain('image_widget.set_src(img_logo)');
  });
});
