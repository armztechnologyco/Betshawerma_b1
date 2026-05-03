import React from 'react';
import { Plus, Package, AlertCircle, Filter, Download, Search, Edit2, Trash2, X, Activity } from 'lucide-react';

const InventoryTab = ({ 
  inventoryData, 
  setSelectedInventoryItem, 
  setShowAddPurchase, 
  purchases, 
  showPurchaseFilter, 
  setShowPurchaseFilter, 
  purchaseSearch, 
  setPurchaseSearch, 
  handleEditPurchase, 
  handleDeletePurchase,
  selectedInventoryItem,
  handleExportCSV,
  t 
}) => {
  const [supplierFilter, setSupplierFilter] = React.useState('all');
  const suppliers = [...new Set(purchases.map(p => p.supplier).filter(Boolean))];
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">{t('admin.inventory.title')}</h2>
          <p className="text-gray-500 mt-1">{t('admin.inventory.stockMonitoring')}</p>
        </div>
        <button
          onClick={() => setShowAddPurchase(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all transform hover:scale-105 shadow-md shadow-orange-200"
        >
          <Plus size={20} /> {t('admin.inventory.addPurchase')}
        </button>
      </div>

      {/* Inventory Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(inventoryData.details).map(([item, data]) => {
          const stockPercentage = (data.remaining / data.purchased) * 100;
          const isLow = stockPercentage < 20;

          return (
            <div 
              key={item} 
              onClick={() => setSelectedInventoryItem(item)}
              className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 transition-all hover:shadow-md cursor-pointer group ${isLow ? 'border-t-red-500' : 'border-t-green-500'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Package className={isLow ? 'text-red-500' : 'text-green-500'} size={24} />
                </div>
                {isLow && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse uppercase tracking-wider">
                    <AlertCircle size={10} /> {t('reports.delayed')}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-800 text-lg mb-1 truncate group-hover:text-orange-600 transition-colors">{item}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-black text-gray-900">{data.remaining.toFixed(1)}</span>
                <span className="text-gray-500 text-sm font-medium">{data.unit}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t('admin.inventory.remainingStock')}</span>
                  <span>{Math.round(stockPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, stockPercentage)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-[10px] text-gray-400 font-medium">
                <span>{t('admin.inventory.totalPurchased').toUpperCase()}: {data.purchased.toFixed(1)} {data.unit}</span>
                <span>{t('admin.inventory.totalConsumed').toUpperCase()}: {data.consumed.toFixed(1)} {data.unit}</span>
              </div>
            </div>
          );
        })}

        {Object.keys(inventoryData.details).length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Package className="text-gray-300" size={32} />
            </div>
            <h3 className="text-gray-900 font-bold text-lg">{t('admin.inventory.noInventoryData')}</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">{t('admin.inventory.startAddingPurchases')}</p>
            <button
              onClick={() => setShowAddPurchase(true)}
              className="mt-6 text-orange-600 font-bold hover:underline"
            >
              {t('admin.inventory.addFirstPurchase')}
            </button>
          </div>
        )}
      </div>

      {/* Purchase History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{t('admin.inventory.history')}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPurchaseFilter(!showPurchaseFilter)}
              className={`p-2 transition-colors ${showPurchaseFilter ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Filter size={20} />
            </button>
            <button 
              onClick={() => {
                const filteredPurchases = purchases.filter(p => 
                  p.itemName.toLowerCase().includes(purchaseSearch.toLowerCase()) &&
                  (supplierFilter === 'all' || p.supplier === supplierFilter)
                );
                const headers = [
                  t('admin.inventory.date'),
                  t('admin.inventory.itemName'),
                  t('admin.inventory.supplier'),
                  t('admin.inventory.quantity'),
                  t('admin.inventory.price'),
                  t('admin.inventory.total')
                ];
                const rows = filteredPurchases.map(p => [
                  new Date(p.date).toLocaleDateString(),
                  p.itemName,
                  p.supplier || '—',
                  `${p.quantity} ${p.unit}`,
                  `$${p.price}`,
                  `$${p.totalCost}`
                ]);
                handleExportCSV(headers, rows, 'Purchase_Report');
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm font-bold"
              title="Download Filtered Report"
            >
              <Download size={20} /> {t('admin.sidebar.reports')}
            </button>
          </div>
        </div>

        {showPurchaseFilter && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={t('cashier.specialInstructionsPlaceholder')} // Or a search-specific key
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                />
              </div>
              <select 
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="all">{t('admin.inventory.allSuppliers')}</option>
                {suppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.date')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.itemName')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.supplier')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.quantity')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.price')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.total')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {purchases
                .filter(p => 
                  p.itemName.toLowerCase().includes(purchaseSearch.toLowerCase()) &&
                  (supplierFilter === 'all' || p.supplier === supplierFilter)
                )
                .map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{p.itemName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.supplier || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                      {p.quantity} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${Number(p.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-600 font-black text-sm">${Number(p.totalCost || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditPurchase(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeletePurchase(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {purchases.length === 0 && (
          <div className="text-center py-12 text-gray-400 italic">
            {t('admin.inventory.noPurchases')}
          </div>
        )}
      </div>

      {/* Inventory Detail Modal */}
      {selectedInventoryItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col scale-in-center">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{selectedInventoryItem}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">{t('admin.inventory_drilldown.subtitle')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInventoryItem(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {inventoryData.details[selectedInventoryItem]?.history?.length === 0 ? (
                <div className="text-center py-20">
                  <Activity className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-gray-400 italic">{t('admin.inventory_drilldown.no_records')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-xs font-bold text-green-600 uppercase mb-1">{t('admin.inventory_drilldown.total_purchased')}</p>
                      <p className="text-2xl font-black text-green-700">{inventoryData.details[selectedInventoryItem].purchased.toFixed(2)} {inventoryData.details[selectedInventoryItem].unit}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">{t('admin.inventory_drilldown.total_consumed')}</p>
                      <p className="text-2xl font-black text-red-700">{inventoryData.details[selectedInventoryItem].consumed.toFixed(2)} {inventoryData.details[selectedInventoryItem].unit}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <p className="text-xs font-bold text-orange-600 uppercase mb-1">{t('admin.inventory_drilldown.remaining_stock')}</p>
                      <p className="text-2xl font-black text-orange-700">{inventoryData.details[selectedInventoryItem].remaining.toFixed(2)} {inventoryData.details[selectedInventoryItem].unit}</p>
                    </div>
                  </div>

                  <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-4">{t('admin.inventory_drilldown.log')}</h4>
                  <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100/50 text-gray-500 font-bold border-b border-gray-200">
                          <th className="px-4 py-3 text-left">{t('admin.inventory_drilldown.order')}</th>
                          <th className="px-4 py-3 text-left">{t('admin.inventory_drilldown.menuItem')}</th>
                          <th className="px-4 py-3 text-right">{t('admin.inventory_drilldown.qty')}</th>
                          <th className="px-4 py-3 text-right">{t('admin.inventory_drilldown.consumed')}</th>
                          <th className="px-4 py-3 text-right">{t('admin.inventory_drilldown.date')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {inventoryData.details[selectedInventoryItem].history
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-900">#{log.orderNumber}</td>
                              <td className="px-4 py-3 text-gray-600">{log.menuItemName}</td>
                              <td className="px-4 py-3 text-right font-medium">{log.itemQuantity}x</td>
                              <td className="px-4 py-3 text-right font-black text-red-600">-{log.consumedAmount.toFixed(3)} {inventoryData.details[selectedInventoryItem].unit}</td>
                              <td className="px-4 py-3 text-right text-gray-400 text-xs">
                                {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedInventoryItem(null)}
                className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg"
              >
                {t('admin.inventory_drilldown.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(InventoryTab);
