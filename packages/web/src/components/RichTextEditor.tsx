import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { 
  prepare, 
  layout, 
  prepareWithSegments, 
  layoutWithLines,
  type LayoutLine 
} from '@chenglou/pretext';

// 富文本片段类型
export interface RichTextSegment {
  id: string;
  text: string;
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'list' | 'quote';
  font?: string;
  color?: string;
  break?: 'normal' | 'never'; // 'never' 表示不换行（如标签、提及）
  extraWidth?: number; // 额外宽度（如标签的内边距）
  href?: string; // 链接地址
}

// 富文本文档类型
export interface RichTextDocument {
  blocks: RichTextBlock[];
}

export interface RichTextBlock {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'codeBlock' | 'quote';
  segments: RichTextSegment[];
}

// 字体配置
const FONTS = {
  normal: '16px Inter, system-ui, sans-serif',
  bold: '700 16px Inter, system-ui, sans-serif',
  italic: 'italic 16px Inter, system-ui, sans-serif',
  code: '14px "JetBrains Mono", "Fira Code", monospace',
  heading1: '700 28px Inter, system-ui, sans-serif',
  heading2: '700 24px Inter, system-ui, sans-serif',
  heading3: '600 20px Inter, system-ui, sans-serif',
  small: '14px Inter, system-ui, sans-serif',
};

const LINE_HEIGHT = 28;
const CODE_LINE_HEIGHT = 24;

/**
 * 将纯文本转换为富文本文档
 */
export function textToRichText(text: string): RichTextDocument {
  const lines = text.split('\n');
  const blocks: RichTextBlock[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // 标题检测
    if (line.startsWith('# ')) {
      blocks.push({
        id: `block-${i}`,
        type: 'heading1',
        segments: [{ id: `seg-${i}-0`, text: line.slice(2), type: 'heading' }],
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        id: `block-${i}`,
        type: 'heading2',
        segments: [{ id: `seg-${i}-0`, text: line.slice(3), type: 'heading' }],
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        id: `block-${i}`,
        type: 'heading3',
        segments: [{ id: `seg-${i}-0`, text: line.slice(4), type: 'heading' }],
      });
    }
    // 列表检测
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        id: `block-${i}`,
        type: 'bulletList',
        segments: [{ id: `seg-${i}-0`, text: line.slice(2), type: 'text' }],
      });
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        id: `block-${i}`,
        type: 'numberedList',
        segments: [{ id: `seg-${i}-0`, text: line.replace(/^\d+\.\s/, ''), type: 'text' }],
      });
    }
    // 代码块检测
    else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        id: `block-${i - codeLines.length - 1}`,
        type: 'codeBlock',
        segments: [{ 
          id: `seg-${i}-code`, 
          text: codeLines.join('\n'), 
          type: 'code' 
        }],
      });
    }
    // 引用检测
    else if (line.startsWith('> ')) {
      blocks.push({
        id: `block-${i}`,
        type: 'quote',
        segments: [{ id: `seg-${i}-0`, text: line.slice(2), type: 'text' }],
      });
    }
    // 空行
    else if (line.trim() === '') {
      blocks.push({
        id: `block-${i}`,
        type: 'paragraph',
        segments: [{ id: `seg-${i}-0`, text: '', type: 'text' }],
      });
    }
    // 普通段落
    else {
      // 解析行内格式（粗体、斜体、代码、链接）
      const segments = parseInlineFormats(line, i);
      blocks.push({
        id: `block-${i}`,
        type: 'paragraph',
        segments,
      });
    }
    i++;
  }
  
  return { blocks };
}

