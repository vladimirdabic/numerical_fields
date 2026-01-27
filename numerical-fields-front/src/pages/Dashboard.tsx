import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { InlineMath } from 'react-katex';

const api: string = import.meta.env.VITE_BACKEND_URL;

interface Sequence {
    id: string;
    name: string;
    description: string;
    color: string;
    formula: string;
    expression: string;
    fun_fact: string;
    seed: number[];
}

const Dashboard = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<Sequence>>({
        name: '',
        description: '',
        color: '#3b82f6',
        formula: '',
        expression: '',
        fun_fact: '',
        seed: [0]
    });

    const fetchSequences = async () => {
        try {
            const response = await fetch(`${api}/sequences`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch');
            
            const ids = await response.json();
            const sequencePromises = ids.map(async (id: string) => {
                const res = await fetch(`${api}/sequences/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();
                return {
                    id: data.text_id,
                    name: data.name,
                    description: data.description,
                    color: data.color,
                    formula: data.formula,
                    expression: data.expression,
                    fun_fact: data.fun_fact,
                    seed: data.seed || [0]
                };
            });
            
            const seqs = await Promise.all(sequencePromises);
            setSequences(seqs);
        } catch (error) {
            console.error('Failed to fetch sequences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSequences();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleEdit = (seq: Sequence) => {
        setEditingId(seq.id);
        setFormData(seq);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({
            name: '',
            description: '',
            color: '#3b82f6',
            formula: '',
            expression: '',
            fun_fact: '',
            seed: [0]
        });
    };

    const handleSeedChange = (value: string) => {
        try {
            const seedArray = value.split(',').map(v => {
                const num = parseInt(v.trim());
                return isNaN(num) ? 0 : num;
            }).filter((_, idx, arr) => idx < arr.length || value.trim().endsWith(','));
            
            setFormData({ ...formData, seed: seedArray.length > 0 ? seedArray : [0] });
        } catch {
            setFormData({ ...formData, seed: [0] });
        }
    };

    const handleSave = async () => {
        try {
            const url = editingId 
                ? `${api}/sequences/${editingId}` 
                : `${api}/sequences`;
            
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save');

            await fetchSequences();
            handleCancelEdit();
        } catch (error) {
            console.error('Failed to save sequence:', error);
            alert('Neuspesno čuvanje niza');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Dali ste sigurni da želite obrisati ovaj niz?')) return;

        try {
            const response = await fetch(`${api}/sequences/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete');

            await fetchSequences();
        } catch (error) {
            console.error('Failed to delete sequence:', error);
            alert('Neuspešno brisanje niza');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Upravljanje nizova</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>

                {/* Create New Button */}
                {!isCreating && !editingId && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="mb-6 flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                        <Plus size={20} />
                        Napravi novi niz
                    </button>
                )}

                {/* Create/Edit Form */}
                {(isCreating || editingId) && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            {editingId ? 'Izmeni niz' : 'Napravi novi niz'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Naziv
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                                    placeholder="npr. Parni Brojevi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Opis
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                                    rows={3}
                                    placeholder="Karatak opis niza"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Formula (LaTeX)
                                </label>
                                <input
                                    type="text"
                                    value={formData.formula}
                                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                                    placeholder="npr. 2n or n^2"
                                />
                                {(formData.formula != null || formData.formula != undefined) && (
                                    <span>
                                        <p>Preview: </p>
                                        <InlineMath math={formData.formula} />
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Expression za mathparser
                                </label>
                                <input
                                    type="text"
                                    value={formData.expression}
                                    onChange={(e) => setFormData({ ...formData, expression: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                                    placeholder="npr. 2*n ili 2^n"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Seed vrednosti (početni brojevi)
                                </label>
                                <input
                                    type="text"
                                    value={formData.seed?.join(', ') || '0'}
                                    onChange={(e) => handleSeedChange(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                                    placeholder="npr. 0 ili 0, 1 za Fibonacci"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Unesite brojeve odvojene zarezima. Npr: "0" za parne, "1" za neparne, "0, 1" za Fibonacci
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Boja
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="h-12 w-20 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                                        placeholder="#3b82f6"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Zanimljiva činjenica (LaTeX)
                                </label>
                                <input
                                    type="text"
                                    value={formData.fun_fact}
                                    onChange={(e) => setFormData({ ...formData, fun_fact: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                                    placeholder=""
                                />
                                {(formData.fun_fact != null || formData.fun_fact != undefined) && (
                                    <span>
                                        <p>Preview: </p>
                                        <InlineMath math={formData.fun_fact} />
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                            >
                                <Save size={20} />
                                Sačuvaj
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                            >
                                <X size={20} />
                                Otkaži
                            </button>
                        </div>
                    </div>
                )}

                {/* Sequences List */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sequences.map((seq) => (
                            <div
                                key={seq.id}
                                className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                                        style={{ backgroundColor: seq.color }}
                                    >
                                        #
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{seq.name}</h3>
                                        <p className="text-gray-600">{seq.description}</p>
                                        <p className="text-sm text-gray-500 font-mono mt-1">Formula: {seq.formula}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(seq)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(seq.id)}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;