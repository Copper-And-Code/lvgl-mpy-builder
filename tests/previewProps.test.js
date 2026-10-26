import { describe, expect, it } from 'vitest';
import { previewProps } from '../src/core/previewProps';

describe('previewProps', () => {
  it('applies custom styles over the widget props', () => {
    const widget = {
      props: { bgColor: '#111111', textColor: '#222222', radius: 2, x: 5 },
      customStyles: { bg_color: '#ff0000', text_font_size: 20, border_width: 3, pad_top: 9 },
    };

    expect(previewProps(widget)).toEqual({
      bgColor: '#ff0000', textColor: '#222222', radius: 2, x: 5, fontSize: 20, borderWidth: 3, padTop: 9,
    });
  });

  it('does not modify the widget', () => {
    const widget = { props: { bgColor: '#111111' }, customStyles: { bg_color: '#ff0000' } };
    previewProps(widget);
    expect(widget.props.bgColor).toBe('#111111');
  });
});
