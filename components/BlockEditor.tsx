import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Block, BlockType } from '../types';
import { GripVertical, Plus, Type, CheckSquare, Trash2, Wand2, Bold, Italic, Underline, MoreHorizontal, Heading1, Heading2, Heading3, List } from 'lucide-react';
import { polishText } from '../services/geminiService';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  readOnly?: boolean;
}

// Helper to execute rich text commands
const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, readOnly = false }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  
  const editorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Handle Selection for Floating Toolbar
  useEffect(() => {
    const handleSelection = () => {
        if (readOnly) return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setShowToolbar(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Only show if selection is inside our editor
        const editorContainer = document.getElementById('block-editor-container');
        if (editorContainer && editorContainer.contains(selection.anchorNode)) {
            setToolbarPosition({
                top: rect.top - 45, // Position above text
                left: rect.left // Align left or center
            });
            setShowToolbar(true);
        } else {
            setShowToolbar(false);
        }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [readOnly]);

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    onChange(newBlocks);
  };

  const addBlock = (afterId: string, type: BlockType = BlockType.PARAGRAPH) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: '',
      checked: false,
    };
    const index = blocks.findIndex((b) => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    
    // Focus next tick
    setTimeout(() => {
        setActiveBlockId(newBlock.id);
        const el = editorRefs.current[newBlock.id];
        if (el) {
            el.focus();
        }
    }, 0);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return; // Don't remove last block
    const index = blocks.findIndex(b => b.id === id);
    const prevBlock = blocks[index - 1];
    
    const newBlocks = blocks.filter((b) => b.id !== id);
    onChange(newBlocks);

    if (prevBlock) {
        setTimeout(() => {
            setActiveBlockId(prevBlock.id);
            const el = editorRefs.current[prevBlock.id];
            if (el) {
                el.focus();
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    }
  };

  const toggleBlockType = (type: BlockType) => {
    if (!activeBlockId) return;
    updateBlock(activeBlockId, { type });
    setTimeout(() => {
        editorRefs.current[activeBlockId]?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
    } else if (e.key === 'Backspace' && !block.content) {
      e.preventDefault();
      removeBlock(block.id);
    } else if (e.key === 'ArrowUp') {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx > 0) {
            e.preventDefault();
            const prevId = blocks[idx - 1].id;
            setActiveBlockId(prevId);
            editorRefs.current[prevId]?.focus();
        }
    } else if (e.key === 'ArrowDown') {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx < blocks.length - 1) {
            e.preventDefault();
            const nextId = blocks[idx + 1].id;
            setActiveBlockId(nextId);
            editorRefs.current[nextId]?.focus();
        }
    }
    
    // Markdown Shortcuts
    if (e.key === ' ') {
        const text = e.currentTarget.textContent || '';
        
        // Block Type Shortcuts
        if (text === '#' && block.type !== BlockType.HEADING_1) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.HEADING_1, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '##' && block.type !== BlockType.HEADING_2) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.HEADING_2, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '###' && block.type !== BlockType.HEADING_3) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.HEADING_3, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '[]' && block.type !== BlockType.TODO) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.TODO, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '-' && block.type !== BlockType.BULLET) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.BULLET, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        }

        // Inline Formatting Shortcuts
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.anchorNode?.nodeType === Node.TEXT_NODE) {
            const anchorNode = selection.anchorNode;
            const offset = selection.anchorOffset;
            const textContent = anchorNode.textContent || '';
            const textBefore = textContent.slice(0, offset);

            // Strikethrough (~text~)
            const strikeMatch = textBefore.match(/~(.+?)~$/);
            // Bold (**text**)
            const boldMatch = textBefore.match(/\*\*(.+?)\*\*$/);
            // Italic (*text*)
            const italicMatch = textBefore.match(/\*(.+?)\*$/);

            let match = null;
            let html = '';

            if (strikeMatch) {
                match = strikeMatch;
                html = `<span class="line-through">${match[1]}</span>&nbsp;`;
            } else if (boldMatch) {
                 match = boldMatch;
                 html = `<span class="font-bold">${match[1]}</span>&nbsp;`;
            } else if (italicMatch) {
                 match = italicMatch;
                 html = `<span class="italic">${match[1]}</span>&nbsp;`;
            }

            if (match) {
                e.preventDefault();
                const fullMatchText = match[0];
                const startOffset = offset - fullMatchText.length;
                
                const range = document.createRange();
                range.setStart(anchorNode, startOffset);
                range.setEnd(anchorNode, offset);
                selection.removeAllRanges();
                selection.addRange(range);
                
                document.execCommand('insertHTML', false, html);
            }
        }
    }
  };

  const handleAIImprove = async (block: Block) => {
      if(!block.content) return;
      const plainText = block.content.replace(/<[^>]*>?/gm, ''); 
      const polished = await polishText(plainText);
      updateBlock(block.id, { content: polished });
      if(editorRefs.current[block.id]) {
          editorRefs.current[block.id]!.innerHTML = polished;
      }
  }

  const getBlockStyles = (type: BlockType) => {
      switch(type) {
          case BlockType.HEADING_1: return "text-3xl font-bold mt-6 mb-2 text-gray-900";
          case BlockType.HEADING_2: return "text-2xl font-semibold mt-4 mb-2 text-gray-800";
          case BlockType.HEADING_3: return "text-xl font-semibold mt-3 mb-1 text-gray-800";
          case BlockType.TODO: return "text-base";
          case BlockType.BULLET: return "text-base";
          case BlockType.CODE: return "font-mono bg-gray-100 p-3 rounded-lg text-sm text-gray-800 my-2";
          case BlockType.IMAGE: return "";
          default: return "text-base leading-relaxed py-1 min-h-[1.5em]";
      }
  };

  return (
    <div className="w-full space-y-1 pb-20 relative" id="block-editor-container">
      <style>{`
        [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            display: block;
        }
      `}</style>

      {/* Floating Toolbar */}
      {showToolbar && (
          <div 
            className="fixed z-50 bg-gray-800 text-white rounded-lg shadow-xl flex items-center p-1.5 gap-1 animate-[fadeIn_0.1s_ease-out]"
            style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
          >
              <button type="button" onClick={() => toggleBlockType(BlockType.HEADING_1)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Heading 1"><Heading1 size={14}/></button>
              <button type="button" onClick={() => toggleBlockType(BlockType.HEADING_2)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Heading 2"><Heading2 size={14}/></button>
              <button type="button" onClick={() => toggleBlockType(BlockType.HEADING_3)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Heading 3"><Heading3 size={14}/></button>
              <button type="button" onClick={() => toggleBlockType(BlockType.BULLET)} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Bullet List"><List size={14}/></button>
              
              <div className="w-px h-4 bg-gray-600 mx-1"></div>
              
              <button type="button" onClick={() => execFormat('bold')} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Bold"><Bold size={14}/></button>
              <button type="button" onClick={() => execFormat('italic')} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Italic"><Italic size={14}/></button>
              <button type="button" onClick={() => execFormat('underline')} className="p-1.5 hover:bg-gray-700 rounded transition-colors" title="Underline"><Underline size={14}/></button>
          </div>
      )}

      {blocks.map((block) => (
        <div 
            key={block.id} 
            className="group flex items-start -ml-10 pl-10 relative hover:bg-gray-50/50 rounded transition-colors pr-2"
        >
            {/* Drag Handle & Menu Trigger */}
            <div className="absolute left-0 top-1.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    type="button"
                    onClick={() => addBlock(block.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                    title="Add block below"
                >
                    <Plus size={16} />
                </button>
                <div className="relative group/menu">
                    <button 
                        type="button"
                        className="p-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical size={16} />
                    </button>
                    {/* Hover Menu */}
                    <div className="absolute left-0 top-full hidden group-hover/menu:block z-10 bg-white border border-gray-200 shadow-lg rounded-lg p-1 w-32">
                         <button type="button" onClick={() => removeBlock(block.id)} className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-2">
                             <Trash2 size={12} /> Delete
                         </button>
                         <button type="button" onClick={() => handleAIImprove(block)} className="w-full text-left px-2 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded flex items-center gap-2">
                             <Wand2 size={12} /> AI Polish
                         </button>
                    </div>
                </div>
            </div>

            {/* Block Content */}
            <div className="flex-1 min-w-0 relative flex items-start gap-2">
                {block.type === BlockType.TODO && (
                    <button 
                        type="button"
                        contentEditable={false}
                        className={`mt-1.5 text-gray-400 hover:text-indigo-600 transition-colors ${block.checked ? 'text-indigo-600' : ''}`}
                        onClick={() => updateBlock(block.id, { checked: !block.checked })}
                    >
                        <CheckSquare size={16} />
                    </button>
                )}
                {block.type === BlockType.BULLET && (
                    <span contentEditable={false} className="mt-2 text-gray-400 text-xl leading-none">•</span>
                )}
                
                <div 
                    ref={(el) => { editorRefs.current[block.id] = el; }}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    className={`flex-1 outline-none ${getBlockStyles(block.type)} ${block.checked && block.type === BlockType.TODO ? 'line-through text-gray-400' : ''}`}
                    onKeyDown={(e) => handleKeyDown(e, block)}
                    onInput={(e) => updateBlock(block.id, { content: e.currentTarget.innerHTML })} // Use innerHTML to preserve rich text
                    onFocus={() => setActiveBlockId(block.id)}
                    dangerouslySetInnerHTML={{ __html: block.content }}
                    data-placeholder={block.type === BlockType.PARAGRAPH ? "Type '/' for commands" : `Heading ${block.type.replace('heading_', '')}`}
                />
            </div>
        </div>
      ))}

      <div 
        className="text-gray-300 italic text-sm p-2 cursor-pointer hover:text-gray-500"
        onClick={() => addBlock(blocks.length > 0 ? blocks[blocks.length - 1].id : '')}
      >
          Click to add a block...
      </div>
    </div>
  );
};
