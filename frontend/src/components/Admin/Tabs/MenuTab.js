import React from 'react';
import { Plus, Edit2, Trash2, Scale, Beef } from 'lucide-react';

const MenuTab = ({ 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  menuItems, 
  availableOptions, 
  handleAddItem, 
  handleEditItem, 
  handleDeleteItem, 
  toggleItemAvailability, 
  setEditingCategory, 
  setShowCategoryModal, 
  setEditingOption, 
  setShowOptionModal, 
  deleteCategory, 
  deleteOption, 
  addCategory, 
  toast, 
  t 
}) => {
  return (
    <>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('admin.tabs.menu')}</h2>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <button 
              onClick={async () => {
                const defaults = [
                  { id: 'shawarma', name: 'Shawarma', color: 'bg-red-500', order: 1 },
                  { id: 'plates', name: 'Plates', color: 'bg-green-500', order: 2 },
                  { id: 'sandwiches', name: 'Sandwiches', color: 'bg-orange-500', order: 3 },
                  { id: 'sides', name: 'Sides', color: 'bg-purple-500', order: 4 },
                  { id: 'drinks', name: 'Drinks', color: 'bg-blue-500', order: 5 },
                  { id: 'grilled_chicken', name: 'Grilled Chicken', color: 'bg-yellow-600', order: 6 }
                ];
                for (const cat of defaults) {
                  await addCategory(cat);
                }
                toast.success(t('admin.common.success'));
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg"
            >
              {t('admin.common.initialize', { defaultValue: 'Initialize Categories' })}
            </button>
          )}
          <button 
            onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} /> {t('admin.sidebar.menu')}
          </button>
          <button onClick={handleAddItem} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> {t('admin.inventory.addPurchase')}
          </button>
        </div>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map((cat) => {
          return (
            <div key={cat.id} className="flex items-center gap-1">
              <button 
                onClick={() => setSelectedCategory(cat.id)} 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${selectedCategory === cat.id ? (cat.color || 'bg-gray-500') + ' text-white shadow-md' : 'bg-white border text-gray-600 hover:border-orange-200'}`}
              >
                {t(`cashier.categories.${cat.id}`, { defaultValue: cat.name })}
              </button>
              <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="text-gray-400 hover:text-blue-500 p-1"><Edit2 size={14}/></button>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-10">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.history')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.itemName')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.price')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.unit')}</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reports.status')}</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.users.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(menuItems[selectedCategory] || []).map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  {/* Phase 1: Storage URLs only — no Base64 */}
                  {(item.imageUrl?.startsWith('https://') || item.image?.startsWith('https://')) ? (
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg shadow-sm"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-2xl w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg">
                      {item.image?.startsWith('http') || item.image?.startsWith('data:') ? '🍽️' : (item.image || '🍽️')}
                    </span>
                  )}

                </td>
                <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">₪{item.price} <span className="text-[10px] text-gray-400 font-normal">(EGY)</span></span>
                        {item.foreignerPrice && <span className="text-[10px] font-bold text-orange-600">₪{item.foreignerPrice} <span className="font-normal text-gray-400">(FOR)</span></span>}
                    </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.weight}</td>
                <td className="px-6 py-4">
                    <button 
                        onClick={() => toggleItemAvailability(item)} 
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                    >
                        {item.available ? t('kitchen.ready') : t('reports.statusPending')}
                    </button>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditItem(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => handleDeleteItem(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(menuItems[selectedCategory] || []).length === 0 && (
            <div className="p-12 text-center text-gray-400 italic">
                {t('cashier.noItems')}
            </div>
        )}
      </div>

      {/* Options Management Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">🛠️ {t('options.title')}</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">{t('options.subtitle', { defaultValue: 'Customizations & Modifiers' })}</p>
          </div>
          <button
            onClick={() => { setEditingOption(null); setShowOptionModal(true); }}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black flex items-center gap-2 font-bold text-sm shadow-lg shadow-gray-200 transition-all active:scale-95"
          >
            <Plus size={16} /> {t('options.addOption')}
          </button>
        </div>
        
        {availableOptions.length === 0 ? (
          <div className="p-12 text-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">
            {t('options.noOptions')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableOptions.map(opt => (
              <div key={opt.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between group hover:bg-white hover:border-orange-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                    {opt.icon || '🛠️'}
                  </div>
                  <p className="font-bold text-gray-800 text-sm">{opt.name}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => { setEditingOption(opt); setShowOptionModal(true); }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm(`${t('admin.common.delete')} ${opt.name}?`)) return;
                      try { await deleteOption(opt.id); toast.success(t('options.deleted')); }
                      catch { toast.error(t('admin.common.failed')); }
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(MenuTab);
