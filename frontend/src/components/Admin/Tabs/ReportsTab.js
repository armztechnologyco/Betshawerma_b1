import React, { useState, useMemo } from 'react';
import { Filter, Download, User, List } from 'lucide-react';

const ReportsTab = ({ 
  reportFilter, 
  setReportFilter, 
  generateReport, 
  showReport, 
  reportData, 
  handleExportCSV, 
  setSelectedReportOrder, 
  users,
  t 
}) => {
  const [activeSubTab, setActiveSubTab] = useState('orders');
  const cashiers = users.filter(u => u.role === 'cashier' || u.role === 'admin');

  // Aggregate data by cashier
  const cashierStats = useMemo(() => {
    const stats = {};
    reportData.forEach(order => {
      const name = order.cashierName || t('admin.common.system');
      if (!stats[name]) {
        stats[name] = {
          name,
          count: 0,
          total: 0,
          orders: []
        };
      }
      stats[name].count += 1;
      stats[name].total += Number(order.total || 0);
      stats[name].orders.push(order);
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [reportData, t]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.tabs.reports')}</h2>
        
        {/* Sub-tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'orders' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={16} />
            {t('admin.overview.orders', { defaultValue: 'Orders' })}
          </button>
          <button
            onClick={() => setActiveSubTab('cashiers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'cashiers' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={16} />
            {t('admin.tabs.cashier', { defaultValue: 'Cashier Report' })}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.reports.fromDate')}</label>
            <input 
              type="date" 
              value={reportFilter.fromDate} 
              onChange={(e) => setReportFilter({ ...reportFilter, fromDate: e.target.value })} 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.reports.toDate')}</label>
            <input 
              type="date" 
              value={reportFilter.toDate} 
              onChange={(e) => setReportFilter({ ...reportFilter, toDate: e.target.value })} 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.reports.status')}</label>
            <select 
              value={reportFilter.status} 
              onChange={(e) => setReportFilter({ ...reportFilter, status: e.target.value })} 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">{t('admin.reports.all')}</option>
              <option value="pending">{t('reports.statusPending')}</option>
              <option value="preparing">{t('reports.statusPreparing')}</option>
              <option value="ready">{t('reports.statusReady')}</option>
              <option value="completed">{t('reports.statusCompleted')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('cashier.receipt.cashier')}</label>
            <select 
              value={reportFilter.cashierName} 
              onChange={(e) => setReportFilter({ ...reportFilter, cashierName: e.target.value })} 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">{t('admin.reports.all')}</option>
              {cashiers.map(cashier => (
                <option key={cashier.id} value={cashier.name}>{cashier.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={generateReport} 
              className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <Filter size={18} /> {t('admin.reports.generate')}
            </button>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-xl font-black text-gray-900">
              {activeSubTab === 'orders' ? t('admin.overview.orders') : t('admin.tabs.cashier')}
            </h3>
            <button 
              onClick={() => {
                if (activeSubTab === 'orders') {
                  const headers = [
                    t('cashier.receipt.orderNumber'),
                    t('admin.inventory.date'),
                    t('admin.users.fullName'),
                    t('admin.tabs.menu'),
                    'Cashier',
                    t('admin.inventory.total'),
                    t('admin.reports.status')
                  ];
                  const rows = reportData.map(order => [
                    `#${order.orderNumber}`,
                    new Date(order.createdAt).toLocaleDateString(),
                    order.customerName,
                    `${order.items?.length || 0} ${t('admin.overview.items')}`,
                    order.cashierName || t('admin.common.system'),
                    `$${Number(order.total || 0).toFixed(2)}`,
                    t(`reports.status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`) || order.status
                  ]);
                  handleExportCSV(headers, rows, 'Order_Report');
                } else {
                  const headers = ['Cashier Name', 'Total Orders', 'Total Revenue'];
                  const rows = cashierStats.map(stat => [
                    stat.name,
                    stat.count,
                    `$${stat.total.toFixed(2)}`
                  ]);
                  handleExportCSV(headers, rows, 'Cashier_Report');
                }
              }}
              className="text-blue-600 flex items-center gap-1.5 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all font-bold text-sm"
            >
              <Download size={18} /> {t('admin.reports.download')}
            </button>
          </div>

          {activeSubTab === 'orders' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('cashier.receipt.orderNumber')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.date')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.fullName')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.tabs.menu')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('cashier.receipt.cashier')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.total')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.reports.status')}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.timing')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportData.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors group" onClick={() => setSelectedReportOrder(order)}>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 group-hover:text-blue-600 transition-colors">#{order.orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{order.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items?.length || 0} {t('admin.overview.items')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.cashierName || t('admin.common.system')}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-gray-900">${Number(order.total || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'completed' ? 'bg-green-50 text-green-600' : 
                          order.status === 'ready' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {(() => {
                          const expected = order.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                          const actual = order.completedAt
                            ? (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60)
                            : (new Date() - new Date(order.createdAt)) / (1000 * 60);

                          const isDelayed = actual > expected;

                          if (order.status === 'completed') {
                            return (
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isDelayed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {isDelayed ? `${t('reports.delayed')} (${Math.round(actual - expected)}m)` : t('reports.onTime')}
                              </span>
                            );
                          } else {
                            return isDelayed ? <span className="text-red-500 font-bold animate-pulse text-[10px] uppercase">{t('reports.delayed')}</span> : <span className="text-gray-400 text-[10px] uppercase font-bold">{t('reports.inProgress')}</span>;
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length === 0 && (
                  <div className="p-12 text-center text-gray-400 italic">
                      No orders found for the selected criteria.
                  </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {cashierStats.map(stat => (
                <div key={stat.name} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900">{stat.name}</h4>
                        <p className="text-xs text-gray-500">{stat.count} {t('admin.overview.orders')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('admin.inventory.total')}</p>
                      <p className="text-lg font-black text-blue-600">${stat.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('cashier.receipt.orderNumber')}</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.inventory.date')}</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.users.fullName')}</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.inventory.total')}</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.reports.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stat.orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/30 cursor-pointer" onClick={() => setSelectedReportOrder(order)}>
                            <td className="px-6 py-3 font-bold text-gray-900">#{order.orderNumber}</td>
                            <td className="px-6 py-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-3 text-gray-700">{order.customerName}</td>
                            <td className="px-6 py-3 font-black text-gray-900">${Number(order.total || 0).toFixed(2)}</td>
                            <td className="px-6 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {cashierStats.length === 0 && (
                <div className="p-12 text-center text-gray-400 italic">
                  No data available for the selected criteria.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ReportsTab);
