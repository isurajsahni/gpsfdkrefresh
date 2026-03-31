import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import OtpModal from '../components/OtpModal';
import {
  HiOutlineUser, HiOutlineShoppingBag, HiOutlineLocationMarker,
  HiOutlineMail, HiOutlinePhone, HiOutlinePencil, HiOutlineCheck,
  HiOutlineX, HiOutlinePlus, HiOutlineTrash, HiOutlineShieldCheck
} from 'react-icons/hi';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

// ─── Curated Emoji Set ──────────────────────────────────────────────────────
const PROFILE_EMOJIS = [
  '😊', '😎', '🤩', '🥰', '😇', '🤗', '🧑‍💻', '👨‍🎨', '👩‍🎨', '🦊',
  '🐱', '🐶', '🦁', '🐼', '🦄', '🌟', '🔥', '💎', '🎨', '🎭',
  '🎵', '📸', '🌈', '🍀', '🌸', '🎯', '⚡', '🚀', '🏆', '💫',
  '🦋', '🌺', '🎪', '🧸', '🎀', '🌻', '🍁', '🎈', '🧊', '🪴',
];

const UserDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // OTP modals
  const [otpModal, setOtpModal] = useState({ open: false, type: 'phone', value: '' });
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState(null);
  const [emailVerifiedToken, setEmailVerifiedToken] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Address management
  const [editingAddress, setEditingAddress] = useState(null); // null or address _id
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, profileRes] = await Promise.all([
        API.get('/orders'),
        API.get('/auth/me')
      ]);
      setOrders(ordersRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const enterEditMode = () => {
    setEditName(profile?.name || user?.name || '');
    setEditAvatar(profile?.avatar || user?.avatar || '');
    setNewPhone(profile?.phone || user?.phone || '');
    setNewEmail(profile?.email || user?.email || '');
    setPhoneVerifiedToken(null);
    setEmailVerifiedToken(null);
    setPhoneVerified(false);
    setEmailVerified(false);
    setIsEditing(true);
    setShowEmojiPicker(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowEmojiPicker(false);
    setPhoneVerifiedToken(null);
    setEmailVerifiedToken(null);
    setPhoneVerified(false);
    setEmailVerified(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {};

      // Name (always sendable)
      if (editName.trim() !== (profile?.name || '')) {
        payload.name = editName.trim();
      }
      // Avatar (always sendable)
      if (editAvatar !== (profile?.avatar || '')) {
        payload.avatar = editAvatar;
      }
      // Phone (requires token if changed)
      if (newPhone.trim() !== (profile?.phone || '') && phoneVerifiedToken) {
        payload.phone = newPhone.trim();
        payload.phoneVerifiedToken = phoneVerifiedToken;
      }
      // Email (requires token if changed)
      if (newEmail.trim().toLowerCase() !== (profile?.email || '') && emailVerifiedToken) {
        payload.email = newEmail.trim().toLowerCase();
        payload.emailVerifiedToken = emailVerifiedToken;
      }

      if (Object.keys(payload).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        setSaving(false);
        return;
      }

      const { data } = await API.put('/auth/profile', payload);
      updateUser(data);
      setProfile({ ...profile, ...data });
      setIsEditing(false);
      setShowEmojiPicker(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePhoneVerified = (token, phone) => {
    setPhoneVerifiedToken(token);
    setNewPhone(phone);
    setPhoneVerified(true);
    setOtpModal({ open: false, type: 'phone', value: '' });
  };

  const handleEmailVerified = (token, email) => {
    setEmailVerifiedToken(token);
    setNewEmail(email);
    setEmailVerified(true);
    setOtpModal({ open: false, type: 'email', value: '' });
  };

  // ─── Address CRUD ──────────────────────────────────────────────────────────
  const resetAddressForm = () => {
    setAddressForm({
      fullName: '', phone: '', addressLine1: '', addressLine2: '',
      city: '', state: '', pincode: '', country: 'India',
    });
  };

  const handleSaveAddress = async () => {
    try {
      if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
        toast.error('Please fill all required fields');
        return;
      }
      if (editingAddress) {
        const { data } = await API.put(`/auth/addresses/${editingAddress}`, addressForm);
        setProfile(prev => ({ ...prev, addresses: data }));
        toast.success('Address updated!');
      } else {
        const { data } = await API.post('/auth/addresses', addressForm);
        setProfile(prev => ({ ...prev, addresses: data }));
        toast.success('Address added!');
      }
      setEditingAddress(null);
      setShowAddAddress(false);
      resetAddressForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr._id);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
    });
    setShowAddAddress(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const { data } = await API.delete(`/auth/addresses/${addressId}`);
      setProfile(prev => ({ ...prev, addresses: data }));
      toast.success('Address deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ─── Pincode auto-fetch ────────────────────────────────────────────────────
  const handlePincodeChange = async (val) => {
    setAddressForm(f => ({ ...f, pincode: val }));
    if (val.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const json = await res.json();
        if (json[0]?.Status === 'Success' && json[0]?.PostOffice?.length > 0) {
          const po = json[0].PostOffice[0];
          setAddressForm(f => ({ ...f, city: po.District, state: po.State }));
        }
      } catch { /* silent */ }
    }
  };

  const currentAvatar = profile?.avatar || user?.avatar || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-primary pt-24 pb-20 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-20">
      <div className="max-w-6xl mx-auto section-padding flex flex-col md:flex-row gap-8">
        
        {/* ─── Sidebar Navigation ─────────────────────────────────────── */}
        <div className="md:w-64 flex-shrink-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2rem] p-6 shadow-sm sticky top-[100px]">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 relative group">
                {currentAvatar ? (
                  <span className="text-3xl">{currentAvatar}</span>
                ) : (
                  <span className="text-3xl font-heading font-bold text-accent">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-heading font-bold text-secondary">{profile?.name || user?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.email || user?.email}</p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${activeTab === 'profile' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <HiOutlineUser className="w-5 h-5" /> My Profile
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${activeTab === 'orders' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <HiOutlineShoppingBag className="w-5 h-5" /> My Orders
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <button onClick={logout} className="text-red-500 hover:text-red-600 font-medium text-sm transition-colors">
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>

        {/* ─── Main Content Area ──────────────────────────────────────── */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* ─── Personal Information Card ─── */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <h3 className="text-2xl font-heading font-bold text-secondary">Personal Information</h3>
                    {!isEditing ? (
                      <button
                        onClick={enterEditMode}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 text-accent rounded-xl font-bold text-sm hover:bg-accent/20 transition-colors"
                      >
                        <HiOutlinePencil className="w-4 h-4" /> Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                          <HiOutlineX className="w-4 h-4" /> Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-5 py-2.5 bg-secondary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiOutlineCheck className="w-4 h-4" />
                          )}
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Avatar / Emoji */}
                  {isEditing && (
                    <div className="mb-8">
                      <label className="text-sm text-gray-500 font-medium mb-3 block">Profile Image</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center relative">
                          {editAvatar ? (
                            <span className="text-3xl">{editAvatar}</span>
                          ) : (
                            <span className="text-3xl font-heading font-bold text-accent">
                              {editName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-medium text-sm hover:bg-accent/20 transition-colors"
                          >
                            {showEmojiPicker ? 'Close Picker' : 'Choose Emoji'}
                          </button>
                          {editAvatar && (
                            <button
                              onClick={() => setEditAvatar('')}
                              className="ml-2 px-3 py-2 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-8 sm:grid-cols-10 gap-2">
                              {PROFILE_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => { setEditAvatar(emoji); setShowEmojiPicker(false); }}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:bg-white hover:shadow-md transition-all ${editAvatar === emoji ? 'bg-accent/20 ring-2 ring-accent shadow-md scale-110' : 'bg-transparent'}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="bg-primary p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-1">
                        <HiOutlineUser className="text-accent" />
                        <span className="text-sm text-gray-500 font-medium">Full Name</span>
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-lg font-semibold text-secondary bg-white transition-all"
                          placeholder="Your name"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-secondary">{profile?.name || user?.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="bg-primary p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-1">
                        <HiOutlineMail className="text-accent" />
                        <span className="text-sm text-gray-500 font-medium">Email Address</span>
                        {isEditing && emailVerified && (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <HiOutlineShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={e => { setNewEmail(e.target.value); setEmailVerified(false); setEmailVerifiedToken(null); }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-base font-semibold text-secondary bg-white transition-all"
                            placeholder="your@email.com"
                          />
                          {newEmail.trim().toLowerCase() !== (profile?.email || '') && !emailVerified && (
                            <button
                              onClick={() => setOtpModal({ open: true, type: 'email', value: newEmail.trim() })}
                              className="px-3 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-orange-600 transition-colors"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-lg font-semibold text-secondary">{profile?.email || user?.email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="bg-primary p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-1">
                        <HiOutlinePhone className="text-accent" />
                        <span className="text-sm text-gray-500 font-medium">Phone Number</span>
                        {isEditing && phoneVerified && (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <HiOutlineShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={e => { setNewPhone(e.target.value); setPhoneVerified(false); setPhoneVerifiedToken(null); }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-base font-semibold text-secondary bg-white transition-all"
                            placeholder="+91XXXXXXXXXX"
                          />
                          {newPhone.trim() !== (profile?.phone || '') && !phoneVerified && (
                            <button
                              onClick={() => setOtpModal({ open: true, type: 'phone', value: newPhone.trim() })}
                              className="px-3 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-green-700 transition-colors"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-lg font-semibold text-secondary">{profile?.phone || user?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Saved Addresses Card ─── */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <h3 className="text-2xl font-heading font-bold text-secondary">Saved Addresses</h3>
                    <button
                      onClick={() => { resetAddressForm(); setEditingAddress(null); setShowAddAddress(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 text-accent rounded-xl font-bold text-sm hover:bg-accent/20 transition-colors"
                    >
                      <HiOutlinePlus className="w-4 h-4" /> Add Address
                    </button>
                  </div>

                  {/* Add/Edit Address Form */}
                  <AnimatePresence>
                    {showAddAddress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-6"
                      >
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                          <h4 className="font-bold text-secondary text-lg">{editingAddress ? 'Edit Address' : 'New Address'}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                              placeholder="Full Name *"
                              value={addressForm.fullName}
                              onChange={e => setAddressForm(f => ({ ...f, fullName: e.target.value }))}
                              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="Phone *"
                              value={addressForm.phone}
                              onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="Address Line 1 *"
                              value={addressForm.addressLine1}
                              onChange={e => setAddressForm(f => ({ ...f, addressLine1: e.target.value }))}
                              className="sm:col-span-2 px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="Address Line 2 (Optional)"
                              value={addressForm.addressLine2}
                              onChange={e => setAddressForm(f => ({ ...f, addressLine2: e.target.value }))}
                              className="sm:col-span-2 px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="Pincode *"
                              value={addressForm.pincode}
                              onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="City *"
                              value={addressForm.city}
                              onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="State *"
                              value={addressForm.state}
                              onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                            <input
                              placeholder="Country"
                              value={addressForm.country}
                              onChange={e => setAddressForm(f => ({ ...f, country: e.target.value }))}
                              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white transition-all"
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={handleSaveAddress}
                              className="px-6 py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                            >
                              {editingAddress ? 'Update Address' : 'Save Address'}
                            </button>
                            <button
                              onClick={() => { setShowAddAddress(false); setEditingAddress(null); resetAddressForm(); }}
                              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {profile?.addresses?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.addresses.map((addr) => (
                        <div key={addr._id} className="p-5 rounded-2xl border border-gray-200 relative bg-primary group hover:shadow-md transition-shadow">
                          {addr.isDefault && (
                            <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold">Default</span>
                          )}
                          <p className="font-bold text-secondary text-lg mb-1">{addr.fullName}</p>
                          <p className="text-gray-500 text-sm mb-2 font-medium">{addr.phone}</p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                            {addr.city}, {addr.state} - {addr.pincode}<br />
                            {addr.country}
                          </p>
                          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-bold hover:bg-accent/20 transition-colors"
                            >
                              <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-primary rounded-2xl border border-dashed border-gray-300">
                      <HiOutlineLocationMarker className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No addresses saved yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-white rounded-[2rem] p-8 shadow-sm mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-heading font-bold text-secondary">Order History</h3>
                  <span className="bg-primary text-accent px-4 py-1.5 rounded-full text-sm font-bold">{orders.length} Orders</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-500 text-lg">You haven't placed any orders yet</p>
                    <Link to="/" className="inline-block mt-6 text-accent font-bold hover:underline">Start Shopping →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, i) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-6">
                          <div>
                            <p className="font-heading font-bold text-secondary text-lg">Order #{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {order.status}
                            </span>
                            <span className="font-bold text-accent text-xl">₹{order.totalPrice?.toLocaleString()}</span>
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <button 
                                onClick={async () => {
                                  if(window.confirm('Are you sure you want to cancel this order?')) {
                                    try {
                                      await API.put(`/orders/${order._id}/cancel`);
                                      toast.success('Order cancelled successfully');
                                      const { data } = await API.get('/orders');
                                      setOrders(data);
                                    } catch(err) {
                                      toast.error(err.response?.data?.message || 'Cancellation failed');
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors ml-2"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {order.items?.map((item, j) => (
                            <Link key={j} to={`/product/${item.product?.slug || item.product}`} className="flex items-center gap-4 bg-primary rounded-xl p-3 hover:shadow-md transition-shadow group">
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                              <div className="flex-1">
                                <span className="font-bold text-secondary group-hover:text-accent transition-colors line-clamp-1">{item.name}</span>
                                <div className="text-sm text-gray-500 mt-1 flex justify-between">
                                  <span>Qty: {item.quantity}</span>
                                  <span className="font-medium text-secondary">₹{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {order.trackingNumber && (
                          <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-center justify-between">
                            <span>Tracking Number: <strong className="ml-1">{order.trackingNumber}</strong></span>
                            {order.trackingUrl && (
                              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Track Status</a>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── OTP Modal ────────────────────────────────────────────── */}
      <OtpModal
        type={otpModal.type}
        value={otpModal.value}
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, type: 'phone', value: '' })}
        onVerified={otpModal.type === 'phone' ? handlePhoneVerified : handleEmailVerified}
      />
    </div>
  );
};

export default UserDashboard;
