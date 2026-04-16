import React, { useState, useEffect } from 'react';
import { Plus, Video, FileText, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function ELearning() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', type: 'Video', url: '' });

  const fetchMaterials = async () => {
    if (!user?.schoolId) return;
    try {
      // Mock APIs
      setMaterials([]);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;

    try {
      setShowAddModal(false);
      setNewMaterial({ title: '', type: 'Video', url: '' });
      fetchMaterials();
    } catch (error) {
      console.error("Error adding material:", error);
      alert("Failed to add material");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Failed to delete material");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Video className="h-6 w-6 text-slate-400 mr-3" />;
      case 'Document': return <FileText className="h-6 w-6 text-slate-400 mr-3" />;
      case 'Link': return <LinkIcon className="h-6 w-6 text-slate-400 mr-3" />;
      default: return <FileText className="h-6 w-6 text-slate-400 mr-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">eLearning Materials</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-slate-200">
          {materials.map((mat) => (
            <li key={mat.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {getIcon(mat.type)}
                <div>
                  <p className="text-sm font-medium text-slate-900">{mat.title}</p>
                  <a href={mat.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">{mat.url}</a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {mat.type}
                </span>
                <button onClick={() => handleDeleteMaterial(mat.id)} className="text-red-600 hover:text-red-900">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {materials.length === 0 && (
            <li className="px-6 py-4 text-center text-slate-500">No materials found.</li>
          )}
        </ul>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">Add eLearning Material</h2>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newMaterial.type}
                  onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
                >
                  <option value="Video">Video</option>
                  <option value="Document">Document</option>
                  <option value="Link">Link</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">URL</label>
                <input
                  type="url"
                  required
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newMaterial.url}
                  onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
