

import React, { useContext, useState } from 'react';
import { StoreContext } from '../App';
import { Search, Plus, Calendar, User, MoreHorizontal, FolderKanban, Pencil, Trash2, X, Hash, Type, Link as LinkIcon, List as ListIcon, Save, LayoutTemplate, Check, CheckCircle2, Circle } from 'lucide-react';
import { Project, ProjectStatus, CustomFieldType, TaskStatus, Task } from '../types';

export const ProjectsView: React.FC = () => {
    const { projects, projectTemplates, addProject, updateProject, deleteProject, saveProjectAsTemplate, activeListId, lists, updateList, tasks, createTask, updateTask, deleteTask, setActiveTaskId } = useContext(StoreContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Modal Tabs
    const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');

    // Template Preview State
    const [templatePreviewProject, setTemplatePreviewProject] = useState<Project | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');

    // Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newStatus, setNewStatus] = useState<ProjectStatus>(ProjectStatus.PLANNING);
    const [newProgress, setNewProgress] = useState(0);
    const [customValues, setCustomValues] = useState<Record<string, any>>({});

    // Task Management State (in Modal)
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Field Management State
    const [isAddingField, setIsAddingField] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState<CustomFieldType>(CustomFieldType.TEXT);

    const activeList = lists.find(l => l.id === activeListId);

    // Filter projects for the current list/module
    const filteredProjects = projects.filter(p => {
        const matchesList = p.listId === activeListId;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
        return matchesList && matchesSearch && matchesStatus;
    });

    // Get tasks for the currently edited project
    const projectTasks = tasks.filter(t => t.projectId === editingId);

    const handleOpenAdd = () => {
        setEditingId(null);
        setNewName(''); setNewDesc(''); setNewStartDate(''); setNewEndDate(''); setNewStatus(ProjectStatus.PLANNING); setNewProgress(0); setCustomValues({});
        setActiveTab('details');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (project: Project) => {
        setEditingId(project.id);
        setNewName(project.name);
        setNewDesc(project.description);
        setNewStartDate(new Date(project.startDate).toISOString().split('T')[0]);
        setNewEndDate(new Date(project.endDate).toISOString().split('T')[0]);
        setNewStatus(project.status);
        setNewProgress(project.progress);
        setCustomValues(project.customFieldValues || {});
        setActiveTab('details');
        setIsModalOpen(true);
    };

    const handleInitiateSaveTemplate = (project: Project) => {
        setTemplatePreviewProject(project);
        setNewTemplateName(`${project.name} Template`);
    };

    const confirmSaveTemplate = () => {
        if (templatePreviewProject && newTemplateName.trim()) {
            saveProjectAsTemplate(templatePreviewProject.id, newTemplateName);
            setTemplatePreviewProject(null);
            setNewTemplateName('');
        }
    };

    const handleApplyTemplate = (templateId: string) => {
        const template = projectTemplates.find(t => t.id === templateId);
        if(template) {
            // Only overwrite fields if they are empty or if explicit user choice suggests replacing content (here implied)
            if(!newName) setNewName(template.description ? `Project based on ${template.name}` : '');
            setNewDesc(template.description);
            setCustomValues({ ...template.customFieldValues });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeListId) return;

        if (editingId) {
             updateProject(editingId, {
                name: newName,
                description: newDesc,
                status: newStatus,
                startDate: newStartDate ? new Date(newStartDate) : new Date(),
                endDate: newEndDate ? new Date(newEndDate) : new Date(),
                progress: newProgress,
                customFieldValues: customValues
             });
        } else {
            const newProject: Project = {
                id: crypto.randomUUID(),
                listId: activeListId,
                name: newName,
                description: newDesc,
                status: newStatus,
                startDate: newStartDate ? new Date(newStartDate) : new Date(),
                endDate: newEndDate ? new Date(newEndDate) : new Date(),
                progress: newProgress,
                ownerId: 'u1',
                customFieldValues: customValues
            };
            addProject(newProject);
        }
        
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
        }
    };

    const handleAddField = () => {
        if(newFieldName.trim() && activeList) {
            const newField = {
                id: crypto.randomUUID(),
                name: newFieldName,
                type: newFieldType,
                options: newFieldType === CustomFieldType.SELECT ? ['Option 1', 'Option 2'] : undefined
            };
            updateList(activeList.id, {
                customFields: [...activeList.customFields, newField]
            });
            setIsAddingField(false);
            setNewFieldName('');
        }
    };

    const handleCreateProjectTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId && newTaskTitle.trim() && activeListId) {
            // We use the current module's listId, but link it to the project via projectId
            createTask(activeListId, newTaskTitle, editingId);
            setNewTaskTitle('');
        }
    };

    const getStatusColor = (status: ProjectStatus) => {
        switch(status) {
            case ProjectStatus.ACTIVE: return 'bg-green-100 text-green-700';
            case ProjectStatus.PLANNING: return 'bg-blue-100 text-blue-700';
            case ProjectStatus.ON_HOLD: return 'bg-orange-100 text-orange-700';
            case ProjectStatus.COMPLETED: return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getProgressColor = (progress: number) => {
        if(progress === 100) return 'bg-green-500';
        if(progress > 50) return 'bg-blue-500';
        return 'bg-orange-500';
    };

    const getIconForType = (type: CustomFieldType) => {
          switch(type) {
              case CustomFieldType.TEXT: return <Type size={14} />;
              case CustomFieldType.NUMBER: return <Hash size={14} />;
              case CustomFieldType.URL: return <LinkIcon size={14} />;
              case CustomFieldType.SELECT: return <ListIcon size={14} />;
          }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg text-teal-600"><FolderKanban size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Projects Portfolio</h1>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
                >
                    <Plus size={16} /> New Project
                </button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search projects..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm"
                    />
                </div>
                
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    {['All', ...Object.values(ProjectStatus)].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === status ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
                {filteredProjects.length === 0 && !isModalOpen ? (
                     <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FolderKanban size={48} className="mb-4 text-gray-300" />
                        <p className="text-sm font-medium">No projects found.</p>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <div key={project.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleInitiateSaveTemplate(project)} className="text-gray-400 hover:text-teal-600" title="Save as Template">
                                            <Save size={16} />
                                        </button>
                                        <button onClick={() => handleOpenEdit(project)} className="text-gray-400 hover:text-indigo-600" title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(project.id)} className="text-gray-400 hover:text-red-600" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 text-lg mb-2">{project.name}</h3>
                                <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-3">{project.description}</p>

                                {/* Custom Fields Display */}
                                {activeList?.customFields && activeList.customFields.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {activeList.customFields.map(field => {
                                            const val = project.customFieldValues?.[field.id];
                                            if(!val) return null;
                                            return (
                                                <div key={field.id} className="text-xs">
                                                    <span className="text-gray-400 uppercase font-bold text-[10px]">{field.name}</span>
                                                    <div className="text-gray-700 font-medium truncate">
                                                        {field.type === CustomFieldType.NUMBER ? val.toLocaleString() : val}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className="space-y-4 mt-auto">
                                    {/* Dates & Owner */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <span>{new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[9px]">
                                                AC
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-gray-600">Progress</span>
                                            <span className="text-gray-900">{project.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`} 
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* Add New Card (Ghost) */}
                        <button 
                            onClick={handleOpenAdd}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all min-h-[250px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100">
                                <Plus size={24} />
                            </div>
                            <span className="font-medium text-sm">Create New Project</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Template Save Preview Modal */}
            {templatePreviewProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] flex flex-col">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <LayoutTemplate size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Save as Template</h2>
                                <p className="text-xs text-gray-500">Create a reusable template from this project</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Template Name</label>
                                <input 
                                    autoFocus
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" 
                                    value={newTemplateName} 
                                    onChange={e => setNewTemplateName(e.target.value)}
                                    placeholder="e.g. Website Launch Template"
                                />
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Template Preview</h3>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-sm">
                                        <span className="text-gray-400 min-w-[80px]">Source:</span>
                                        <span className="font-medium text-gray-800">{templatePreviewProject.name}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm">
                                        <span className="text-gray-400 min-w-[80px]">Includes:</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5 text-gray-700 mb-1">
                                                 <Check size={14} className="text-green-500"/>
                                                 <span>Project Description</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-700">
                                                 <Check size={14} className="text-green-500"/>
                                                 <span>{activeList?.customFields.length || 0} Custom Fields</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {activeList?.customFields && activeList.customFields.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Fields Structure</div>
                                        <div className="flex flex-wrap gap-2">
                                            {activeList.customFields.map(f => (
                                                <span key={f.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                                    {getIconForType(f.type)} {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setTemplatePreviewProject(null)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmSaveTemplate}
                                disabled={!newTemplateName.trim()}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Project Details' : 'New Project'}</h2>
                                <p className="text-xs text-gray-500">{editingId ? 'Manage properties and tasks' : 'Create a new project'}</p>
                            </div>
                            {editingId && (
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button 
                                        onClick={() => setActiveTab('details')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'details' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Details
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('tasks')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'tasks' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Tasks
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'details' && (
                                <form id="project-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {/* Template Selector (Only on New) */}
                                    {!editingId && projectTemplates.length > 0 && (
                                        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100 shrink-0">
                                            <label className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2">
                                                <LayoutTemplate size={12}/> Load from Template
                                            </label>
                                            <select 
                                                className="w-full text-sm border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                onChange={(e) => handleApplyTemplate(e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select a template...</option>
                                                {projectTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Project Name</label>
                                        <input 
                                            autoFocus
                                            required 
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                            value={newName} 
                                            onChange={e => setNewName(e.target.value)}
                                            placeholder="e.g. Q3 Marketing Sprint"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                                        <textarea 
                                            required 
                                            rows={3}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none" 
                                            value={newDesc} 
                                            onChange={e => setNewDesc(e.target.value)}
                                            placeholder="Briefly describe the project goals..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start Date</label>
                                            <input 
                                                type="date" 
                                                required 
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                                value={newStartDate} 
                                                onChange={e => setNewStartDate(e.target.value)} 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">End Date</label>
                                            <input 
                                                type="date" 
                                                required 
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                                value={newEndDate} 
                                                onChange={e => setNewEndDate(e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
                                            <select 
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                                            >
                                                {Object.values(ProjectStatus).map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Progress (%)</label>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                                value={newProgress} 
                                                onChange={e => setNewProgress(Number(e.target.value))} 
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 mt-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Custom Fields</label>
                                        <div className="space-y-3">
                                            {activeList?.customFields.map(field => (
                                                <div key={field.id}>
                                                    <label className="block text-xs text-gray-600 mb-1">{field.name}</label>
                                                    <input 
                                                        type={field.type === CustomFieldType.NUMBER ? 'number' : 'text'}
                                                        className="w-full border-gray-200 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
                                                        value={customValues[field.id] || ''}
                                                        onChange={e => setCustomValues({
                                                            ...customValues,
                                                            [field.id]: field.type === CustomFieldType.NUMBER ? parseFloat(e.target.value) : e.target.value
                                                        })}
                                                        placeholder={`Enter ${field.name}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add New Field UI */}
                                        <div className="mt-4">
                                            {!isAddingField ? (
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsAddingField(true)}
                                                    className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Add Property
                                                </button>
                                            ) : (
                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <input 
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Property Name"
                                                        className="w-full text-xs border-gray-300 rounded mb-2"
                                                        value={newFieldName}
                                                        onChange={e => setNewFieldName(e.target.value)}
                                                    />
                                                    <div className="flex gap-2 mb-2">
                                                        {[CustomFieldType.TEXT, CustomFieldType.NUMBER].map(t => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setNewFieldType(t)}
                                                                className={`text-[10px] px-2 py-1 rounded border capitalize ${newFieldType === t ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-gray-200 text-gray-600'}`}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button type="button" onClick={() => setIsAddingField(false)} className="text-xs text-gray-500">Cancel</button>
                                                        <button type="button" onClick={handleAddField} className="text-xs bg-teal-600 text-white px-2 py-1 rounded">Add</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'tasks' && editingId && (
                                <div className="p-6">
                                    <div className="space-y-2 mb-6">
                                        {projectTasks.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                No tasks for this project yet.
                                            </div>
                                        ) : (
                                            projectTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm hover:border-gray-300 transition-all group">
                                                    <button 
                                                        onClick={() => updateTask(task.id, { 
                                                            status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE 
                                                        })}
                                                        className={`shrink-0 ${task.status === TaskStatus.DONE ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                                                    >
                                                        {task.status === TaskStatus.DONE ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                    </button>
                                                    
                                                    <span 
                                                        onClick={() => setActiveTaskId(task.id)}
                                                        className={`flex-1 text-sm font-medium cursor-pointer ${task.status === TaskStatus.DONE ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                                                    >
                                                        {task.title}
                                                    </span>

                                                    {task.dueDate && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}

                                                    <button 
                                                        onClick={() => deleteTask(task.id)}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    
                                    <form onSubmit={handleCreateProjectTask} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Add a new task..."
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            className="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 text-sm"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newTaskTitle.trim()}
                                            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Footer (Only for Details tab contains Submit button, Tasks tab updates instantly) */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-xl">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                            >
                                Close
                            </button>
                            {activeTab === 'details' && (
                                <button 
                                    type="submit" 
                                    form="project-form"
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-colors"
                                >
                                    {editingId ? 'Save Changes' : 'Create Project'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}