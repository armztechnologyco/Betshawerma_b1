import React from 'react';

const AccountingTab = ({ 
  summary, 
  selectedMonth, 
  setSelectedMonth, 
  selectedYear, 
  setSelectedYear, 
  months, 
  years, 
  transactions, 
  setShowAddTransaction, 
  t 
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-b-4 border-green-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.accounting.income')}</h3>
            <p className="text-3xl font-black text-green-600">₪{summary.totalIncome}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border-b-4 border-red-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.accounting.expenses')}</h3>
            <p className="text-3xl font-black text-red-600">₪{summary.totalExpense}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border-b-4 border-blue-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.accounting.profit')}</h3>
            <p className="text-3xl font-black text-blue-600">₪{summary.profit}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500 uppercase">{t('admin.salaries.month')}:</span>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))} 
                className="border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50"
            >
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500 uppercase">{t('admin.salaries.year')}:</span>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
                className="border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50"
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
        <button 
            onClick={() => setShowAddTransaction(true)} 
            className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
            {t('admin.accounting.addTransaction')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.date')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.accounting.description')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.accounting.category')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.accounting.type')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.inventory.total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map(t_item => (
              <tr key={t_item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(t_item.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{t_item.description}</td>
                <td className="px-6 py-4 text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold uppercase">{t_item.category}</span></td>
                <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t_item.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                        {t_item.type}
                    </span>
                </td>
                <td className={`px-6 py-4 text-right font-black ${t_item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    ₪{t_item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
            <div className="p-12 text-center text-gray-400 italic">
                No transactions recorded for this period.
            </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AccountingTab);