// 解析行内格式
function parseInlineFormats(text: string, blockIndex: number): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let segIndex = 0;
  
  // 简单的正则匹配粗体、斜体、代码、链接
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' as const },
    { regex: /\*(.+?)\*/g, type: 'italic' as const },
    { regex: /`(.+?)`/g, type: 'code' as const },
    { regex: /\[(.+?)\]\((.+?)\)/g, type: 'link' as const },
  ];
  
  let remaining = text;
  
  // 简化处理：直接按顺序匹配
  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; type: typeof patterns[0]['type']; content: string; href?: string } | null = null;
    
    for (const { regex, type } of patterns) {
      regex.lastIndex = 0;
      const match = regex.exec(remaining);
      if (match && (earliestMatch === null || match.index < earliestMatch.index)) {
        earliestMatch = {
          index: match.index,
          length: match[0].length,
          type,
          content: match[1],
          href: type === 'link' ? match[2] : undefined,
        };
      }
    }
    
    if (earliestMatch) {
      // 添加匹配前的文本
      if (earliestMatch.index > 0) {
        segments.push({
          id: `seg-${blockIndex}-${segIndex++}`,
          text: remaining.slice(0, earliestMatch.index),
          type: 'text',
        });
      }
      
      // 添加匹配的内容
      segments.push({
        id: `seg-${blockIndex}-${segIndex++}`,
        text: earliestMatch.content,
        type: earliestMatch.type,
        href: earliestMatch.href,
      });
      
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      // 没有匹配，添加剩余文本
      if (remaining.length > 0) {
        segments.push({
          id: `seg-${blockIndex}-${segIndex++}`,
          text: remaining,
          type: 'text',
        });
      }
      break;
    }
  }
  
  return segments.length > 0 ? segments : [{ id: `seg-${blockIndex}-0`, text, type: 'text' }];
}

/**
 * 将富文本文档转换为纯文本
 */
export function richTextToText(doc: RichTextDocument): string {
  return doc.blocks.map(block => {
    const text = block.segments.map(s => s.text).join('');
    
    switch (block.type) {
      case 'heading1': return `# ${text}`;
      case 'heading2': return `## ${text}`;
      case 'heading3': return `### ${text}`;
      case 'bulletList': return `- ${text}`;
      case 'numberedList': return `1. ${text}`;
      case 'codeBlock': return `\`\`\`\n${text}\n\`\`\``;
      case 'quote': return `> ${text}`;
      default: return text;
    }
  }).join('\n');
}

/**
 * 使用 pretext 测量富文本块的高度
 */
export function useRichTextLayout(block: RichTextBlock, width: number) {
  const getFont = useCallback((segment: RichTextSegment): string => {
    switch (segment.type) {
      case 'bold': return FONTS.bold;
      case 'italic': return FONTS.italic;
      case 'code': return FONTS.code;
      case 'heading':
        switch (block.type) {
          case 'heading1': return FONTS.heading1;
          case 'heading2': return FONTS.heading2;
          case 'heading3': return FONTS.heading3;
          default: return FONTS.normal;
        }
      default: return FONTS.normal;
    }
  }, [block.type]);

  const lineHeight = block.type === 'codeBlock' ? CODE_LINE_HEIGHT : LINE_HEIGHT;

  // 使用 pretext 测量文本
  const prepared = useMemo(() => {
    const text = block.segments.map(s => s.text).join('');
    const font = block.segments[0] ? getFont(block.segments[0]) : FONTS.normal;
    
    try {
      return prepareWithSegments(text, font, { whiteSpace: 'pre-wrap' });
    } catch {
      return null;
    }
  }, [block.segments, getFont]);

  const layoutResult = useMemo(() => {
    if (!prepared) return { height: lineHeight, lineCount: 1, lines: [] };
    return layoutWithLines(prepared, width, lineHeight);
  }, [prepared, width, lineHeight]);

  return {
    height: layoutResult.height,
    lineCount: layoutResult.lineCount,
    lines: layoutResult.lines,
  };
}

/**
 * 富文本查看器组件
 */
interface RichTextViewerProps {
  content: string;
  width?: number;
  className?: string;
}

