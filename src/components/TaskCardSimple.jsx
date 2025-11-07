import React from 'react';
import { motion } from 'framer-motion';

export default function TaskCardSimple({ task, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`card p-4 rounded-xl smooth hover:shadow-lg cursor-pointer relative
        before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-blue-500/50 before:transition-all
        hover:before:border-blue-500 hover:before:scale-[1.02] ${
        task.taskType === 'group'
        ? 'bg-purple-50 dark:bg-purple-900/10'
        : 'bg-blue-50 dark:bg-blue-900/10'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{task.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            task.priority === 'high'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : task.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{task.due ? new Date(task.due).toLocaleString() : '—'}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            task.status === 'Done'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : task.status === 'In Progress'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {task.status}
          </span>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Assigned by: {task.assignedBy || 'Unknown'}
        </div>
      </div>
    </motion.div>
  );
}