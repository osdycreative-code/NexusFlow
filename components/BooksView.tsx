
import React, { useState, useContext, useEffect } from 'react';
import { StoreContext } from '../App';
import { Book, Chapter, BookStatus } from '../types';
import { Plus, BookOpen, PenTool, Trash2, ChevronRight, Save, Layout, List as ListIcon, Loader2 } from 'lucide-react';
import { supabaseService, TABLES } from '../services/supabaseService';

export const BooksView: React.FC = () => {
    const { activeListId, updateList } = useContext(StoreContext);
    const [books, setBooks] = useState<Book[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    
    // Create/Edit States
    const [isCreatingBook, setIsCreatingBook] = useState(false);
    const [newBookTitle, setNewBookTitle] = useState('');
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    
    // Content Editor State
    const [chapterContent, setChapterContent] = useState('');

    useEffect(() => {
        loadBooksAndChapters();
    }, [activeListId]);

    const loadBooksAndChapters = async () => {
        setIsLoading(true);
        try {
            const allBooks = await supabaseService.getAll<Book>(TABLES.BOOKS);
            const listBooks = allBooks.filter(b => b.listId === activeListId);
            setBooks(listBooks);

            if (listBooks.length > 0 && !selectedBookId) {
                // Determine chapters for the first book or just load all for simplicity if small data set
                // Optimized: Load all chapters for ALL books in this list (or just lazily load)
                // For MVP, loading all
                const allChapters = await supabaseService.getAll<Chapter>(TABLES.CHAPTERS);
                setChapters(allChapters);
            } else if (selectedBookId) {
                 const allChapters = await supabaseService.getAll<Chapter>(TABLES.CHAPTERS);
                 setChapters(allChapters);
            }
        } catch (error) {
            console.error("Error loading books:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBookTitle.trim() || !activeListId) return;

        const newBook: Book = {
            id: crypto.randomUUID(),
            listId: activeListId,
            title: newBookTitle,
            author: 'Me', // Todo: Get from User Profile
            genre: 'General',
            description: '',
            status: BookStatus.DRAFT,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const created = await supabaseService.addItem<Book>(TABLES.BOOKS, newBook);
            setBooks(prev => [...prev, created]);
            setNewBookTitle('');
            setIsCreatingBook(false);
            setSelectedBookId(created.id);
        } catch (err) {
            console.error("Failed to create book", err);
        }
    };

    const handleCreateChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChapterTitle.trim() || !selectedBookId) return;

        const bookChapters = chapters.filter(c => c.bookId === selectedBookId);
        
        const newChapter: Chapter = {
            id: crypto.randomUUID(),
            bookId: selectedBookId,
            title: newChapterTitle,
            content: '',
            order: bookChapters.length,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const created = await supabaseService.addItem<Chapter>(TABLES.CHAPTERS, newChapter);
            setChapters(prev => [...prev, created]);
            setNewChapterTitle('');
            setIsCreatingChapter(false);
            setSelectedChapterId(created.id);
            setChapterContent('');
        } catch (err) {
            console.error("Failed to create chapter", err);
        }
    };

    const handleSaveChapterContent = async () => {
        if (!selectedChapterId) return;
        
        try {
            await supabaseService.updateItem(TABLES.CHAPTERS, selectedChapterId, { 
                content: chapterContent,
                updatedAt: new Date()
            });
            // Update local state
            setChapters(prev => prev.map(c => c.id === selectedChapterId ? { ...c, content: chapterContent } : c));
        } catch (err) {
            console.error("Failed to save chapter", err);
        }
    };
    
    // Load content when a chapter is selected
    useEffect(() => {
        if (selectedChapterId) {
            const chapter = chapters.find(c => c.id === selectedChapterId);
            if (chapter) setChapterContent(chapter.content || '');
        }
    }, [selectedChapterId, chapters]);

    // Handle initial selection
    useEffect(() => {
        if (books.length > 0 && !selectedBookId) setSelectedBookId(books[0].id);
    }, [books]);

    if(isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-indigo-500" /></div>;

    const activeChapters = chapters.filter(c => c.bookId === selectedBookId).sort((a,b) => a.order - b.order);

    return (
        <div className="flex h-full">
            {/* Sidebar: Books & Chapters List */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">My Books</h2>
                    
                    {/* Book List */}
                     <div className="space-y-1 mb-4">
                        {books.map(book => (
                            <button
                                key={book.id}
                                onClick={() => { setSelectedBookId(book.id); setSelectedChapterId(null); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                                    ${selectedBookId === book.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}
                                `}
                            >
                                <BookOpen size={16} />
                                <span className="truncate">{book.title}</span>
                            </button>
                        ))}
                    </div>

                    {!isCreatingBook ? (
                         <button 
                            onClick={() => setIsCreatingBook(true)}
                            className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors px-2"
                        >
                            <Plus size={14} /> New Book
                        </button>
                    ) : (
                        <form onSubmit={handleCreateBook} className="mt-2">
                             <input 
                                autoFocus
                                type="text"
                                value={newBookTitle}
                                onChange={(e) => setNewBookTitle(e.target.value)}
                                placeholder="Book Title..."
                                className="w-full text-sm px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                            />
                            <div className="flex gap-2 text-xs">
                                <button type="submit" className="bg-indigo-600 text-white px-2 py-1 rounded">Add</button>
                                <button type="button" onClick={() => setIsCreatingBook(false)} className="text-gray-500 px-2 py-1">Cancel</button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Chapters Section (Contextual to selected Book) */}
                {selectedBookId && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chapters</h3>
                        <div className="space-y-1">
                             {activeChapters.map((chapter, index) => (
                                <button 
                                    key={chapter.id}
                                    onClick={() => setSelectedChapterId(chapter.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors
                                         ${selectedChapterId === chapter.id ? 'bg-white shadow-sm border border-gray-200 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}
                                    `}
                                >
                                    <span className="text-xs text-gray-400 font-mono w-4">{index + 1}.</span>
                                    <span className="truncate">{chapter.title}</span>
                                </button>
                             ))}
                        </div>
                        
                         {!isCreatingChapter ? (
                             <button 
                                onClick={() => setIsCreatingChapter(true)}
                                className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors w-full justify-center border border-dashed border-gray-300 rounded-lg py-2 hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <Plus size={14} /> Add Chapter
                            </button>
                        ) : (
                            <form onSubmit={handleCreateChapter} className="mt-4 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                 <input 
                                    autoFocus
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder="Chapter Title..."
                                    className="w-full text-sm px-2 py-1 border border-gray-200 rounded mb-2 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex justify-end gap-2 text-xs">
                                    <button type="button" onClick={() => setIsCreatingChapter(false)} className="text-gray-500">Cancel</button>
                                    <button type="submit" className="text-indigo-600 font-bold">Create</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content Area: Editor */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChapterId ? (
                    <>
                        <div className="border-b border-gray-100 p-4 flex justify-between items-center bg-white">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {chapters.find(c => c.id === selectedChapterId)?.title}
                                </h1>
                                <p className="text-xs text-gray-400">
                                    Chapter {activeChapters.findIndex(c => c.id === selectedChapterId) + 1} of {books.find(b => b.id === selectedBookId)?.title}
                                </p>
                            </div>
                            <button 
                                onClick={handleSaveChapterContent}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm active:transform active:scale-95"
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                            <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-sm border border-gray-200 rounded-xl p-12">
                                <textarea
                                    className="w-full h-full min-h-[700px] resize-none focus:outline-none text-lg leading-relaxed text-gray-800 font-serif placeholder-gray-300"
                                    placeholder="Start writing your masterpiece..."
                                    value={chapterContent}
                                    onChange={(e) => setChapterContent(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </>
                ) : selectedBookId ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-400">
                            <BookOpen size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                             {books.find(b => b.id === selectedBookId)?.title}
                        </h2>
                        <p className="max-w-md text-center mb-8">
                            Select a chapter from the sidebar to start writing, or create a new one to begin your story.
                        </p>
                        <button 
                            onClick={() => setIsCreatingChapter(true)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-3"
                        >
                            <PenTool size={20} /> Start Writing
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Layout size={48} className="mb-4 opacity-50" />
                        <p>Select a book to view contents</p>
                    </div>
                )}
            </div>
        </div>
    );
};
