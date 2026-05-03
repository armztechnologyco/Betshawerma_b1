import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  deleteDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

// ==================== ORDERS ====================

// Create new order
export const createOrder = async (orderData) => {
  try {
    const ordersRef = collection(db, 'orders');
    const newOrder = {
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderNumber: Math.floor(Math.random() * 9000 + 1000).toString()
    };
    const docRef = await addDoc(ordersRef, newOrder);
    return { id: docRef.id, ...newOrder };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get kitchen orders (descending order)
export const getKitchenOrders = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('status', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    throw error;
  }
};

// Get all orders
export const getAllOrders = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }
    await updateDoc(orderRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// Get orders by date range
export const getOrdersByDate = async (startDate, endDate) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching orders by date:', error);
    throw error;
  }
};

// ==================== TRANSACTIONS ====================

// Add transaction (income/expense)
export const addTransaction = async (transactionData) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const newTransaction = {
      ...transactionData,
      createdAt: new Date().toISOString(),
      transactionId: Date.now().toString()
    };
    const docRef = await addDoc(transactionsRef, newTransaction);
    return { id: docRef.id, ...newTransaction };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Update transaction
export const updateTransaction = async (id, transactionData) => {
  try {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, {
      ...transactionData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Delete transaction
export const deleteTransaction = async (id) => {
  try {
    const docRef = doc(db, 'transactions', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Get all transactions
export const getTransactions = async () => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Get transactions by type
export const getTransactionsByType = async (type) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    throw error;
  }
};

// Get transactions by date range
export const getTransactionsByDate = async (startDate, endDate) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching transactions by date:', error);
    throw error;
  }
};

// Get financial summary for a month
export const getFinancialSummary = async (month, year) => {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const transactions = await getTransactionsByDate(startDate, endDate);
    
    let totalIncome = 0;
    let totalExpense = 0;
    let salaryExpense = 0;
    let otherExpense = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
        if (transaction.category === 'salary') {
          salaryExpense += transaction.amount;
        } else {
          otherExpense += transaction.amount;
        }
      }
    });
    
    return {
      totalIncome,
      totalExpense,
      salaryExpense,
      otherExpense,
      profit: totalIncome - totalExpense,
      month,
      year
    };
  } catch (error) {
    console.error('Error getting financial summary:', error);
    throw error;
  }
};

// ==================== EMPLOYEES ====================

// Add employee
export const addEmployee = async (employeeData) => {
  try {
    const employeesRef = collection(db, 'employees');
    const newEmployee = {
      ...employeeData,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(employeesRef, newEmployee);
    return { id: docRef.id, ...newEmployee };
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

// Get all employees
export const getEmployees = async () => {
  try {
    const employeesRef = collection(db, 'employees');
    const snapshot = await getDocs(employeesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Update employee
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, {
      ...employeeData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

// Record employee salary
export const recordSalary = async (employeeName, amount, month, year) => {
  try {
    return await addTransaction({
      type: 'expense',
      amount: amount,
      description: `Salary for ${employeeName}`,
      category: 'salary',
      employeeName: employeeName,
      month: month,
      year: year
    });
  } catch (error) {
    console.error('Error recording salary:', error);
    throw error;
  }
};

// ==================== DASHBOARD STATS ====================

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Today's orders
    const todayOrders = await getOrdersByDate(today, tomorrowStr);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Pending and preparing orders
    const allOrders = await getAllOrders();
    const pendingOrders = allOrders.filter(order => order.status === 'pending');
    const preparingOrders = allOrders.filter(order => order.status === 'preparing');
    
    // This month's profit
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const summary = await getFinancialSummary(currentMonth, currentYear);
    
    return {
      todayRevenue,
      pendingOrders: pendingOrders.length,
      preparingOrders: preparingOrders.length,
      totalOrdersToday: todayOrders.length,
      monthlyProfit: summary.profit,
      monthlyRevenue: summary.totalIncome,
      todayOrders: todayOrders
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

// Subscribe to kitchen orders (real-time updates)
export const subscribeToKitchenOrders = (callback) => {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef, 
    where('status', 'in', ['pending', 'preparing']),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    callback(orders);
  }, (error) => {
    console.error('Error fetching kitchen orders:', error);
    callback([]);
  });
};

// Subscribe to all orders (real-time updates)
export const subscribeToAllOrders = (callback) => {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    callback(orders);
  }, (error) => {
    console.error('Error fetching orders:', error);
    callback([]);
  });
};

// ==================== PURCHASES / INVENTORY ====================

// Add new purchase
export const addPurchase = async (purchaseData) => {
  try {
    const purchasesRef = collection(db, 'purchases');
    const newPurchase = {
      ...purchaseData,
      createdAt: new Date().toISOString(),
      date: purchaseData.date || new Date().toISOString()
    };
    const docRef = await addDoc(purchasesRef, newPurchase);
    
    // Also record as an expense in transactions
    await addTransaction({
      type: 'expense',
      amount: purchaseData.totalCost || (purchaseData.quantity * purchaseData.price),
      description: `Purchase: ${purchaseData.itemName}`,
      category: 'inventory',
      createdAt: new Date().toISOString()
    });
    
    return { id: docRef.id, ...newPurchase };
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

// Get all purchases
export const getPurchases = async () => {
  try {
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

// Subscribe to purchases
export const subscribeToPurchases = (callback) => {
  const purchasesRef = collection(db, 'purchases');
  const q = query(purchasesRef, orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const purchases = [];
    snapshot.forEach(doc => {
      purchases.push({ id: doc.id, ...doc.data() });
    });
    callback(purchases);
  }, (error) => {
    console.error('Error fetching purchases:', error);
    callback([]);
  });
};

// Delete purchase
export const deletePurchase = async (purchaseId) => {
  try {
    await deleteDoc(doc(db, 'purchases', purchaseId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
};

// Update purchase
export const updatePurchase = async (purchaseId, purchaseData) => {
  try {
    const purchaseRef = doc(db, 'purchases', purchaseId);
    await updateDoc(purchaseRef, {
      ...purchaseData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
};

// Subscribe to transactions (real-time updates)
export const subscribeToTransactions = (callback) => {
  const transactionsRef = collection(db, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    callback(transactions);
  }, (error) => {
    console.error('Error fetching transactions:', error);
    callback([]);
  });
};
