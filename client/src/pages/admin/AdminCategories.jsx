import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      setCategories(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/categories/${editing}`, form);
        toast.success('Category updated');
      } else {
        await API.post('/categories', form);
        toast.success('Category created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-secondary">Categories</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '' }); }} className="btn-primary text-sm flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-secondary">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" rows={3} />
              </div>
              <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Create'}</button>
            </form>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-heading font-semibold text-secondary text-lg">{cat.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
              <p className="text-xs text-gray-400 mt-2">Slug: {cat.slug}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { handleEdit(cat); }} className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  {...{ onClick: () => { setForm({ name: cat.name, description: cat.description }); setEditing(cat._id); setShowForm(true); } }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(cat._id)} className="text-red-400 hover:text-red-600 text-sm font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
