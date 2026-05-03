import React from 'react';
import { TrendingUp, ShoppingBag, Clock, Activity, Circle, Users } from 'lucide-react';

const OverviewTab = ({ stats, setActiveTab, users, kitchenOrders, orderTimers, formatTime, t, onSalesClick, onOrdersClick }) => {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => onSalesClick && onSalesClick()}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-green-500 cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-green-600 transition-colors">{t('admin.overview.totalSales')}</h3>
            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors"><TrendingUp className="text-green-500" size={20} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">${Number(stats.todayRevenue || 0).toFixed(2)}</p>
        </div>

        <div
          onClick={() => onOrdersClick && onOrdersClick()}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-blue-500 cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-blue-600 transition-colors">{t('admin.overview.totalOrders')}</h3>
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><ShoppingBag className="text-blue-500" size={20} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.totalOrdersToday || 0}</p>
        </div>

        <div
          onClick={() => setActiveTab('kitchen')}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-orange-500 cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-orange-600 transition-colors">{t('admin.overview.pendingOrders')}</h3>
            <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors"><Clock className="text-orange-500" size={20} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">{(stats.pendingOrders || 0) + (stats.preparingOrders || 0)}</p>
        </div>

        <div
          onClick={() => setActiveTab('users')}
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-purple-500 cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-purple-600 transition-colors">{t('admin.overview.onlineStaff')}</h3>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors"><Activity className="text-purple-500" size={20} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {users.filter(u => {
              if (!u.lastActive) return false;
              const lastActive = new Date(u.lastActive).getTime();
              return (Date.now() - lastActive) < 300000; // 5 minutes
            }).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Order Monitor */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
               <h3 className="font-bold text-gray-800">{t('admin.overview.liveMonitor')}</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.overview.realtime')}</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {kitchenOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">{t('admin.overview.noActiveOrders')}</div>
            ) : (
              kitchenOrders
                .filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
                .map(order => (
                  <div
                    key={order.id}
                    onClick={() => setActiveTab('kitchen')}
                    className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${order.status === 'ready' ? 'bg-green-100 text-green-600' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                        #{order.orderNumber}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{order.customerName || t('admin.overview.walkIn')}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className={`flex items-center gap-1 font-bold ${order.status === 'ready' ? 'text-green-500' :
                              order.status === 'preparing' ? 'text-blue-500' : 'text-orange-500'
                            }`}>
                            <Circle size={8} fill="currentColor" /> {order.status.toUpperCase()}
                          </span>
                          <span>•</span>
                          <span>{order.items?.length || 0} {t('admin.overview.items')}</span>
                          {(() => {
                            const expected = order.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                            const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                            if (elapsed > expected && order.status !== 'ready') {
                              return (
                                <>
                                  <span>•</span>
                                  <span className="text-red-500 font-bold animate-pulse">
                                    {t('reports.delayed')} (+{Math.round(elapsed - expected)}m)
                                  </span>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">${order.total}</p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {order.status === 'preparing' && orderTimers[order.id] && (
                        <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                          {formatTime(orderTimers[order.id].remainingTime)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Online Staff List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Users size={18} className="text-purple-500" /> {t('admin.overview.onlineStaff')}
            </h3>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {users.map(u => {
              const isOnline = u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 300000;
              return (
                <div
                  key={u.id}
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{u.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isOnline ? (
                      <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full uppercase">{t('admin.overview.online')}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">
                        {u.lastActive ? new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('admin.overview.offline')}
                      </span>
                    )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OverviewTab);
