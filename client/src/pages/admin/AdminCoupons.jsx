import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineEye, HiOutlineTicket } from 'react-icons/hi';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [marketingUsers, setMarketingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showUsage, setShowUsage] = useState(false);
  const [usageData, setUsageData] = useState([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [form, setForm] = useState({ 
    code: '', 
    discountType: 'percentage', 
    discountValue: 0, 
    minOrderValue: 0, 
    maxUsers: 100, 
    maxUsesPerUser: 1, 
    expiryDate: '',
    assignedTo: '',
    isActive: true,
  });

  const fetchInitialData = async () => {
    try {
      const [couponsRes, usersRes] = await Promise.all([
        API.get('/coupons'),
        API.get('/marketing/admin/users').catch(() => ({ data: [] }))
      ]);
      setCoupons(couponsRes.data);
      setMarketingUsers(usersRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxUsers: coupon.maxUsers,
      maxUsesPerUser: coupon.maxUsesPerUser,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      assignedTo: coupon.assignedTo || '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const fetchUsageDetails = async () => {
    setLoadingUsage(true);
    setShowUsage(true);
    try {
      const res = await API.get('/coupons/usage');
      setUsageData(res.data);
    } catch (err) {
      toast.error('Failed to fetch usage details');
    }
    setLoadingUsage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.assignedTo === '') payload.assignedTo = null;

      if (editingCoupon) {
        await API.put(`/coupons/${editingCoupon._id}`, payload);
        toast.success('Coupon updated');
      } else {
        await API.post('/coupons', payload);
        toast.success('Coupon created');
      }
      setShowForm(false);
      setEditingCoupon(null);
      setForm({
        code: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxUsers: 100, maxUsesPerUser: 1, expiryDate: '', assignedTo: '', isActive: true
      });
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon? This action cannot be undone.')) return;
    try {
      await API.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchInitialData();
    } catch (err) { toast.error('Delete failed'); }
  };

  const isCouponManager = ['admin', 'admin_marketing', 'coupon_manager'].includes(user?.role);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary">Coupon Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create, edit, and track promotional offers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsageDetails} className="btn-secondary text-sm flex items-center gap-2">
            <HiOutlineEye className="w-4 h-4" /> View All Usage
          </button>
          <button onClick={() => { setEditingCoupon(null); setForm({ code: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxUsers: 100, maxUsesPerUser: 1, expiryDate: '', assignedTo: '', isActive: true }); setShowForm(true); }} className="btn-primary text-sm flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Coupon
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 my-8 relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-heading font-bold text-secondary">{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button onClick={() => { setShowForm(false); setEditingCoupon(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><HiOutlineX className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Coupon Code</label>
                  <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none uppercase font-mono font-bold text-secondary" placeholder="e.g. WELCOME10" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none appearance-none">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Value</label>
                  <input type="number" required min="1" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Minimum Order Amount (₹)</label>
                <input type="number" required min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Max Total Users</label>
                  <input type="number" required min="1" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Uses Per User</label>
                  <input type="number" required min="1" value={form.maxUsesPerUser} onChange={(e) => setForm({ ...form, maxUsesPerUser: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-accent outline-none" />
              </div>

              <div className="p-4 bg-cream/30 rounded-2xl border border-cream">
                <label className="block text-sm font-bold text-secondary mb-2 ml-1">Assign to Marketing Partner</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full px-4 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-accent outline-none appearance-none">
                  <option value="">No Partner (Public Coupon)</option>
                  {marketingUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 ml-1">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded-md text-accent focus:ring-accent border-gray-300" />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Coupon is Active</label>
              </div>
              
              <button type="submit" className="btn-primary w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-accent/20">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showUsage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary">Coupon Usage History</h2>
                <p className="text-gray-500 text-sm">Detailed record of every purchase made using coupons</p>
              </div>
              <button onClick={() => setShowUsage(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><HiOutlineX className="w-6 h-6 text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl border border-gray-100">
              {loadingUsage ? (
                <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Coupon</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Order Amt</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right text-accent">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usageData.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">{u.couponId?.code || 'N/A'}</span></td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-secondary">{u.customerId?.name || 'Guest User'}</div>
                          <div className="text-xs text-gray-400">{u.customerId?.email || ''}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{u.orderId}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-secondary">₹{u.orderAmount}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-accent">₹{u.discountAmount}</td>
                      </tr>
                    ))}
                    {usageData.length === 0 && (
                      <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No usage records found yet.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <motion.div layout key={coupon._id} className={"bg-white rounded-3xl p-6 shadow-sm border transition-all hover:shadow-xl hover:shadow-gray-200/50 group " + (coupon.isActive ? "border-gray-100" : "border-red-100 bg-red-50/10")}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading font-black text-2xl tracking-tight text-secondary group-hover:text-accent transition-colors">{coupon.code}</h3>
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${coupon.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream text-secondary uppercase tracking-wider">
                      {coupon.discountType}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-accent">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">OFF</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-dashed border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Usage Limit</span>
                  <span className="font-bold text-secondary">{coupon.usageHistory?.length || 0} / {coupon.maxUsers}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Min Order</span>
                  <span className="font-bold text-secondary">₹{coupon.minOrderValue}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">Uses Per User</span>
                  <span className="font-bold text-secondary">{coupon.maxUsesPerUser}</span>
                </div>
                {coupon.expiryDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-medium">Expires On</span>
                    <span className="font-bold text-gray-500">{new Date(coupon.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {coupon.assignedTo && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-cream rounded-full flex items-center justify-center text-secondary font-bold text-xs">
                      {(marketingUsers.find(u => u._id === coupon.assignedTo)?.name || 'M')[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner</p>
                      <p className="text-xs font-bold text-secondary truncate max-w-[150px]">{marketingUsers.find(u => u._id === coupon.assignedTo)?.name || 'Assigned Partner'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-8 pt-4 border-t border-gray-50">
                <button onClick={() => handleEdit(coupon)} className="flex-1 bg-gray-50 hover:bg-cream text-secondary py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <HiOutlinePencil className="w-4 h-4" /> Edit
                </button>
                {isCouponManager && (
                  <button onClick={() => handleDelete(coupon._id)} className="w-12 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-colors">
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {coupons.length === 0 && (
             <div className="col-span-full bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
               <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                 <HiOutlineTicket className="w-10 h-10 text-secondary/30" />
               </div>
               <h3 className="text-xl font-bold text-secondary">No Coupons Yet</h3>
               <p className="text-gray-400 mt-2">Ready to boost your sales? Create your first promotional coupon!</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
