import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    code: '', 
    discountType: 'percentage', 
    discountValue: 0, 
    minOrderValue: 0, 
    maxUsers: 100, 
    maxUsesPerUser: 1, 
    expiryDate: '' 
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await API.get('/coupons');
      setCoupons(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/coupons', form);
      toast.success('Coupon created');
      setShowForm(false);
      setForm({
        code: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxUsers: 100, maxUsesPerUser: 1, expiryDate: ''
      });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await API.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-secondary">Coupons</h1>
        <button onClick={() => { setShowForm(true); }} className="btn-primary text-sm flex items-center gap-2">
          <HiOutlinePlus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold text-secondary">New Coupon</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Coupon Code</label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent uppercase" placeholder="e.g. SUMMER50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Discount Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Discount Value</label>
                  <input type="number" required min="1" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Min Order Value (₹)</label>
                <input type="number" required min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Max Users</label>
                  <input type="number" required min="1" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Uses Per User</label>
                  <input type="number" required min="1" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: Number(e.target.value) })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Expiry Date (Optional)</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:border-accent" />
              </div>
              
              <button type="submit" className="btn-primary w-full mt-6">Create Coupon</button>
            </form>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <div key={coupon._id} className={"bg-white rounded-2xl p-6 shadow-sm border " + (coupon.isActive ? "border-gray-100" : "border-red-100 bg-red-50/20")}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-heading font-bold text-lg px-3 py-1 bg-green-100 text-green-700 rounded-lg">{coupon.code}</h3>
                {!coupon.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Inactive</span>}
              </div>
              <div className="space-y-1 mt-4">
                <p className="text-sm font-semibold text-gray-700">
                  Discount: {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                </p>
                <p className="text-sm text-gray-500">Min Order: ₹{coupon.minOrderValue}</p>
                <p className="text-sm text-gray-500">Users: {coupon.usageHistory?.length || 0} / {coupon.maxUsers}</p>
                <p className="text-sm text-gray-500">Uses/User: {coupon.maxUsesPerUser}</p>
                {coupon.expiryDate && (
                  <p className="text-xs text-gray-400 mt-2">Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => handleDelete(coupon._id)} className="text-red-400 hover:text-red-600 text-sm font-medium flex items-center gap-1">
                  <HiOutlineTrash className="w-4 h-4"/> Delete
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
             <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
               No coupons found. Create your first coupon!
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
