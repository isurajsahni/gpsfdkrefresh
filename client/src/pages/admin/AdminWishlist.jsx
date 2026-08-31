import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineHeart } from 'react-icons/hi';
import toast from 'react-hot-toast';
import API from '../../utils/api';

/**
 * Most-liked products.
 *
 * This is demand that hasn't converted yet — what customers saved but didn't
 * buy. The wishlist already syncs across a customer's devices and the website;
 * this is the first view of it in aggregate.
 *
 * There is no app-vs-website split here because the Wishlist model doesn't
 * record where a like happened, unlike Order. Adding a `source` field would
 * make it possible and is a one-line change on the model.
 */
const AdminWishlist = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await API.get('/wishlist/top?limit=50', { signal: controller.signal });
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          toast.error('Failed to load liked products');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const totalLikes = rows.reduce((n, r) => n + r.likes, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-secondary">Liked Products</h1>
        <p className="text-gray-500 mt-1">What customers saved but haven&apos;t bought yet</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-center py-20">No products have been liked yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Products liked', value: rows.length },
              { label: 'Total likes', value: totalLikes },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-400">{s.label}</p>
                <p className="text-2xl font-heading font-bold text-secondary mt-1 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-5 py-3">Product</th>
                    <th className="text-right font-medium px-5 py-3">Likes</th>
                    <th className="text-right font-medium px-5 py-3">Last liked</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-t border-gray-100"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {r.image ? (
                            <img src={r.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <HiOutlineHeart className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-secondary">{r.name || 'Deleted product'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{r.likes}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-500">
                        {r.lastLikedAt ? new Date(r.lastLikedAt).toLocaleDateString() : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminWishlist;
