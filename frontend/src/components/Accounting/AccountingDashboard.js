import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, TrendingDown, Plus, Users, X } from 'lucide-react';
import { getTransactions, getFinancialSummary, addTransaction, recordSalary, getAllOrders } from '../../services/firebaseService';

function AccountingDashboard() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, profit: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: ''
  });
  const [salaryData, setSalaryData] = useState({
    employeeName: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getFinancialSummary(selectedMonth, selectedYear);
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Failed to fetch summary');
    }
  }, [selectedMonth, selectedYear, t]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchTransactions();
    await fetchSummary();
    setLoading(false);
  }, [fetchTransactions, fetchSummary]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.amount || !newTransaction.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await addTransaction({
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category: newTransaction.category || 'other'
      });
      toast.success('Transaction added successfully');
      setShowAddTransaction(false);
      setNewTransaction({ type: 'expense', amount: '', description: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleAddSalary = async (e) => {
    e.preventDefault();
    if (!salaryData.employeeName || !salaryData.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await recordSalary(
        salaryData.employeeName,
        parseFloat(salaryData.amount),
        salaryData.month,
        salaryData.year
      );
      toast.success('Salary recorded successfully');
      setShowAddSalary(false);
      setSalaryData({ employeeName: '', amount: '', month: selectedMonth, year: selectedYear });
      loadData();
    } catch (error) {
      console.error('Error recording salary:', error);
      toast.error('Failed to record salary');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2023, 2024, 2025, 2026];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-xl">{t('admin.common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📊 {t('admin.tabs.accounting')}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('admin.accounting.income')}</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('admin.accounting.expenses')}</h3>
            <TrendingDown className="text-red-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-600">${summary.totalExpense.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('admin.accounting.profit')}</h3>
            <DollarSign className="text-blue-500" size={24} />
          </div>
          <p className={`text-3xl font-bold ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${summary.profit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.salaries.month')}</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.salaries.year')}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="inline mr-2" size={16} />
              {t('admin.accounting.addTransaction')}
            </button>
            <button
              onClick={() => setShowAddSalary(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Users className="inline mr-2" size={16} />
              {t('admin.salaries.addSalary')}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold">{t('admin.inventory.history')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.inventory.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.accounting.description')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.accounting.category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.accounting.type')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.salaries.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {t('admin.inventory.noRecords')}
                  </td>
                </tr>
              ) : (
                transactions.map(transaction => (
                  <tr 
                    key={transaction.id} 
                    className={`hover:bg-gray-50 ${transaction.description?.startsWith('Order #') ? 'cursor-pointer' : ''}`}
                    onClick={async () => {
                      if (transaction.description?.startsWith('Order #')) {
                        const orderNum = transaction.description.split('#')[1]?.trim();
                        if (orderNum) {
                          try {
                            const allOrders = await getAllOrders();
                            const order = allOrders.find(o => o.orderNumber === orderNum);
                            if (order) {
                              setSelectedReportOrder(order);
                            } else {
                              toast.error('Order details not found');
                            }
                          } catch (err) {
                            toast.error('Failed to load order');
                          }
                        }
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add Transaction */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{t('admin.accounting.addTransaction')}</h2>
            <form onSubmit={handleAddTransaction}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('admin.accounting.type')}</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="expense">{t('admin.accounting.expenses')}</option>
                  <option value="income">{t('admin.accounting.income')}</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('admin.salaries.amount')} ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('admin.accounting.description')}</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('admin.accounting.category')}</label>
                <input
                  type="text"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., supplies, maintenance, etc."
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('admin.accounting.addTransaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add Salary */}
      {showAddSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{t('admin.salaries.addSalary')}</h2>
            <form onSubmit={handleAddSalary}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('admin.salaries.employeeName')}</label>
                <input
                  type="text"
                  value={salaryData.employeeName}
                  onChange={(e) => setSalaryData({ ...salaryData, employeeName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('admin.salaries.amount')} ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={salaryData.amount}
                  onChange={(e) => setSalaryData({ ...salaryData, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddSalary(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  {t('admin.salaries.addSalary')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedReportOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto m-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Order #{selectedReportOrder.orderNumber}</h2>
              <button onClick={() => setSelectedReportOrder(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-gray-500 font-medium">{t('admin.inventory.date')}</p>
                <p className="font-semibold text-gray-800">{new Date(selectedReportOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">{t('kitchen.customer')}</p>
                <p className="font-semibold text-gray-800">{selectedReportOrder.customerName || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">{t('admin.reports.status')}</p>
                <p className="font-medium mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${selectedReportOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedReportOrder.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">{t('admin.reports.payment')}</p>
                <p className="font-medium text-gray-800 mt-1 capitalize">{selectedReportOrder.paymentMethod || 'cash'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>{t('admin.reports.items')}</span>
                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">{selectedReportOrder.items?.length || 0}</span>
              </h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {selectedReportOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity}x @ ${item.price}</p>
                      {item.notes && <p className="text-xs text-orange-500 mt-1 italic">Note: {item.notes}</p>}
                    </div>
                    <p className="font-bold text-gray-800">${item.total}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-black text-gray-800 bg-gray-50 p-4 rounded-lg">
                <span>{t('admin.reports.total')}</span>
                <span>${selectedReportOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountingDashboard;