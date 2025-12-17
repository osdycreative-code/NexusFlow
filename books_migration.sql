-- Books Table
CREATE TABLE books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    genre TEXT,
    description TEXT,
    cover_image TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Chapters Table
CREATE TABLE chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS Policies for Books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own books" ON books FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own books" ON books FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books" ON books FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books" ON books FOR DELETE USING (auth.uid() = user_id);
-- RLS Policies for Chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chapters" ON chapters FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chapters" ON chapters FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chapters" ON chapters FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chapters" ON chapters FOR DELETE USING (auth.uid() = user_id);