export function RichTextViewer({ content, width = 700, className = '' }: RichTextViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualWidth, setActualWidth] = useState(width);
  
  // 监听宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setActualWidth(containerRef.current.clientWidth - 32);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 转换为富文本文档
  const doc = useMemo(() => textToRichText(content), [content]);

  return (
    <div ref={containerRef} className={`rich-text-viewer ${className}`}>
      {doc.blocks.map((block) => (
        <RichTextBlockView key={block.id} block={block} width={actualWidth} />
      ))}
    </div>
  );
}

/**
 * 富文本块视图
 */
function RichTextBlockView({ block, width }: { block: RichTextBlock; width: number }) {
  const { height } = useRichTextLayout(block, width);
  const text = block.segments.map(s => s.text).join('');
  
  const baseStyle: React.CSSProperties = {
    minHeight: `${height}px`,
    lineHeight: block.type === 'codeBlock' ? `${CODE_LINE_HEIGHT}px` : `${LINE_HEIGHT}px`,
  };

  // 根据块类型应用样式
  const getBlockStyle = (): React.CSSProperties => {
    switch (block.type) {
      case 'heading1':
        return { ...baseStyle, fontSize: '28px', fontWeight: 700, marginTop: '24px', marginBottom: '16px' };
      case 'heading2':
        return { ...baseStyle, fontSize: '24px', fontWeight: 700, marginTop: '20px', marginBottom: '12px' };
      case 'heading3':
        return { ...baseStyle, fontSize: '20px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' };
      case 'bulletList':
        return { ...baseStyle, paddingLeft: '24px', position: 'relative' };
      case 'numberedList':
        return { ...baseStyle, paddingLeft: '24px', position: 'relative' };
      case 'codeBlock':
        return { 
          ...baseStyle, 
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '14px',
          backgroundColor: '#f6f8fa',
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
        };
      case 'quote':
        return { 
          ...baseStyle, 
          borderLeft: '4px solid #e5e7eb',
          paddingLeft: '16px',
          color: '#6b7280',
          fontStyle: 'italic',
        };
      default:
        return { ...baseStyle, marginBottom: '12px' };
    }
  };

  // 渲染块内容
  const renderContent = () => {
    if (block.type === 'bulletList') {
      return (
        <>
          <span style={{ position: 'absolute', left: 0 }}>•</span>
          {block.segments.map((seg) => (
            <RichTextSegmentView key={seg.id} segment={seg} />
          ))}
        </>
      );
    }
    
    if (block.type === 'codeBlock') {
      return <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</pre>;
    }

    return block.segments.map((seg) => (
      <RichTextSegmentView key={seg.id} segment={seg} />
    ));
  };

  return (
    <div style={getBlockStyle()}>
      {renderContent()}
    </div>
  );
}

/**
 * 富文本片段视图
 */
function RichTextSegmentView({ segment }: { segment: RichTextSegment }) {
  const style: React.CSSProperties = {};
  
  switch (segment.type) {
    case 'bold':
      style.fontWeight = 700;
      break;
    case 'italic':
      style.fontStyle = 'italic';
      break;
    case 'code':
      return (
        <code style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '14px',
          backgroundColor: '#f3f4f6',
          padding: '2px 6px',
          borderRadius: '4px',
          color: '#e11d48',
        }}>
          {segment.text}
        </code>
      );
    case 'link':
      return (
        <a 
          href={segment.href} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#7c3aed', textDecoration: 'underline' }}
        >
          {segment.text}
        </a>
      );
    case 'heading':
      // 标题样式由块处理
      break;
  }
  
  return <span style={style}>{segment.text}</span>;
}

