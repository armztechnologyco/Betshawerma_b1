const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://betshawerma-2e5eb-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Create new order
app.post('/orders', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
      orderNumber: Math.floor(Math.random() * 9000 + 1000).toString()
    };
    
    const docRef = await db.collection('orders').add(orderData);
    res.status(201).json({ id: docRef.id, ...orderData });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get kitchen orders (descending)
app.get('/kitchen/orders', async (req, res) => {
  try {
    const snapshot = await db.collection('orders')
      .where('status', 'in', ['pending', 'preparing'])
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all orders with filtering
app.get('/orders', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = db.collection('orders');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.collection('orders').doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add transaction (income/expense)
app.post('/transactions', async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      transactionId: Date.now().toString()
    };
    
    const docRef = await db.collection('transactions').add(transactionData);
    res.status(201).json({ id: docRef.id, ...transactionData });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transactions with filters
app.get('/transactions', async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    let query = db.collection('transactions');
    
    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }
    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add employee salary
app.post('/employees/salary', async (req, res) => {
  try {
    const salaryData = {
      ...req.body,
      type: 'expense',
      category: 'salary',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('transactions').add(salaryData);
    res.status(201).json({ id: docRef.id, ...salaryData });
  } catch (error) {
    console.error('Error adding salary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get employees
app.get('/employees', async (req, res) => {
  try {
    const snapshot = await db.collection('employees').get();
    const employees = [];
    snapshot.forEach(doc => {
      employees.push({ id: doc.id, ...doc.data() });
    });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add employee
app.post('/employees', async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      createdAt: new Date().toISOString()
    };
    const docRef = await db.collection('employees').add(employeeData);
    res.status(201).json({ id: docRef.id, ...employeeData });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get financial summary
app.get('/financial/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const snapshot = await db.collection('transactions')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .get();
    
    let totalIncome = 0;
    let totalExpense = 0;
    let salaryExpense = 0;
    let otherExpense = 0;
    
    snapshot.forEach(doc => {
      const transaction = doc.data();
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
    
    res.json({
      totalIncome,
      totalExpense,
      salaryExpense,
      otherExpense,
      profit: totalIncome - totalExpense,
      month,
      year
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's orders
    const todayOrders = await db.collection('orders')
      .where('createdAt', '>=', today)
      .get();
    
    let todayRevenue = 0;
    todayOrders.forEach(doc => {
      todayRevenue += doc.data().total || 0;
    });
    
    // Pending orders count
    const pendingOrders = await db.collection('orders')
      .where('status', '==', 'pending')
      .get();
    
    // Preparing orders count
    const preparingOrders = await db.collection('orders')
      .where('status', '==', 'preparing')
      .get();
    
    res.json({
      todayRevenue,
      pendingOrders: pendingOrders.size,
      preparingOrders: preparingOrders.size,
      totalOrdersToday: todayOrders.size
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the API
exports.api = functions.https.onRequest(app);