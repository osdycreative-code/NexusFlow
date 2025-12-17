
import * as React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { InventoryView } from './components/InventoryView';
import { AIDirectoryView } from './components/AIDirectoryView';
import { CreativeStudio } from './components/CreativeStudio';
import { ProjectsView } from './components/ProjectsView';
import { FinanceView } from './components/FinanceView';
import { AppGeneratorView } from './components/AppGeneratorView';
import { FoldersView } from './components/FoldersView';
import { DashboardView } from './components/DashboardView';
import { LoginPage } from './components/LoginPage';
import { Space, List, Task, TaskStatus, TaskPriority, BlockType, Product, AITool, ModuleType, Project, ProjectTemplate, FinanceTransaction, FolderItem, FolderItemType, AppNotification } from './types';
import { Bell, X, Loader2 } from 'lucide-react';
import { supabaseService, TABLES } from './services/supabaseService';
import { supabase } from './services/supabaseClient';

// Simple Store Context
interface StoreContextType {
  spaces: Space[];
  lists: List[];
  tasks: Task[];
  products: Product[];
  aiTools: AITool[];
  projects: Project[];
  projectTemplates: ProjectTemplate[];
  transactions: FinanceTransaction[];
  folderItems: FolderItem[];
  notifications: AppNotification[];
  activeSpaceId: string | null;
  activeListId: string | null;
  activeTaskId: string | null;
  setActiveSpaceId: (id: string) => void;
  setActiveListId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateList: (listId: string, updates: Partial<List>) => void;
  deleteList: (listId: string) => void;
  createTask: (listId: string, title: string, projectId?: string) => void;
  createSpace: (name: string, modules: ModuleType[]) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  deleteSpace: (spaceId: string) => void;
  addModule: (spaceId: string, type: ModuleType, name: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addAITool: (tool: AITool) => void;
  updateAITool: (id: string, updates: Partial<AITool>) => void;
  deleteAITool: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  saveProjectAsTemplate: (projectId: string, templateName: string) => void;
  addTransaction: (transaction: FinanceTransaction) => void;
  updateTransaction: (id: string, updates: Partial<FinanceTransaction>) => void;
  deleteTransaction: (id: string) => void;
  addFolderItem: (item: FolderItem) => void;
  updateFolderItem: (id: string, updates: Partial<FolderItem>) => void;
  deleteFolderItem: (id: string) => void;
  organizeFolderItems: (listId: string, parentId: string | null, criteria: 'type' | 'date') => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  logout: () => void;
  resetData: () => void;
}

export const StoreContext = createContext<StoreContextType>({} as StoreContextType);

// Reserved ID for the dashboard view
export const DASHBOARD_VIEW_ID = 'dashboard_view';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null); // Kept for logic compatibility, Supabase manages checks
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Application State - Initially empty, loaded from DB
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiTools, setAiTools] = useState<AITool[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Navigation State
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(DASHBOARD_VIEW_ID);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Toast State
  const [currentToast, setCurrentToast] = useState<AppNotification | null>(null);

  // --- Auth & Data Initialization ---
  useEffect(() => {
     // Check active session
     supabase.auth.getSession().then(({ data: { session } }) => {
         if (session) {
             setAuthToken(session.access_token);
             setIsAuthenticated(true);
             loadData();
         } else {
             setIsDbLoading(false);
         }
     });

     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
         if (session) {
             setAuthToken(session.access_token);
             setIsAuthenticated(true);
             loadData();
         } else {
             setAuthToken(null);
             setIsAuthenticated(false);
             setSpaces([]);
             setLists([]); // Clear state on logout
         }
     });

     return () => subscription.unsubscribe();
  }, []);


  const loadData = async () => {
      setIsDbLoading(true);
      try {
        const [
            lSpaces, lLists, lTasks, lProducts, lAiTools, lProjects, lTemplates, lTrans, lFolders, lNotifs
        ] = await Promise.all([
            supabaseService.getAll<Space>(TABLES.SPACES),
            supabaseService.getAll<List>(TABLES.LISTS),
            supabaseService.getAll<Task>(TABLES.TASKS),
            supabaseService.getAll<Product>(TABLES.PRODUCTS),
            supabaseService.getAll<AITool>(TABLES.AI_TOOLS),
            supabaseService.getAll<Project>(TABLES.PROJECTS),
            supabaseService.getAll<ProjectTemplate>(TABLES.TEMPLATES),
            supabaseService.getAll<FinanceTransaction>(TABLES.TRANSACTIONS),
            supabaseService.getAll<FolderItem>(TABLES.FOLDER_ITEMS),
            supabaseService.getAll<AppNotification>(TABLES.NOTIFICATIONS),
        ]);

        setSpaces(lSpaces);
        setLists(lLists);
        setTasks(lTasks);
        setProducts(lProducts);
        setAiTools(lAiTools);
        setProjects(lProjects);
        setProjectTemplates(lTemplates);
        setTransactions(lTrans);
        setFolderItems(lFolders);
        setNotifications(lNotifs);

      } catch (err) {
        console.error("Failed to load data from Supabase", err);
      } finally {
        setIsDbLoading(false);
      }
  };

  const handleLoginSuccess = (token: string) => {
      // Supabase auth state change listener handles the rest
  };

  const logout = async () => {
      await supabase.auth.signOut();
  };

  const resetData = async () => {
     // Not applicable for cloud DB in the same way, or implement a cleanup function
     alert("Reset data not fully implemented for cloud DB yet - manually delete via Supabase dashboard.");
  };

  // --- Reminder Logic ---
  useEffect(() => {
    if (isDbLoading || !isAuthenticated) return;

    const checkReminders = () => {
      const now = new Date();
      
      setTasks(prevTasks => {
          let hasUpdates = false;
          // clone prevent mutation of state if used directly
          const updatedTasks = prevTasks.map(task => {
              if (task.reminder && !task.reminderFired && new Date(task.reminder) <= now) {
                  hasUpdates = true;
                  // Trigger Notification
                  const newNotification: AppNotification = {
                      id: crypto.randomUUID(), // Let UUID be generated here for UI, but Supabase might gen its own if not provided
                      title: 'Task Reminder',
                      message: `Reminder for: ${task.title}`,
                      timestamp: new Date(),
                      read: false,
                      type: 'reminder',
                      linkTaskId: task.id
                  };
                  
                  // Optimistic UI Update for Notifications
                  setNotifications(prev => [newNotification, ...prev]);
                  supabaseService.addItem(TABLES.NOTIFICATIONS, newNotification);
                  
                  // Show Toast
                  setCurrentToast(newNotification);
                  setTimeout(() => setCurrentToast(null), 5000); 

                  const updatedTask = { ...task, reminderFired: true };
                  supabaseService.updateItem(TABLES.TASKS, task.id, { reminder_fired: true }); // Persist task change
                  return updatedTask;
              }
              return task;
          });
          
          return hasUpdates ? updatedTasks : prevTasks;
      });
    };

    const intervalId = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [isDbLoading, isAuthenticated]);

  // --- Actions with DB Persistence ---

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // Snake_case conversion might be needed if Supabase keys differ, but our types align mostly.
    // For now assuming keys match or Supabase ignores extras.
    // Ideally we map camelCase to snake_case for DB.
    // Manually handling specific fields if needed.
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    
    // DB Update
    try {
        await supabaseService.updateItem(TABLES.TASKS, taskId, updates);
    } catch (err) {
        console.error("Failed to update task", err);
        // Rollback?
    }
  };

  const deleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      supabaseService.deleteItem(TABLES.TASKS, taskId);
      if (activeTaskId === taskId) setActiveTaskId(null);
  };

  const updateList = (listId: string, updates: Partial<List>) => {
    setLists(prev => prev.map(l => l.id === listId ? { ...l, ...updates } : l));
    supabaseService.updateItem(TABLES.LISTS, listId, updates);
  };

  const deleteList = (listId: string) => {
      setLists(prev => prev.filter(l => l.id !== listId));
      supabaseService.deleteItem(TABLES.LISTS, listId);
      
      // Cascade is handled by Supabase Foreign Keys for most things! 
      // But we update local state to reflect cascading deletes
      setTasks(prev => prev.filter(t => t.listId !== listId));
      setProjects(prev => prev.filter(p => p.listId !== listId));
      setTransactions(prev => prev.filter(t => t.listId !== listId));
      setFolderItems(prev => prev.filter(i => i.listId !== listId));

      if (activeListId === listId) setActiveListId(null);
  };

  const createTask = (listId: string, title: string, projectId?: string) => {
      const newTask: Task = {
          id: crypto.randomUUID(),
          listId,
          projectId,
          title,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          contentBlocks: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
          subtasks: [],
          createdAt: new Date(),
          customFieldValues: {},
      };
      setTasks(prev => [...prev, newTask]);
      supabaseService.addItem(TABLES.TASKS, newTask);
      if (!projectId) {
          setActiveTaskId(newTask.id);
      }
  };

  const getModuleColor = (type: ModuleType) => {
      switch(type) {
          case ModuleType.TASKS: return 'bg-blue-500';
          case ModuleType.INVENTORY: return 'bg-orange-500';
          case ModuleType.DIRECTORY: return 'bg-indigo-500';
          case ModuleType.STUDIO: return 'bg-pink-500';
          case ModuleType.PROJECTS: return 'bg-teal-500';
          case ModuleType.FINANCE: return 'bg-emerald-500';
          case ModuleType.APP_GENERATOR: return 'bg-blue-600';
          case ModuleType.FOLDERS: return 'bg-yellow-500';
          default: return 'bg-indigo-500';
      }
  };

  const createSpace = (name: string, modules: ModuleType[]) => {
      const newSpaceId = crypto.randomUUID();
      const newSpace: Space = {
          id: newSpaceId,
          name: name,
          icon: '✨' 
      };

      const newLists: List[] = modules.map((type, index) => ({
          id: crypto.randomUUID(),
          spaceId: newSpaceId,
          name: type === ModuleType.TASKS ? 'General Tasks' : 
                type === ModuleType.INVENTORY ? 'Inventory' : 
                type === ModuleType.DIRECTORY ? 'AI Tools' : 
                type === ModuleType.PROJECTS ? 'Projects' :
                type === ModuleType.FINANCE ? 'Budget' : 
                type === ModuleType.APP_GENERATOR ? 'App Builder' : 
                type === ModuleType.FOLDERS ? 'Documents & Files' : 'Studio',
          color: getModuleColor(type),
          type: type,
          customFields: []
      }));

      // Optimistic
      setSpaces(prev => [...prev, newSpace]);
      setLists(prev => [...prev, ...newLists]);
      setActiveSpaceId(newSpaceId);
      if(newLists.length > 0) setActiveListId(newLists[0].id);

      // Async Persist
      supabaseService.addItem(TABLES.SPACES, newSpace).then(() => {
          newLists.forEach(l => supabaseService.addItem(TABLES.LISTS, l));
      });
  };

  const updateSpace = (spaceId: string, updates: Partial<Space>) => {
      setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, ...updates } : s));
      supabaseService.updateItem(TABLES.SPACES, spaceId, updates);
  };

  const deleteSpace = (spaceId: string) => {
      // Optimistic Delete
      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      const listsToRemove = lists.filter(l => l.spaceId === spaceId);
      const listIdsToRemove = listsToRemove.map(l => l.id);
      setLists(prev => prev.filter(l => l.spaceId !== spaceId));

      // Local Cascade Cleanup
      setTasks(prev => prev.filter(t => !listIdsToRemove.includes(t.listId)));
      setProjects(prev => prev.filter(p => !listIdsToRemove.includes(p.listId)));
      // ... others

      supabaseService.deleteItem(TABLES.SPACES, spaceId); 
      // DB Cascade handles child deletions

      if (activeSpaceId === spaceId) {
          setActiveSpaceId(DASHBOARD_VIEW_ID);
          setActiveListId(null);
      }
  };

  const addModule = (spaceId: string, type: ModuleType, name: string) => {
      const newList: List = {
          id: crypto.randomUUID(),
          spaceId,
          name: name,
          color: getModuleColor(type),
          type: type,
          customFields: []
      };
      setLists(prev => [...prev, newList]);
      supabaseService.addItem(TABLES.LISTS, newList);
      setActiveListId(newList.id);
  };

  const addProduct = (product: Product) => {
      setProducts(prev => [...prev, product]);
      supabaseService.addItem(TABLES.PRODUCTS, product);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      supabaseService.updateItem(TABLES.PRODUCTS, id, updates);
  };

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      supabaseService.deleteItem(TABLES.PRODUCTS, id);
  };

  const addAITool = (tool: AITool) => {
      setAiTools(prev => [...prev, tool]);
      supabaseService.addItem(TABLES.AI_TOOLS, tool);
  };

  const updateAITool = (id: string, updates: Partial<AITool>) => {
      setAiTools(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      supabaseService.updateItem(TABLES.AI_TOOLS, id, updates);
  };

  const deleteAITool = (id: string) => {
      setAiTools(prev => prev.filter(t => t.id !== id));
      supabaseService.deleteItem(TABLES.AI_TOOLS, id);
  };

  const addProject = (project: Project) => {
      setProjects(prev => [...prev, project]);
      supabaseService.addItem(TABLES.PROJECTS, project);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      supabaseService.updateItem(TABLES.PROJECTS, id, updates);
  };

  const deleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      supabaseService.deleteItem(TABLES.PROJECTS, id);
  };

  const saveProjectAsTemplate = (projectId: string, templateName: string) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const newTemplate: ProjectTemplate = {
          id: crypto.randomUUID(),
          name: templateName,
          description: project.description,
          customFieldValues: { ...project.customFieldValues }
      };
      
      setProjectTemplates(prev => [...prev, newTemplate]);
      supabaseService.addItem(TABLES.TEMPLATES, newTemplate);
      
      setCurrentToast({
          id: crypto.randomUUID(),
          title: 'Template Saved',
          message: `Project saved as template: ${templateName}`,
          timestamp: new Date(),
          read: false,
          type: 'system'
      });
      setTimeout(() => setCurrentToast(null), 3000);
  };

  const addTransaction = (transaction: FinanceTransaction) => {
      setTransactions(prev => [...prev, transaction]);
      supabaseService.addItem(TABLES.TRANSACTIONS, transaction);
  };

  const updateTransaction = (id: string, updates: Partial<FinanceTransaction>) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      supabaseService.updateItem(TABLES.TRANSACTIONS, id, updates);
  };

  const deleteTransaction = (id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      supabaseService.deleteItem(TABLES.TRANSACTIONS, id);
  };

  const addFolderItem = (item: FolderItem) => {
      setFolderItems(prev => [...prev, item]);
      supabaseService.addItem(TABLES.FOLDER_ITEMS, item);
  };

  const updateFolderItem = (id: string, updates: Partial<FolderItem>) => {
      setFolderItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      supabaseService.updateItem(TABLES.FOLDER_ITEMS, id, updates);
  };

  const deleteFolderItem = (id: string) => {
      setFolderItems(prev => prev.filter(i => i.id !== id && i.parentId !== id));
      supabaseService.deleteItem(TABLES.FOLDER_ITEMS, id);
  };

  const organizeFolderItems = (listId: string, parentId: string | null, criteria: 'type' | 'date') => {
      // Complex logic similar to before, but calls updateItem
       setFolderItems(prevItems => {
          const itemsToMove = prevItems.filter(i => 
              i.listId === listId && 
              i.parentId === parentId && 
              i.type !== FolderItemType.FOLDER
          );
          
          if (itemsToMove.length === 0) return prevItems;

          const newItems = [...prevItems];
          const createdFolders: Record<string, string> = {}; // Name -> ID

          const getTargetFolderId = (folderName: string) => {
              const existingId = newItems.find(i => 
                  i.listId === listId && 
                  i.parentId === parentId && 
                  i.type === FolderItemType.FOLDER && 
                  i.name === folderName
              )?.id;

              if (existingId) return existingId;
              if (createdFolders[folderName]) return createdFolders[folderName];

              const newFolderId = crypto.randomUUID();
              const newFolder = {
                  id: newFolderId,
                  listId,
                  parentId,
                  name: folderName,
                  type: FolderItemType.FOLDER,
                  updatedAt: new Date()
              };
              newItems.push(newFolder);
              supabaseService.addItem(TABLES.FOLDER_ITEMS, newFolder); // Persist Folder
              
              createdFolders[folderName] = newFolderId;
              return newFolderId;
          };

          itemsToMove.forEach(item => {
              let targetName = "Misc";
              if (criteria === 'type') {
                  switch(item.type) {
                      case FolderItemType.DOCUMENT: targetName = "Documents"; break;
                      case FolderItemType.FILE: targetName = "Files"; break;
                      case FolderItemType.NOTE: targetName = "Notes"; break;
                      case FolderItemType.TASK: targetName = "Tasks"; break;
                      default: targetName = "Misc";
                  }
              } else if (criteria === 'date') {
                  const date = new Date(item.updatedAt);
                  if (!isNaN(date.getTime())) {
                      targetName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  } else {
                      targetName = "Unknown Date";
                  }
              }

              const folderId = getTargetFolderId(targetName);
              
              const itemIndex = newItems.findIndex(i => i.id === item.id);
              if(itemIndex > -1) {
                  const updated = { ...newItems[itemIndex], parentId: folderId };
                  newItems[itemIndex] = updated;
                  supabaseService.updateItem(TABLES.FOLDER_ITEMS, item.id, { parentId: folderId }); // Persist Move
              }
          });

          return newItems;
      });
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      supabaseService.updateItem(TABLES.NOTIFICATIONS, id, { read: true });
  };

  const clearAllNotifications = () => {
      notifications.forEach(n => supabaseService.deleteItem(TABLES.NOTIFICATIONS, n.id));
      setNotifications([]);
  };

  // Sync list selection when space changes
  useEffect(() => {
    if (activeSpaceId && activeSpaceId !== DASHBOARD_VIEW_ID) {
      const spaceLists = lists.filter(l => l.spaceId === activeSpaceId);
      const isCurrentListInSpace = spaceLists.find(l => l.id === activeListId);
      if (!isCurrentListInSpace && spaceLists.length > 0) {
        setActiveListId(spaceLists[0].id);
      } else if (spaceLists.length === 0) {
          setActiveListId(null);
      }
    }
  }, [activeSpaceId, lists]);

  const renderMainContent = () => {
      if (activeSpaceId === DASHBOARD_VIEW_ID) {
          return <DashboardView />;
      }

      if (!activeListId) {
          return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a module to view
            </div>
          );
      }

      const activeList = lists.find(l => l.id === activeListId);
      if (!activeList) return null;

      switch(activeList.type) {
          case ModuleType.INVENTORY:
              return <InventoryView />;
          case ModuleType.DIRECTORY:
              return <AIDirectoryView />;
          case ModuleType.STUDIO:
              return <CreativeStudio />;
          case ModuleType.PROJECTS:
              return <ProjectsView />;
          case ModuleType.FINANCE:
              return <FinanceView />;
          case ModuleType.APP_GENERATOR:
              return <AppGeneratorView />;
          case ModuleType.FOLDERS:
              return <FoldersView />;
          case ModuleType.TASKS:
          default:
              return <TaskList />;
      }
  };

  if (!isAuthenticated) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (isDbLoading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-indigo-600 gap-4">
              <Loader2 size={48} className="animate-spin" />
              <p className="font-medium">Loading Workspace...</p>
          </div>
      );
  }

  return (
    <StoreContext.Provider value={{
      spaces, lists, tasks, products, aiTools, projects, projectTemplates, transactions, folderItems, notifications,
      activeSpaceId, activeListId, activeTaskId,
      setActiveSpaceId, setActiveListId, setActiveTaskId,
      updateTask, deleteTask, updateList, deleteList, createTask, createSpace, updateSpace, deleteSpace, addModule, addProduct, updateProduct, deleteProduct,
      addAITool, updateAITool, deleteAITool, addProject, updateProject, deleteProject, saveProjectAsTemplate, addTransaction, updateTransaction, deleteTransaction,
      addFolderItem, updateFolderItem, deleteFolderItem, organizeFolderItems,
      markNotificationRead, clearAllNotifications, logout, resetData
    }}>
      <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900 relative">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {renderMainContent()}
        </main>

        {activeTaskId && <TaskDetail />}

        {currentToast && (
            <div className="fixed bottom-6 right-6 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-start gap-3 w-80 animate-[slideUp_0.3s_ease-out] z-[100]">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                    <Bell size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{currentToast.title}</span>
                        <button onClick={() => setCurrentToast(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close notification">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{currentToast.message}</p>
                    {currentToast.linkTaskId && (
                        <button 
                            onClick={() => {
                                setActiveTaskId(currentToast.linkTaskId || null);
                                setCurrentToast(null);
                            }}
                            className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                            View Task
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>
      <style>{`
          @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
          }
      `}</style>
    </StoreContext.Provider>
  );
};

export default App;