/**
 * 富文本编辑器组件
 */
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  width = 700,
  height = 400,
  className = '',
  placeholder = '开始输入... 支持 Markdown 格式',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  // 使用 pretext 测量文本高度
  const layout = useTextLayout(content, width - 32, {
    lineHeight: LINE_HEIGHT,
    font: FONTS.normal,
    whiteSpace: 'pre-wrap',
  });

  // 处理文本变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  // 插入格式
  const insertFormat = useCallback((format: 'bold' | 'italic' | 'code' | 'link' | 'heading') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    
    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        newText = `**${selectedText || '粗体文本'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || '斜体文本'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'code':
        newText = `\`${selectedText || '代码'}\``;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'link':
        newText = `[${selectedText || '链接文本'}](url)`;
        cursorOffset = selectedText ? selectedText.length + 3 : 1;
        break;
      case 'heading':
        newText = `# ${selectedText || '标题'}`;
        cursorOffset = 2;
        break;
    }

    const newContent = content.slice(0, start) + newText + content.slice(end);
    onChange(newContent);

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }, [content, onChange]);

  // 插入块格式
  const insertBlock = useCallback((block: 'quote' | 'code' | 'list') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    
    let newText = '';
    
    switch (block) {
      case 'quote':
        newText = `> ${selectedText || '引用文本'}`;
        break;
      case 'code':
        newText = `\`\`\`\n${selectedText || '代码块'}\n\`\`\``;
        break;
      case 'list':
        newText = `- ${selectedText || '列表项'}`;
        break;
    }

    const newContent = content.slice(0, start) + newText + content.slice(end);
    onChange(newContent);
  }, [content, onChange]);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          insertFormat('italic');
          break;
        case 'k':
          e.preventDefault();
          insertFormat('link');
          break;
      }
    }
    
    // Tab 缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const newContent = content.slice(0, start) + '  ' + content.slice(start);
      onChange(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  }, [insertFormat, content, onChange]);

  return (
    <div className={`rich-text-editor ${className}`} style={{ width }}>
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <ToolbarButton onClick={() => insertFormat('bold')} title="粗体 (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat('italic')} title="斜体 (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat('code')} title="行内代码">
          <code className="text-sm">&lt;/&gt;</code>
        </ToolbarButton>
        <ToolbarButton onClick={() => insertFormat('link')} title="链接 (Ctrl+K)">
          🔗
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => insertFormat('heading')} title="标题">
          H
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock('quote')} title="引用">
          ❝
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock('code')} title="代码块">
          📝
        </ToolbarButton>
        <ToolbarButton onClick={() => insertBlock('list')} title="列表">
          ≡
        </ToolbarButton>
        <div className="flex-1" />
        <button
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 text-sm rounded ${isPreview ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          {isPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 编辑/预览区域 */}
      <div className="border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
        {isPreview ? (
          <div className="p-4 bg-white" style={{ minHeight: height }}>
            <RichTextViewer content={content} width={width - 32} />
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full p-4 resize-none focus:outline-none font-mono text-sm"
              style={{ 
                height: Math.max(height, layout.height + 32),
                minHeight: height,
              }}
            />
            {/* 行号和统计 */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {layout.lineCount} 行 | {content.length} 字符
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 工具栏按钮
function ToolbarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
    >
      {children}
    </button>
  );
}

/**
 * Hook: 文本布局测量
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
  const { lineHeight = 24, font = FONTS.normal, whiteSpace = 'pre-wrap' } = options;

  const prepared = useMemo(() => {
    try {
      return prepare(text, font, { whiteSpace });
    } catch {
      return null;
    }
  }, [text, font, whiteSpace]);

  const layoutResult = useMemo(() => {
    if (!prepared) return { height: 0, lineCount: 0 };
    return layout(prepared, width, lineHeight);
  }, [prepared, width, lineHeight]);

  return layoutResult;
}

/**
 * Hook: 获取文本行信息
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
  const { lineHeight = 24, font = FONTS.normal, whiteSpace = 'pre-wrap' } = options;

  const preparedWithSegments = useMemo(() => {
    try {
      return prepareWithSegments(text, font, { whiteSpace });
    } catch {
      return null;
    }
  }, [text, font, whiteSpace]);

  const linesResult = useMemo(() => {
    if (!preparedWithSegments) return { height: 0, lineCount: 0, lines: [] as LayoutLine[] };
    return layoutWithLines(preparedWithSegments, width, lineHeight);
  }, [preparedWithSegments, width, lineHeight]);

  return linesResult;
}

export default RichTextEditor;
