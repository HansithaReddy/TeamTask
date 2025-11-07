import React, { useEffect, useState } from 'react';
import api from '../services/api.firebase';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { CompletionPie, PriorityBarChart } from '../components/ChartAnalytics';

export default function AdminAnalytics() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If you have an authenticated admin, scope analytics to their group
        const user = null
        // attempt to get current user via client in other parts of the app; fall back to global tasks/users
        const [t, u] = await Promise.all([
          api.getTasks(),
          api.getUsers()
        ]);
        if (!mounted) return;
        setTasks(t);
        setUsers(u);
      } catch (e) {
        setToast({ show: true, message: e.message || 'Failed to load analytics', type: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const done = tasks.filter(t => t.status === 'Done').length;
  const completionRate = tasks.length ? Math.round((done/tasks.length)*100) : 0;
  const byPriority = { low:0, medium:0, high:0 };
  tasks.forEach(t => byPriority[t.priority||'medium'] = (byPriority[t.priority||'medium']||0)+1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={()=>setToast({show:false,message:'',type:toast.type})} />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h2 className="text-xl font-semibold">Admin Analytics</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">Overview of all users' task activity</p>
          {loading ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded shadow text-sm">Loading analytics...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">Total tasks</div>
                  <div className="text-2xl font-bold">{tasks.length}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">Completion rate</div>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <div className="text-xs text-gray-400">({tasks.length} tasks)</div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-700 flex flex-col items-center">
                  <h3 className="text-base font-semibold mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l2 2 4-4" /></svg>
                    Task Completion Status
                  </h3>
                  <CompletionPie tasks={tasks} />
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-pink-100 dark:border-gray-700 flex flex-col items-center">
                  <h3 className="text-base font-semibold mb-3 text-pink-700 dark:text-pink-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="10" width="4" height="8" rx="1"/><rect x="10" y="6" width="4" height="12" rx="1"/><rect x="16" y="13" width="4" height="5" rx="1"/></svg>
                    Task Priority Distribution
                  </h3>
                  <PriorityBarChart tasks={tasks} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">To Do Tasks</div>
                  <div className="text-lg font-bold">{tasks.filter(t => t.status === 'To Do').length}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">In Progress</div>
                  <div className="text-lg font-bold">{tasks.filter(t => t.status === 'In Progress').length}</div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
                  <div className="text-xs text-gray-500">High Priority</div>
                  <div className="text-lg font-bold">{byPriority.high}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
