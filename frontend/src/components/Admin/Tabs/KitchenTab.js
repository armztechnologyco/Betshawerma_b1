import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ChefHat } from 'lucide-react';

const KitchenTab = ({ 
  kitchenOrders, 
  orderTimers, 
  startPreparation, 
  updateOrderStatus, 
  formatTime, 
  getProgressPercentage, 
  t 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {kitchenOrders.map(order => {
        const timer = orderTimers[order.id];
        const totalPrepTime = order.items?.reduce((total, item) => {
          return total + ((item.preparationTime || 5) * item.quantity);
        }, 0) || 5;

        return (
          <div key={order.id} className={`bg-white rounded-2xl shadow-sm p-6 border-l-8 transition-all hover:shadow-md ${
            order.status === 'pending' ? 'border-yellow-400' :
            order.status === 'preparing' ? 'border-blue-500' :
            order.status === 'ready' ? 'border-green-500' : 'border-gray-300'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">#{order.orderNumber}</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{order.customerName || 'Walk-in'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                  order.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                  order.status === 'ready' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {order.status}
                </span>
                {(() => {
                  const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                  if (elapsed > totalPrepTime && order.status !== 'ready' && order.status !== 'completed') {
                    return (
                      <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse flex items-center gap-1 border border-red-100">
                        <AlertCircle size={10} /> {t('reports.delayed')} (+{Math.round(elapsed - totalPrepTime)}m)
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-xl p-3 mb-4 flex items-center gap-4 text-xs font-bold text-gray-500">
                <div className="flex items-center gap-1"><Clock size={14}/> {totalPrepTime}m</div>
                <div className="flex items-center gap-1"><ChefHat size={14}/> {order.items?.length || 0} items</div>
            </div>

            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start group">
                  <div className="flex gap-3">
                    <span className="bg-white border border-gray-100 shadow-sm w-6 h-6 flex items-center justify-center rounded text-[10px] font-black text-gray-900">{item.quantity}x</span>
                    <div>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{item.name}</p>
                        {item.preparationTime && (
                          <p className="text-[10px] text-gray-400 font-medium italic">⏱️ {item.preparationTime}m/each</p>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preparation Progress */}
            {order.status === 'preparing' && timer && (
              <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Time Remaining</span>
                  <span className="text-xl font-black text-blue-900 font-mono">
                    {formatTime(timer.remainingTime)}
                  </span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2 shadow-inner">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/40"
                    style={{ width: `${getProgressPercentage(timer.remainingTime, timer.totalTime)}%` }}
                  ></div>
                </div>
                {timer.remainingTime === 0 && (
                  <div className="mt-3 text-green-600 text-[10px] font-black uppercase text-center flex items-center justify-center gap-1">
                    <CheckCircle2 size={12}/> ✓ {t('kitchen.ready')}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => startPreparation(order.id, order.items)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  {t('kitchen.startPrep')}
                </button>
              )}

              {order.status === 'preparing' && timer && timer.remainingTime === 0 && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 transition-all active:scale-95"
                >
                  {t('kitchen.markReady')}
                </button>
              )}

              {order.status === 'ready' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-100 transition-all active:scale-95"
                >
                  {t('kitchen.completeOrder')}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {kitchenOrders.length === 0 && (
        <div className="col-span-full py-20 bg-white rounded-3xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ChefHat size={40} className="text-gray-200" />
            </div>
            <p className="text-xl font-black text-gray-300 uppercase tracking-widest italic">{t('kitchen.noActive')}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(KitchenTab);
