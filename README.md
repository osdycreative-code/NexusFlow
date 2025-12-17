# NexusFlow (Project Manager App)

A modern, highly-integrated project management and productivity application built with React, Vite, Tailwind CSS, and Supabase.

## Features

*   **Workspace Management**: Organize your work into distinct spaces (e.g., Engineering, Marketing).
*   **Modular Architecture**: Create spaces with specific modules like Tasks, Projects, Finance, Inventory, and more.
*   **Task Management**: Kanban, List, and Detail views with subtasks and rich text support.
*   **Finance Tracking**: Manage income, expenses, and categorize transactions.
*   **Supabase Integration**:
    *   **Auth**: Secure email/password and GitHub authentication.
    *   **Database**: Real-time data persistence with Row Level Security (RLS).
*   **UI/UX**: Responsive design, collapsible sidebars, and clean aesthetics using Tailwind CSS.

## Tech Stack

*   **Frontend**: React (v19), Vite, TypeScript
*   **Styling**: Tailwind CSS
*   **Backend/Database**: Supabase (PostgreSQL)
*   **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Supabase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/nexusflow.git
    cd nexusflow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    Run the SQL scripts located in `supabase_schema.sql` in your Supabase project's SQL Editor to set up the tables and policies.

5.  **Run Locally:**
    ```bash
    npm run dev
    ```

## Project Structure

*   `/components`: Reusable UI components and View modules.
*   `/services`: API clients (SupabaseService) and logic.
*   `/types.ts`: TypeScript definitions for data models.
*   `/constants.ts`: Constant values (Mocks were removed for production).

## License

MIT
