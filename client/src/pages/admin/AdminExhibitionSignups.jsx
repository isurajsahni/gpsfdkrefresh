import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

const CountList = ({ title, rows }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <h2 className="font-semibold text-secondary mb-3">{title}</h2>
    {rows.length === 0 ? (
      <p className="text-sm text-gray-400">No sign-ups yet</p>
    ) : (
      <ul className="space-y-2">
        {rows.map(row => (
          <li key={row.label} className="flex justify-between gap-4 text-sm">
            <span className="text-gray-600 break-words min-w-0">{row.label}</span>
            <span className="font-semibold text-secondary">{row.count}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const AdminExhibitionSignups = () => {
  const [report, setReport] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    API.get('/auth/exhibition-signups', { signal: controller.signal })
      .then(({ data }) => setReport(data))
      .catch(err => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary">
          Exhibition sign-ups {report && <span className="text-sm font-normal text-gray-500 ml-2">({report.total} total)</span>}
        </h1>
        <Link to="/exhibition-signup" className="px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold text-center">
          Open sign-up form
        </Link>
      </div>
      {failed ? (
        <p className="text-sm text-red-600">Could not load the sign-ups. Please refresh the page.</p>
      ) : !report ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <CountList title="By exhibition" rows={report.byEvent} />
            <CountList title="By staff member" rows={report.byStaff} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Customer', 'WhatsApp', 'Email', 'Exhibition', 'Created by', 'Date'].map(heading => (
                    <th key={heading} className="text-left px-5 py-4 font-semibold text-gray-600 whitespace-nowrap">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.signups.map(signup => (
                  <tr key={signup._id}>
                    <td className="px-5 py-3 font-medium text-secondary">{signup.name}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{signup.phone || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{signup.email || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{signup.eventName}</td>
                    <td className="px-5 py-3 text-gray-500">{signup.staffName}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{new Date(signup.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminExhibitionSignups;
