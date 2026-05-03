import React from 'react';
import { UserPlus, Edit2, Trash2, Activity, Shield, Mail } from 'lucide-react';

const UsersTab = ({ users, setShowRegisterModal, handleEditUser, handleDeleteUser, t }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h2>
          <p className="text-sm text-gray-500">Manage staff accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-purple-100 transition-all"
        >
          <UserPlus size={18} /> {t('admin.users.registerNew')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.fullName')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.email')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.role')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.status')}</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => {
              const isOnline = u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 300000;
              return (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                      u.role === 'admin' ? 'bg-red-50 text-red-600' : 
                      u.role === 'chef' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Shield size={10} /> {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOnline ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {t('admin.overview.online')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Activity size={12} />
                        {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : t('admin.overview.offline')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditUser(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(UsersTab);
