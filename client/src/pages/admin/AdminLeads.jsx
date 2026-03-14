import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data } = await API.get('/leads');
        setLeads(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchLeads();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-secondary mb-8">Contact Leads</h1>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : leads.length === 0 ? (
        <p className="text-gray-500 text-center py-20">No leads yet</p>
      ) : (
        <div className="space-y-4">
          {leads.map((lead, i) => (
            <motion.div key={lead._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-secondary">{lead.name}</h3>
                  <p className="text-sm text-gray-500">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-600 mt-3 text-sm">{lead.message}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeads;
