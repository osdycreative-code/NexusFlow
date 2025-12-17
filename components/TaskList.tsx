import React, { useContext, useState, useMemo } from 'react';
import { StoreContext } from '../App';
import { Plus, Filter, ArrowUpDown, Circle, CheckCircle2, CircleDashed, LayoutList, KanbanSquare, Calendar as CalendarIcon, GripHorizontal } from 'lucide-react';
import { TaskStatus, TaskPriority, ViewMode, Task } from '../types';

export const TaskList: React.FC = () => {
  const { lists, activeListId, tasks, setActiveTaskId, createTask, updateTask } = useContext(StoreContext);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);

  const currentList = lists.find(l => l.id === activeListId);
  const listTasks = useMemo(() => tasks.filter(t => t.listId === activeListId), [tasks, activeListId]);

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if(newTaskTitle.trim() && activeListId) {
          createTask(activeListId, newTaskTitle);
          setNewTaskTitle('');
      }
  };

  const getPriorityColor = (p: TaskPriority) => {
      switch(p) {
          case TaskPriority.URGENT: return 'text-red-600 bg-red-50';
          case TaskPriority.HIGH: return 'text-orange-600 bg-orange-50';
          case TaskPriority.MEDIUM: return 'text-yellow-600 bg-yellow-50';
          case TaskPriority.LOW: return 'text-gray-500 bg-gray-50';
          default: return 'text-gray-500';
      }
  };

  const getStatusIcon = (s: TaskStatus) => {
    switch(s) {
        case TaskStatus.DONE: return <CheckCircle2 size={18} className="text-green-500" />;
        case TaskStatus.IN_PROGRESS: return <CircleDashed size={18} className="text-blue-500 animate-[spin_3s_linear_infinite]" />;
        default: return <Circle size={18} className="text-gray-300" />;
    }
  };

  // --- Kanban Logic ---
  const onDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData("taskId", taskId);
  };

  const onDrop = (e: React.DragEvent, status: TaskStatus) => {
      const taskId = e.dataTransfer.getData("taskId");
      if(taskId) updateTask(taskId, { status });
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    // Empty slots for previous month
    for(let i = 0; i < firstDay; i++) days.push(null);
    // Days
    for(let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, []);

  if (!currentList) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
         <div className="flex items-center gap-3">
             <div className={`w-4 h-4 rounded shadow-sm ${currentList.color}`}></div>
             <h1 className="text-xl font-semibold text-gray-800">{currentList.name}</h1>
             <span className="text-gray-400 text-sm ml-2">{listTasks.length} tasks</span>
         </div>
         
         {/* View Switcher & Actions */}
         <div className="flex items-center gap-4">
             <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button 
                    onClick={() => setViewMode(ViewMode.LIST)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 ${viewMode === ViewMode.LIST ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="List View"
                >
                    <LayoutList size={16} />
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.BOARD)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 ${viewMode === ViewMode.BOARD ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Board View"
                >
                    <KanbanSquare size={16} />
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.CALENDAR)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 ${viewMode === ViewMode.CALENDAR ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Calendar View"
                >
                    <CalendarIcon size={16} />
                </button>
             </div>
             
             <div className="h-6 w-px bg-gray-200"></div>

             <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200">
                    <Filter size={16} /> Filter
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200">
                    <ArrowUpDown size={16} /> Sort
                </button>
             </div>
         </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden bg-gray-50/50">
          {viewMode === ViewMode.LIST && (
            <div className="h-full overflow-y-auto px-8 py-6">
                <div className="mb-6">
                    <form onSubmit={handleCreate} className="group relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                            <Plus size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Add a new task..." 
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm shadow-sm"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                    </form>
                </div>

                <div className="space-y-2">
                    {listTasks.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => setActiveTaskId(task.id)}
                            className="group flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md border border-gray-200 cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <button className="shrink-0 pt-0.5">
                                    {getStatusIcon(task.status)}
                                </button>
                                <span className={`text-sm font-medium truncate ${task.status === TaskStatus.DONE ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                    {task.title}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0">
                                {task.dueDate && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <CalendarIcon size={12}/> {new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold border border-white shadow-sm">
                                    AS
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {viewMode === ViewMode.BOARD && (
              <div className="h-full overflow-x-auto overflow-y-hidden p-6">
                  <div className="flex gap-6 h-full min-w-max">
                      {Object.values(TaskStatus).map(status => (
                          <div 
                            key={status} 
                            onDrop={(e) => onDrop(e, status)}
                            onDragOver={onDragOver}
                            className="w-80 flex flex-col h-full bg-gray-100/50 rounded-xl border border-gray-200/60"
                          >
                                {/* Column Header */}
                                <div className="p-3 flex items-center justify-between font-medium text-sm text-gray-500 uppercase tracking-wide">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        {status}
                                    </div>
                                    <span className="bg-gray-200 px-2 rounded-full text-xs text-gray-600">
                                        {listTasks.filter(t => t.status === status).length}
                                    </span>
                                </div>
                                
                                {/* Column Content */}
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                    {listTasks.filter(t => t.status === status).map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task.id)}
                                            onClick={() => setActiveTaskId(task.id)}
                                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                <GripHorizontal size={14} className="text-gray-300" />
                                            </div>
                                            <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                                                {task.title}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                 {task.dueDate ? (
                                                     <div className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                                         <CalendarIcon size={10} />
                                                         {new Date(task.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                     </div>
                                                 ) : <div></div>}
                                                 <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-700 font-bold">
                                                     AS
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            createTask(activeListId!, "New Task");
                                        }}
                                        className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> New
                                    </button>
                                </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {viewMode === ViewMode.CALENDAR && (
              <div className="h-full p-6 overflow-y-auto">
                   <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                       {/* Weekday Headers */}
                       {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                           <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase">
                               {day}
                           </div>
                       ))}
                       
                       {/* Days */}
                       {calendarDays.map((date, idx) => {
                           if(!date) return <div key={idx} className="bg-white h-32"></div>;
                           
                           const dayTasks = listTasks.filter(t => 
                               t.dueDate && 
                               new Date(t.dueDate).toDateString() === date.toDateString()
                           );

                           return (
                               <div key={idx} className="bg-white min-h-[8rem] p-2 hover:bg-gray-50 transition-colors">
                                   <div className={`text-xs font-medium mb-1 ${date.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-gray-500'}`}>
                                       {date.getDate()} {date.getDate() === 1 && date.toLocaleDateString(undefined, {month: 'short'})}
                                   </div>
                                   <div className="space-y-1">
                                       {dayTasks.map(task => (
                                           <div 
                                                key={task.id}
                                                onClick={() => setActiveTaskId(task.id)}
                                                className={`text-[10px] px-1.5 py-1 rounded truncate cursor-pointer ${task.status === TaskStatus.DONE ? 'bg-gray-100 text-gray-400 line-through' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}
                                           >
                                               {task.title}
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};