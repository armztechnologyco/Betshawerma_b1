import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  Clock, CheckCircle, CookingPot, Timer, AlertCircle, 
  ChevronRight, Circle, ChefHat, LogOut, Package 
} from 'lucide-react';
import { subscribeToKitchenOrders, updateOrderStatus } from '../../services/firebaseService';
import { logoutUser } from '../../services/authService';

function KitchenDisplay() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderTimers, setOrderTimers] = useState({});
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // 1. Real-time Subscription
  useEffect(() => {
    const unsubscribe = subscribeToKitchenOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Timer Initialization & Auto-Start
  useEffect(() => {
    const timers = {};
    orders.forEach(order => {
      // Auto-move pending to preparing
      if (order.status === 'pending') {
        updateOrderStatus(order.id, 'preparing');
        return;
      }

      // Initialize timers for preparing orders
      if (order.status === 'preparing' && !orderTimers[order.id]) {
        const totalTime = order.items?.reduce((total, item) => {
          return total + ((item.preparationTime || 5) * item.quantity);
        }, 0) || 5;

        const orderStart = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
        const elapsedSeconds = Math.floor((Date.now() - orderStart) / 1000);
        const totalSeconds = totalTime * 60;

        timers[order.id] = {
          totalTime: totalTime,
          remainingTime: Math.max(0, totalSeconds - elapsedSeconds),
          startTime: orderStart
        };
      }
    });

    if (Object.keys(timers).length > 0) {
      setOrderTimers(prev => ({ ...prev, ...timers }));
    }
  }, [orders]);

  // 3. Countdown Updates (Every Second)
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderTimers(prev => {
        const updated = { ...prev };
        let changed = false;

        Object.keys(updated).forEach(orderId => {
          if (updated[orderId].remainingTime > 0) {
            const elapsed = Math.floor((Date.now() - updated[orderId].startTime) / 1000);
            const remaining = Math.max(0, updated[orderId].totalTime * 60 - elapsed);
            updated[orderId].remainingTime = remaining;
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
      // Also trigger re-render for delayed checks every second
      setLastRefresh(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(t('kitchen.statusUpdated', { status: newStatus }));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (remaining, total) => {
    if (!total || total === 0) return 0;
    return ((total * 60 - remaining) / (total * 60)) * 100;
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
        <div className="text-xl font-bold text-gray-600">{t('kitchen.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Premium Navbar */}
      <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-xl p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <ChefHat className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-white text-2xl font-black tracking-tight">{t('kitchen.title')}</h1>
              <div className="flex items-center gap-1.5 text-orange-100 text-[10px] font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                Live Operational View
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all font-bold text-sm backdrop-blur-sm"
          >
            <LogOut size={18} /> {t('admin.logout')}
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-lg border border-dashed border-gray-200">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <Package className="text-gray-300" size={64} />
            </div>
            <h3 className="text-2xl font-bold text-gray-400 italic">{t('kitchen.noOrders')}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {orders
              .filter(o => ['preparing', 'pending', 'ready'].includes(o.status))
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map(order => {
                const timer = orderTimers[order.id];
                const expected = order.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                const isDelayed = elapsed > expected && order.status !== 'ready';
                
                return (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col border-2 transition-all duration-300 ${
                      order.status === 'ready' ? 'border-green-500 ring-4 ring-green-50' : 
                      isDelayed ? 'border-red-500 ring-4 ring-red-50' : 'border-transparent'
                    }`}
                  >
                    {/* Header */}
                    <div className={`p-6 flex justify-between items-start ${
                      order.status === 'ready' ? 'bg-green-50' : 
                      isDelayed ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-gray-400 uppercase tracking-tighter">Order ID</span>
                          <span className={`text-2xl font-black ${
                            order.status === 'ready' ? 'text-green-600' : 
                            isDelayed ? 'text-red-600' : 'text-gray-900'
                          }`}>#{order.orderNumber}</span>
                        </div>
                        <p className="text-gray-600 font-bold flex items-center gap-1.5">
                          <Circle size={10} className={isDelayed ? 'text-red-500' : 'text-orange-500'} fill="currentColor" />
                          {order.customerName || 'Walk-in'}
                        </p>
                      </div>
                      
                      {isDelayed && (
                        <div className="bg-red-600 text-white px-4 py-2 rounded-2xl animate-pulse flex items-center gap-2 shadow-lg shadow-red-200">
                          <AlertCircle size={18} />
                          <span className="font-black text-xs uppercase tracking-widest">{t('reports.delayed')}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar (Only for Preparing) */}
                    {order.status === 'preparing' && timer && (
                      <div className="h-2 bg-gray-100 w-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${isDelayed ? 'bg-red-500' : 'bg-orange-500'}`}
                          style={{ width: `${getProgressPercentage(timer.remainingTime, timer.totalTime)}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                          <Clock size={16} />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {order.status === 'preparing' && timer && (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-lg ${
                            isDelayed ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            <Timer size={20} />
                            {formatTime(timer.remainingTime)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Order Items</h4>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-lg">
                                {item.quantity}
                              </span>
                              <div>
                                <p className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</p>
                                {item.includes && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{item.includes}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pt-0">
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-gray-200"
                        >
                          <CheckCircle size={28} />
                          {t('kitchen.markReady')}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-green-200"
                        >
                          <ChevronRight size={28} />
                          {t('kitchen.completeOrder')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

export default KitchenDisplay;