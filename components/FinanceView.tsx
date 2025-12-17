

import React, { useContext, useState, useMemo } from 'react';
import { StoreContext } from '../App';
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Trash2, Wallet, Pencil, User } from 'lucide-react';
import { FinanceTransaction, TransactionType } from '../types';

export const FinanceView: React.FC = () => {
    const { transactions, addTransaction, updateTransaction, deleteTransaction, activeListId } = useContext(StoreContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [desc, setDesc] = useState('');
    const [contact, setContact] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Filter transactions for current module
    const filteredTransactions = transactions.filter(t => {
        const matchesList = t.listId === activeListId;
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (t.contact && t.contact.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesList && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate Summary
    const summary = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        return {
            income,
            expense,
            balance: income - expense
        };
    }, [filteredTransactions]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setDesc(''); setContact(''); setAmount(''); setCategory(''); setType(TransactionType.EXPENSE); setDate(new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (t: FinanceTransaction) => {
        setEditingId(t.id);
        setDesc(t.description);
        setContact(t.contact || '');
        setAmount(t.amount.toString());
        setType(t.type);
        setCategory(t.category);
        setDate(new Date(t.date).toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!activeListId) return;

        if (editingId) {
             updateTransaction(editingId, {
                description: desc,
                contact: contact,
                amount: parseFloat(amount),
                type: type,
                category: category,
                date: new Date(date)
             });
        } else {
            const newTrans: FinanceTransaction = {
                id: crypto.randomUUID(),
                listId: activeListId,
                description: desc,
                contact: contact,
                amount: parseFloat(amount),
                type: type,
                category: category,
                date: new Date(date)
            };
            addTransaction(newTrans);
        }
        setIsModalOpen(false);
        setDesc(''); setContact(''); setAmount(''); setCategory('');
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><DollarSign size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Financial Overview</h1>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-200">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Net Balance</span>
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                            {formatCurrency(summary.balance)}
                        </span>
                        <div className={`p-2 rounded-full ${summary.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             <Wallet size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Income</span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(summary.income)}
                        </span>
                        <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                             <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Expenses</span>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-rose-600">
                            {formatCurrency(summary.expense)}
                        </span>
                        <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                             <TrendingDown size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-white sticky top-0 z-10">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search transactions..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all"
                    />
                </div>
            </div>

            {/* Transaction Table or Empty State */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                {filteredTransactions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500">
                            <DollarSign size={32} />
                        </div>
                        <p className="text-lg font-medium text-gray-600">No transactions found</p>
                        <p className="text-sm max-w-xs text-center mt-2">Start tracking your project budget by adding your first income or expense.</p>
                        <button 
                            onClick={handleOpenAdd}
                            className="mt-6 text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                        >
                            <Plus size={16} /> Create Transaction
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 border-b border-gray-100">
                                 <tr>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Description</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Contact</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Category</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500">Date</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500 text-right">Amount</th>
                                     <th className="px-6 py-3 font-semibold text-gray-500 text-right w-20">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                 {filteredTransactions.map(t => (
                                     <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                         <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                             <div className={`p-1.5 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {t.type === TransactionType.INCOME ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                                             </div>
                                             {t.description}
                                         </td>
                                         <td className="px-6 py-4 text-gray-600">
                                             {t.contact || '-'}
                                         </td>
                                         <td className="px-6 py-4">
                                             <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                {t.category}
                                             </span>
                                         </td>
                                         <td className="px-6 py-4 text-gray-500">
                                             <div className="flex items-center gap-2">
                                                 <Calendar size={14} />
                                                 {new Date(t.date).toLocaleDateString()}
                                             </div>
                                         </td>
                                         <td className={`px-6 py-4 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-900'}`}>
                                             {t.type === TransactionType.EXPENSE && '-'} {formatCurrency(t.amount)}
                                         </td>
                                         <td className="px-6 py-4 text-right">
                                             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button 
                                                    onClick={() => handleOpenEdit(t)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                    title="Edit"
                                                 >
                                                     <Pencil size={16} />
                                                 </button>
                                                 <button 
                                                    onClick={() => deleteTransaction(t.id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                                    title="Delete"
                                                 >
                                                     <Trash2 size={16} />
                                                 </button>
                                             </div>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
                        <h2 className="text-lg font-bold mb-6 text-gray-800">{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
                        
                        <div className="space-y-5">
                            {/* Type Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setType(TransactionType.INCOME)}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Income
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType(TransactionType.EXPENSE)}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Expense
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                                <input 
                                    autoFocus
                                    required 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                                    value={desc} 
                                    onChange={e => setDesc(e.target.value)}
                                    placeholder="e.g. Office Supplies"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Contact / Payee</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User size={16} />
                                    </div>
                                    <input 
                                        className="w-full pl-9 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                                        value={contact} 
                                        onChange={e => setContact(e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Amount</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required 
                                            className="w-full pl-7 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                                            value={amount} 
                                            onChange={e => setAmount(e.target.value)} 
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                                        value={date} 
                                        onChange={e => setDate(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
                                <input 
                                    required 
                                    list="category-suggestions"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3" 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)}
                                    placeholder={type === TransactionType.INCOME ? "e.g. Sales, Salary" : "e.g. Rent, Software"}
                                />
                                <datalist id="category-suggestions">
                                    <option value="Sales" />
                                    <option value="Consulting" />
                                    <option value="Salary" />
                                    <option value="Rent" />
                                    <option value="Software" />
                                    <option value="Utilities" />
                                    <option value="Marketing" />
                                    <option value="Equipment" />
                                    <option value="Services" />
                                </datalist>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                                {editingId ? 'Save Changes' : 'Save Transaction'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
