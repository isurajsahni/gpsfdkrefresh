import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', customizable: false, customizationLabel: 'Custom Text', featured: false, isMasonry: false,
    variations: [{ material: '', frame: '', size: '', color: '', price: 0, comparePrice: 0, stock: 100 }],
    images: [],
  });

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=100');
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    API.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing) {
        await API.put(`/products/${editing}`, payload);
        toast.success('Product updated');
      } else {
        await API.post('/products', payload);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '', category: '', customizable: false, customizationLabel: 'Custom Text', featured: false, isMasonry: false, variations: [{ material: '', frame: '', size: '', color: '', price: 0, comparePrice: 0, stock: 100 }], images: [] });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description,
      category: product.category?._id || product.category,
      customizable: product.customizable,
      customizationLabel: product.customizationLabel || 'Custom Text',
      featured: product.featured,
      isMasonry: product.isMasonry,
      variations: product.variations?.length > 0 ? product.variations : [{ material: '', frame: '', size: '', color: '', price: 0, comparePrice: 0, stock: 100 }],
      images: product.images || [],
    });
    setEditing(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const addVariation = () => {
    setForm({ ...form, variations: [...form.variations, { material: '', frame: '', size: '', color: '', price: 0, comparePrice: 0, stock: 100 }] });
  };

  const updateVariation = (index, field, value) => {
    const updated = [...form.variations];
    updated[index][field] = field === 'price' || field === 'comparePrice' || field === 'stock' ? Number(value) : value;
    setForm({ ...form, variations: updated });
  };

  const removeVariation = (index) => {
    setForm({ ...form, variations: form.variations.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-bold text-secondary">Products</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary text-sm flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-secondary">{editing ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Product Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent">
                    <option value="">Select</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.customizable} onChange={(e) => setForm({ ...form, customizable: e.target.checked })} className="accent-accent" /> Customizable</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-accent" /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isMasonry} onChange={(e) => setForm({ ...form, isMasonry: e.target.checked })} className="accent-accent" /> Masonry</label>
                </div>
              </div>

              {/* Variations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">Variations</label>
                  <button type="button" onClick={addVariation} className="text-accent text-sm font-semibold hover:underline">+ Add Variation</button>
                </div>
                {form.variations.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 p-3 bg-gray-50 rounded-xl relative">
                    <input placeholder="Material" value={v.material} onChange={(e) => updateVariation(i, 'material', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    <input placeholder="Frame" value={v.frame} onChange={(e) => updateVariation(i, 'frame', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    <input placeholder="Size" required value={v.size} onChange={(e) => updateVariation(i, 'size', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    <input placeholder="Color" value={v.color} onChange={(e) => updateVariation(i, 'color', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    <input type="number" placeholder="Price" required value={v.price || ''} onChange={(e) => updateVariation(i, 'price', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    <input type="number" placeholder="Compare Price" value={v.comparePrice || ''} onChange={(e) => updateVariation(i, 'comparePrice', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    <input type="number" placeholder="Stock" value={v.stock || ''} onChange={(e) => updateVariation(i, 'stock', e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-accent" />
                    {form.variations.length > 1 && (
                      <button type="button" onClick={() => removeVariation(i)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                    )}
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary w-full">{editing ? 'Update Product' : 'Create Product'}</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Table */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Variations</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0]?.url || 'https://via.placeholder.com/50'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-medium text-secondary">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{product.category?.name}</td>
                    <td className="px-6 py-4 font-semibold text-accent">₹{product.basePrice?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{product.variations?.length || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 p-1"><HiOutlinePencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(product._id)} className="text-red-400 hover:text-red-600 p-1 ml-2"><HiOutlineTrash className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
