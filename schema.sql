-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- USERS (Supabase manages this via auth.users, but we might want a public profile table)
-- For this app, simply referencing auth.uid() is generally sufficient for ownership.
-- SPACES
CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- LISTS (Modules)
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    type TEXT NOT NULL,
    custom_fields JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    owner_id UUID,
    -- Internal app user/contact reference
    custom_field_values JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- PROJECT TEMPLATES
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    custom_field_values JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE
    SET NULL,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content_blocks JSONB DEFAULT '[]',
        subtasks JSONB DEFAULT '[]',
        status TEXT DEFAULT 'To Do',
        priority TEXT DEFAULT 'Medium',
        assignee_id UUID,
        due_date TIMESTAMP WITH TIME ZONE,
        reminder TIMESTAMP WITH TIME ZONE,
        reminder_fired BOOLEAN DEFAULT FALSE,
        custom_field_values JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- PRODUCTS (Inventory)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    stock_count INTEGER DEFAULT 0,
    price NUMERIC(10, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- AI TOOLS (Directory)
CREATE TABLE ai_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    url TEXT,
    is_api_available BOOLEAN DEFAULT FALSE,
    cost_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- TRANSACTIONS (Finance)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    description TEXT NOT NULL,
    contact TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL,
    -- 'income' or 'expense'
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- FOLDER ITEMS (Documents)
CREATE TABLE folder_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES folder_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    -- 'folder', 'document', 'file', etc
    size TEXT,
    url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    type TEXT,
    link_task_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Helper policy for "User can see/edit their own data"
-- SPACES
CREATE POLICY "Users can view their own spaces" ON spaces FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spaces" ON spaces FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own spaces" ON spaces FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own spaces" ON spaces FOR DELETE USING (auth.uid() = user_id);
-- LISTS
CREATE POLICY "Users can view their own lists" ON lists FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lists" ON lists FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lists" ON lists FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lists" ON lists FOR DELETE USING (auth.uid() = user_id);
-- TASKS
CREATE POLICY "Users can view their own tasks" ON tasks FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);
-- PROJECTS
CREATE POLICY "Users can view their own projects" ON projects FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON projects FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);
-- PROJECT TEMPLATES
CREATE POLICY "Users can view their own templates" ON project_templates FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own templates" ON project_templates FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON project_templates FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON project_templates FOR DELETE USING (auth.uid() = user_id);
-- PRODUCTS
CREATE POLICY "Users can view their own products" ON products FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON products FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON products FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = user_id);
-- AI TOOLS
CREATE POLICY "Users can view their own ai tools" ON ai_tools FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ai tools" ON ai_tools FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ai tools" ON ai_tools FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ai tools" ON ai_tools FOR DELETE USING (auth.uid() = user_id);
-- TRANSACTIONS
CREATE POLICY "Users can view their own transactions" ON transactions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);
-- FOLDER ITEMS
CREATE POLICY "Users can view their own folder items" ON folder_items FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folder items" ON folder_items FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folder items" ON folder_items FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folder items" ON folder_items FOR DELETE USING (auth.uid() = user_id);
-- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON notifications FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON notifications FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);