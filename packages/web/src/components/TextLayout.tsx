import { useMemo, useCallback, useState } from 'react';
import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

interface TextLayoutProps {
  text: string;
  width: number;
  lineHeight?: number;
  font?: string;
  className?: string;
  whiteSpace?: 'normal' | 'pre-wrap';
}

/**
 * 使用 pretext 进行文本布局测量
 * 用于计算文本高度、行数，支持虚拟化列表
 */
export function useTextLayout(
  text: string,
  width: number,
  options: {
    lineHeight?: number;
    font?: string;
    whiteSpace?: 'normal' | 'pre-wrap';
  } = {}
) {
  const { lineHeight = 24, font = '16px Inter, system-ui, sans-serif', whiteSpace = 'pre-wrap' } = options;

  // 预处理文本（只做一次）
  const prepared = useMemo(() => {
    try {
      return prepare(text, font, { whiteSpace });
    } catch {
      return null;
    }
  }, [text, font, whiteSpace]);

  // 计算布局
  const layoutResult = useMemo(() => {
    if (!prepared) return { height: 0, lineCount: 0 };
    return layout(prepared, width, lineHeight);
  }, [prepared, width, lineHeight]);

  return {
    height: layoutResult.height,
    lineCount: layoutResult.lineCount,
    prepared,
  };
}

/**
 * 获取文本的所有行信息
 */
export function useTextLines(
  text: string,
  width: number,
  options: {
    lineHeight?: number;
    font?: string;
    whiteSpace?: 'normal' | 'pre-wrap';
  } = {}
) {
  const { lineHeight = 24, font = '16px Inter, system-ui, sans-serif', whiteSpace = 'pre-wrap' } = options;

  const preparedWithSegments = useMemo(() => {
    try {
      return prepareWithSegments(text, font, { whiteSpace });
    } catch {
      return null;
    }
  }, [text, font, whiteSpace]);

  const linesResult = useMemo(() => {
    if (!preparedWithSegments) return { height: 0, lineCount: 0, lines: [] as Array<{ text: string; width: number }> };
    return layoutWithLines(preparedWithSegments, width, lineHeight);
  }, [preparedWithSegments, width, lineHeight]);

  return linesResult;
}

/**
 * 文本布局显示组件
 * 使用 pretext 测量并渲染文本
 */
export function TextLayout({
  text,
  width,
  lineHeight = 24,
  font = '16px Inter, system-ui, sans-serif',
  className = '',
  whiteSpace = 'pre-wrap',
}: TextLayoutProps) {
  const { height } = useTextLayout(text, width, { lineHeight, font, whiteSpace });

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        minHeight: `${height}px`,
        lineHeight: `${lineHeight}px`,
        fontFamily: font.split(' ').slice(1).join(' ') || 'inherit',
        fontSize: font.split(' ')[0],
        whiteSpace,
      }}
    >
      {text}
    </div>
  );
}

/**
 * 虚拟化文本列表组件
 * 使用 pretext 测量每个文本项的高度，只渲染可见项
 */
interface VirtualizedTextListProps {
  items: Array<{ id: string; text: string }>;
  containerHeight: number;
  containerWidth: number;
  lineHeight?: number;
  font?: string;
  gap?: number;
  renderItem: (item: { id: string; text: string }, index: number, style: React.CSSProperties) => React.ReactNode;
}

export function VirtualizedTextList({
  items,
  containerHeight,
  containerWidth,
  lineHeight = 24,
  font = '16px Inter, system-ui, sans-serif',
  gap = 8,
  renderItem,
}: VirtualizedTextListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  // 计算每个项的位置信息
  const itemLayouts = useMemo(() => {
    let offsetY = 0;
    return items.map((item) => {
      const { height } = useTextLayout(item.text, containerWidth - 32, { lineHeight, font });
      const layout = {
        id: item.id,
        height: height + gap,
        offsetY,
      };
      offsetY += height + gap;
      return layout;
    });
  }, [items, containerWidth, lineHeight, font, gap]);

  // 总高度
  const totalHeight = useMemo(() => {
    return itemLayouts.reduce((sum, item) => sum + item.height, 0);
  }, [itemLayouts]);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    let start = 0;
    let end = itemLayouts.length - 1;

    for (let i = 0; i < itemLayouts.length; i++) {
      if (itemLayouts[i].offsetY + itemLayouts[i].height > scrollTop) {
        start = i;
        break;
      }
    }

    for (let i = itemLayouts.length - 1; i >= 0; i--) {
      if (itemLayouts[i].offsetY < scrollTop + containerHeight) {
        end = i;
        break;
      }
    }

    return { start, end };
  }, [itemLayouts, scrollTop, containerHeight]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => {
          const layout = itemLayouts[visibleRange.start + index];
          return renderItem(item, visibleRange.start + index, {
            position: 'absolute',
            top: layout?.offsetY ?? 0,
            left: 0,
            right: 0,
            width: containerWidth,
          });
        })}
      </div>
    </div>
  );
}

/**
 * 笔记内容显示组件
 * 使用 pretext 进行高效的文本布局
 */
interface NoteContentViewerProps {
  content: string;
  width?: number;
  className?: string;
}

export function NoteContentViewer({ content, width = 600, className = '' }: NoteContentViewerProps) {
  const lines = useTextLines(content, width - 48, {
    lineHeight: 28,
    font: '16px "Inter", system-ui, sans-serif',
    whiteSpace: 'pre-wrap',
  });

  return (
    <div
      className={`note-content-viewer ${className}`}
      style={{
        width: `${width}px`,
        lineHeight: '28px',
      }}
    >
      {lines.lines?.map((line, index) => (
        <div
          key={index}
          style={{
            height: '28px',
            overflow: 'hidden',
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}

export default TextLayout;
