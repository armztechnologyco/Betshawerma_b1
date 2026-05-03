import React from 'react';
import { Plus, Download } from 'lucide-react';

const SalariesTab = ({ 
  salaries, 
  salaryFilter, 
  setSalaryFilter, 
  months, 
  years, 
  clearSalaryFilters, 
  setShowAddSalary, 
  handleExportCSV,
  users,
  t 
}) => {
  const filteredSalaries = salaries.filter(s => {
    if (salaryFilter.employeeName && salaryFilter.employeeName !== 'all' && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
    if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
    if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
    return true;
  });

  const totalPaid = filteredSalaries.reduce((sum, s) => sum + s.amount, 0);
  const uniqueEmployees = new Set(filteredSalaries.map(s => s.employeeName)).size;
  const averageSalary = filteredSalaries.length ? Math.round(totalPaid / filteredSalaries.length) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.salaries.title')}</h2>
          <p className="text-sm text-gray-500">Record and track staff payroll</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const headers = [
                t('admin.salaries.employeeName'),
                t('admin.inventory.price'),
                t('admin.salaries.month'),
                t('admin.salaries.year'),
                t('admin.inventory.date')
              ];
              const rows = filteredSalaries.map(s => [
                s.employeeName,
                `₪${s.amount}`,
                months[s.month - 1],
                s.year,
                new Date(s.date).toLocaleDateString()
              ]);
              handleExportCSV(headers, rows, 'Salaries_Report');
            }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Download size={18} /> {t('admin.sidebar.reports')}
          </button>
          <button 
            onClick={() => setShowAddSalary(true)} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-green-100 transition-all active:scale-95"
          >
            <Plus size={18} /> Add Salary
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('admin.salaries.employeeName')}</label>
            <select 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-gray-50/50" 
              value={salaryFilter.employeeName} 
              onChange={(e) => setSalaryFilter({ ...salaryFilter, employeeName: e.target.value })} 
            >
              <option value="all">All Employees</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('admin.salaries.month')}</label>
            <select 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-gray-50/50" 
              value={salaryFilter.month} 
              onChange={(e) => setSalaryFilter({ ...salaryFilter, month: e.target.value })}
            >
              <option value="all">All Months</option>
              {months.map((month, i) => (<option key={i} value={i + 1}>{month}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('admin.salaries.year')}</label>
            <select 
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-gray-50/50" 
              value={salaryFilter.year} 
              onChange={(e) => setSalaryFilter({ ...salaryFilter, year: e.target.value })}
            >
              <option value="all">All Years</option>
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={clearSalaryFilters} 
              className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors font-bold text-sm"
            >
              {t('admin.salaries.clearFilters')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Salaries Paid</p>
          <p className="text-2xl font-black text-blue-900">₪{totalPaid}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Total Employees Paid</p>
          <p className="text-2xl font-black text-green-900">{uniqueEmployees}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Average Salary</p>
          <p className="text-2xl font-black text-purple-900">₪{averageSalary}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Date Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSalaries.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{s.employeeName}</td>
                <td className="px-6 py-4 font-black text-green-600">₪{s.amount}</td>
                <td className="px-6 py-4 text-gray-600">{months[s.month - 1]}</td>
                <td className="px-6 py-4 text-gray-600">{s.year}</td>
                <td className="px-6 py-4 text-right text-gray-400">{new Date(s.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSalaries.length === 0 && (
          <div className="text-center py-12 text-gray-400 italic">
            No salary records found for the current filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(SalariesTab);
