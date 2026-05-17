import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineTrash, HiChevronDown, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineUser, HiOutlineShieldCheck } from 'react-icons/hi';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const InfoItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
        <p className="text-sm text-secondary font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  // Pagination + search + role filter (server-side)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const PAGE_SIZE = 50;

  const fetchUsers = async (signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        paginate: 'true',
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const { data } = await API.get(`/auth/users?${params.toString()}`, { signal });
      const list = Array.isArray(data) ? data : (data?.users || []);
      setUsers(list);
      setTotal(Array.isArray(data) ? list.length : (data?.total || 0));
      setTotalPages(Array.isArray(data) ? 1 : (data?.totalPages || 1));
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, roleFilter]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/auth/users/${id}`);
      toast.success('User deleted');
      if (expandedUserId === id) setExpandedUserId(null);
      fetchUsers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleRoleChange = async (id, newRole, e) => {
    e.stopPropagation();
    try {
      await API.put(`/auth/users/${id}/role`, { role: newRole });
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const toggleExpand = (id) => {
    setExpandedUserId(prev => prev === id ? null : id);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary">Users {total > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({total} total)</span>}</h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, phone…"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 max-w-full focus:outline-none focus:border-accent"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent"
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="admin_marketing">Admin (Marketing)</option>
            <option value="order_manager">Order Manager</option>
            <option value="coupon_manager">Coupon Manager</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-4 font-semibold text-gray-600 w-10"></th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Role</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Joined</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => {
                const isExpanded = expandedUserId === user._id;
                return (
                  <Fragment key={user._id}>
                    {/* Clickable Main Row */}
                    <tr
                      onClick={() => toggleExpand(user._id)}
                      className={`cursor-pointer transition-colors duration-200 ${isExpanded ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-4">
                        <HiChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-secondary">{user.name}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user._id, e.target.value, e)}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer appearance-none pr-8 ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'admin_marketing' ? 'bg-indigo-100 text-indigo-700' :
                            user.role === 'marketing' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'order_manager' ? 'bg-orange-100 text-orange-700' :
                            user.role === 'coupon_manager' ? 'bg-teal-100 text-teal-700' :
                            'bg-gray-100 text-gray-600'
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.25rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.2em 1.2em'
                          }}
                        >
                          <option value="user">USER</option>
                          <option value="marketing">MARKETING</option>
                          <option value="order_manager">ORDER MANAGER</option>
                          <option value="coupon_manager">COUPON MANAGER</option>
                          <option value="admin">ADMIN</option>
                          <option value="admin_marketing">ADMIN & MARKETING</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={(e) => handleDelete(user._id, e)} className="text-red-400 hover:text-red-600 p-1">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="6" className="p-0 border-t-0">
                          <div className="px-8 py-6 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/60 border-t border-amber-100/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Basic Info */}
                              <div className="space-y-4">
                                <h4 className="text-xs uppercase tracking-widest text-accent font-bold border-b border-amber-200/50 pb-2">
                                  Basic Information
                                </h4>
                                <InfoItem icon={HiOutlineUser} label="Full Name" value={user.name} />
                                <InfoItem icon={HiOutlineMail} label="Email Address" value={user.email} />
                                <InfoItem icon={HiOutlinePhone} label="Phone Number" value={user.phone || 'Not provided'} />
                                <InfoItem icon={HiOutlineShieldCheck} label="Role" value={user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} />
                              </div>

                              {/* Account Details */}
                              <div className="space-y-4">
                                <h4 className="text-xs uppercase tracking-widest text-accent font-bold border-b border-amber-200/50 pb-2">
                                  Account Details
                                </h4>
                                <InfoItem icon={HiOutlineCalendar} label="Account Created" value={new Date(user.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })} />
                                <InfoItem icon={HiOutlineCalendar} label="Last Updated" value={new Date(user.updatedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })} />
                                <InfoItem icon={HiOutlineUser} label="User ID" value={user._id} />
                              </div>

                              {/* Addresses */}
                              <div className="space-y-4">
                                <h4 className="text-xs uppercase tracking-widest text-accent font-bold border-b border-amber-200/50 pb-2">
                                  Saved Addresses ({user.addresses?.length || 0})
                                </h4>
                                {user.addresses && user.addresses.length > 0 ? (
                                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                    {user.addresses.map((addr, idx) => (
                                      <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm relative">
                                        {addr.isDefault && (
                                          <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                            Default
                                          </span>
                                        )}
                                        <div className="flex items-start gap-2">
                                          <HiOutlineLocationMarker className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                          <div className="text-xs text-gray-600 leading-relaxed">
                                            {addr.fullName && <p className="font-semibold text-secondary text-sm">{addr.fullName}</p>}
                                            {addr.phone && <p className="text-gray-400">📞 {addr.phone}</p>}
                                            <p>
                                              {[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                                            </p>
                                            <p>
                                              {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                                            </p>
                                            {addr.country && <p>{addr.country}</p>}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">No saved addresses</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
