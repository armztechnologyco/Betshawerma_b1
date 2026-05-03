import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ChefHat, Clock, CheckCircle, Package, User, Circle, AlertCircle, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../Common/LanguageSwitcher';
import ShiftTimer from '../Common/ShiftTimer';
import toast from 'react-hot-toast';

function KitchenDisplay() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderTimers, setOrderTimers] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      orders.forEach(order => {
        if (['pending', 'preparing'].includes(order.status)) {
          // Total expected time from order creation
          const expectedMinutes = order.items?.reduce((total, item) => 
            total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
          
          const createdAt = new Date(order.createdAt).getTime();
          const totalMs = expectedMinutes * 60 * 1000;
          const deadline = createdAt + totalMs;
          const remainingMs = deadline - Date.now();
          
          newTimers[order.id] = {
            remainingSeconds: Math.floor(remainingMs / 1000),
            totalSeconds: expectedMinutes * 60,
            isOverdue: remainingMs < 0
          };
        }
      });
      setOrderTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData = { status: newStatus };
      
      if (newStatus === 'preparing') {
        updateData.preparationStartedAt = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }
      
      updateDoc(orderRef, updateData).catch(error => {
        console.error('Error updating order status:', error);
        toast.error(t('kitchen.updateFailed'));
      });
      
      toast.success(t('kitchen.statusUpdated', { status: newStatus }));
    } catch (error) {
      console.error('Error in handleUpdateStatus:', error);
      toast.error(t('kitchen.updateFailed'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'border-yellow-400';
      case 'preparing': return 'border-blue-500';
      case 'ready': return 'border-green-500';
      default: return 'border-gray-200';
    }
  };

  const formatTime = (seconds) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    return seconds < 0 ? `+${formatted}` : formatted;
  };

  const getProgressPercentage = (remaining, total) => {
    if (!total || remaining < 0) return 100;
    return ((total - remaining) / total) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <ChefHat className="text-orange-500 animate-bounce mb-4" size={64} />
        <p className="text-xl font-bold text-gray-500 animate-pulse">{t('kitchen.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gray-900 shadow-2xl p-6 mb-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/20">
            <ChefHat className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t('kitchen.title')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <ShiftTimer />
          <LanguageSwitcher />
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <ChefHat className="text-white" />
            <span className="text-white font-bold">{t('kitchen.liveOperationalView')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {orders.filter(o => ['preparing', 'pending', 'ready'].includes(o.status)).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[3rem] shadow-sm border-4 border-dashed border-gray-100">
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
                const createdAt = new Date(order.createdAt).getTime();
                const elapsed = (Date.now() - createdAt) / (1000 * 60);

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col border-2 transition-all duration-300 ${order.status === 'ready' ? 'border-green-500 ring-4 ring-green-50' :
                      timer?.isOverdue ? 'border-red-500 ring-4 ring-red-50' : 'border-transparent'
                      }`}
                  >
                    {/* Header */}
                    <div className={`p-6 flex justify-between items-start ${order.status === 'ready' ? 'bg-green-50' :
                      timer?.isOverdue ? 'bg-red-50' : 'bg-gray-50'
                      }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-gray-400 uppercase tracking-tighter">{t('kitchen.orderId')}</span>
                          <span className={`text-2xl font-black ${order.status === 'ready' ? 'text-green-600' :
                            timer?.isOverdue ? 'text-red-600' : 'text-gray-900'
                            }`}>#{order.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-600 font-bold flex items-center gap-1.5">
                            <Circle size={10} className={timer?.isOverdue ? 'text-red-500' : 'text-orange-500'} fill="currentColor" />
                            {order.customerName || t('admin.overview.walkIn')}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            order.orderType === 'dinein' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.orderType === 'dinein' ? `🍽️ ${t('cashier.dineIn')}` : `🛍️ ${t('cashier.takeaway')}`}
                          </span>
                        </div>
                      </div>

                      {timer?.isOverdue && (
                        <div className="bg-red-600 text-white px-4 py-2 rounded-2xl animate-pulse flex items-center gap-2 shadow-lg shadow-red-200">
                          <AlertCircle size={18} />
                          <span className="font-black text-xs uppercase tracking-widest">{t('reports.delayed')}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {(order.status === 'preparing' || order.status === 'pending') && timer && (
                      <div className="h-2 bg-gray-100 w-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${timer.isOverdue ? 'bg-red-500 animate-pulse' : order.status === 'preparing' ? 'bg-orange-500' : 'bg-yellow-400'}`}
                          style={{ width: `${getProgressPercentage(timer.remainingSeconds, timer.totalSeconds)}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                            <Clock size={16} />
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {Math.floor(elapsed)} {t('reports.minutes')} {t('reports.ago', { defaultValue: 'ago' })}
                          </span>
                        </div>
                        {timer && (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-lg transition-all ${
                            timer.isOverdue 
                              ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-200' 
                              : order.status === 'preparing' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                            <Timer size={20} className={timer.isOverdue ? 'animate-spin-slow' : ''} />
                            {formatTime(timer.remainingSeconds)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{t('kitchen.orderItems')}</h4>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="group">
                            <div className="flex items-start gap-4">
                              <span className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0">
                                {item.quantity}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</p>
                                {item.includes && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{item.includes}</p>}

                                {item.options && item.options.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {item.options.map((opt, oIdx) => (
                                      <span
                                        key={oIdx}
                                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200"
                                      >
                                        ✓ {opt.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.notes && (
                                  <p className="mt-2 text-[12px] text-red-700 font-extrabold bg-yellow-100 px-3 py-1.5 rounded-xl border-l-4 border-red-500 shadow-sm animate-pulse">
                                    ⚠️ {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pt-0">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-blue-200"
                        >
                          <ChefHat size={28} />
                          {t('kitchen.startPrep')}
                        </button>
                      )}
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
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-green-200"
                        >
                          <CheckCircle size={28} />
                          {t('kitchen.completeOrder')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}

export default KitchenDisplay;