import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import api from '../services/api.firebase';
import useAuth from '../hooks/useAuth';

export default function AdminActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [usersMap, setUsersMap] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [items, users] = await Promise.all([api.getActivity(), api.getUsers()]);
        if (!mounted) return;
        const map = {};
        users.forEach(u => { map[u.id] = u });
        setUsersMap(map);
        setActivities(items);
      } catch (e) {
        setToast({ show: true, message: e.message || 'Failed to load activity', type: 'error' });
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const renderMessage = (a) => {
    const meta = a.meta || {};
    const actor = usersMap[a.createdBy]?.name || a.createdBy;
    switch (a.action) {
      case 'create-user': return `${actor ? actor + ' — ' : ''}New user "${meta.name || meta.email || a.userId}" was created`;
      case 'delete-user': return `${actor ? actor + ' — ' : ''}User "${meta.name || a.userId}" was deleted`;
      case 'create': return `${actor ? actor + ' — ' : ''}Task "${meta.title || meta.id || a.taskId}" was created`;
      case 'update': return `${actor ? actor + ' — ' : ''}Task "${meta.title || a.taskId}" was updated`;
      case 'delete': return `${actor ? actor + ' — ' : ''}Task "${meta.title || a.taskId}" was deleted`;
      case 'comment': return `${actor ? actor + ' — ' : ''}Comment added to task ${a.taskId}`;
      default: return `${actor ? actor + ' — ' : ''}${a.action || 'Activity'}`;
    }
  };

  const fmt = (ts) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString();
    } catch (e) {
      return String(ts);
    }
  };

  const filteredActivities = activities.filter(a => {
    if (!search) return true;
    const msg = renderMessage(a).toLowerCase();
    return msg.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: toast.type })} />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Admin Activity Log</h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search activity..."
              className="p-2 rounded border w-48 text-sm"
              style={{ minWidth: 0 }}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4 divide-y divide-gray-100 dark:divide-gray-700">
            {filteredActivities.length === 0 ? (
              <div className="text-gray-500 text-sm py-8 text-center">No activity found.</div>
            ) : (
              filteredActivities.map(a => (
                <div key={a.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-gray-900 dark:text-gray-100 text-sm">{renderMessage(a)}</div>
                    <div className="text-xs text-gray-400 mt-1">{fmt(a.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
