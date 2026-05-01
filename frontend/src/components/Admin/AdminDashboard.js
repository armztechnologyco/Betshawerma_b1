
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Users, UserPlus, LogOut, TrendingUp, ShoppingBag, Clock, 
  LayoutDashboard, CreditCard, ChefHat, BookOpen, X,
  Edit2, Trash2, Save, AlertCircle, Plus, Minus,
  Scale, DollarSign, Upload, Package, Calendar,
  FileText, Filter, Download, Eye, Beef, Salad, 
  Sandwich, Coffee, Droplet
} from 'lucide-react';
import { getCurrentUser, logoutUser, getAllUsers, registerUser, USER_ROLES } from '../../services/authService';
import { 
  getDashboardStats, addTransaction, getTransactions, 
  getFinancialSummary, recordSalary, updateOrderStatus,
  subscribeToKitchenOrders
} from '../../services/firebaseService';
import { 
  subscribeToMenu, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} from '../../services/menuService';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';

function AdminDashboard({ initialTab = 'overview' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orderTimers, setOrderTimers] = useState({});
  
  // Menu management state
  const [menuItems, setMenuItems] = useState({
    shawarma: [],
    plates: [],
    sandwiches: [],
    sides: [],
    drinks: []
  });
  const [selectedCategory, setSelectedCategory] = useState('shawarma');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // const [editForm, setEditForm] = useState({
  //   name: '',
  //   price: '',
  //   weight: '',
  //   weightInKg: '',
  //   image: '',
  //   imageFile: null,
  //   basePrice: '',
  //   includes: '',
  //   category: '',
  //   available: true
  // });
  const [editForm, setEditForm] = useState({
  name: '',
  price: '',
  weight: '',
  weightInKg: '',
  preparationTime: 5, // Add this
  image: '',
  imageFile: null,
  basePrice: '',
  includes: '',
  category: '',
  available: true
});

  // Cashier state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cashierActiveTab, setCashierActiveTab] = useState('shawarma');

  // Kitchen state
  const [kitchenOrders, setKitchenOrders] = useState([]);

  // Accounting state
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, profit: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ type: 'expense', amount: '', description: '', category: '' });
  const [salaryData, setSalaryData] = useState({ employeeName: '', amount: '', month: selectedMonth, year: selectedYear });

  // Salary filter state
  const [salaryFilter, setSalaryFilter] = useState({
    employeeName: '',
    month: 'all',
    year: 'all'
  });


  
  // Purchases/Inventory state
  const [purchases, setPurchases] = useState([]);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ itemName: '', quantity: '', unit: 'kg', price: '', supplier: '' });
  
  // Inventory calculation state
  const [inventoryData, setInventoryData] = useState({
    totalPurchased: 0,
    totalConsumed: 0,
    remainingStock: 0,
    details: {}
  });

  // Salaries state
  const [salaries, setSalaries] = useState([]);

  // Reports state
  const [reportData, setReportData] = useState([]);
  const [reportFilter, setReportFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return { fromDate: today, toDate: today, status: 'all' };
  });
  const [showReport, setShowReport] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState(null);

  // User form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    name: '', email: '', password: '', role: USER_ROLES.CASHIER, shiftStart: '09:00', shiftEnd: '17:00'
  });
  const [editUserData, setEditUserData] = useState({ name: '', role: '', shiftStart: '', shiftEnd: '' });

  // Tab configuration
  const tabs = [
    { id: 'overview', name: t('admin.tabs.overview'), icon: LayoutDashboard },
    { id: 'cashier', name: t('admin.tabs.cashier'), icon: CreditCard },
    { id: 'menu', name: t('admin.tabs.menu'), icon: Package },
    { id: 'kitchen', name: t('admin.tabs.kitchen'), icon: ChefHat },
    { id: 'purchases', name: t('admin.tabs.purchases'), icon: ShoppingBag },
    { id: 'salaries', name: t('admin.tabs.salaries'), icon: Users },
    { id: 'reports', name: t('admin.tabs.reports'), icon: FileText },
    { id: 'accounting', name: t('admin.tabs.accounting'), icon: BookOpen },
    { id: 'users', name: t('admin.tabs.users'), icon: Users }
  ];

  const categoryConfig = {
    shawarma: { name: t('cashier.categories.shawarma'), icon: Beef, color: 'bg-red-500' },
    plates: { name: t('cashier.categories.plates'), icon: Salad, color: 'bg-green-500' },
    sandwiches: { name: t('cashier.categories.sandwiches'), icon: Sandwich, color: 'bg-orange-500' },
    sides: { name: t('cashier.categories.sides'), icon: Coffee, color: 'bg-purple-500' },
    drinks: { name: t('cashier.categories.drinks'), icon: Droplet, color: 'bg-blue-500' }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2023, 2024, 2025, 2026];

  // Load data on mount
  useEffect(() => {
    loadAdminData();
    loadPurchases();
    loadSalaries();
  }, []);

  useEffect(() => {
    if (activeTab === 'accounting') loadAccountingData();
    if (activeTab === 'kitchen') {
      const unsubscribe = subscribeToKitchenOrders(setKitchenOrders);
      return () => unsubscribe();
    }
    if (activeTab === 'purchases') {
      calculateInventory();
    }
    if (activeTab === 'reports') {
      generateReport();
    }
  }, [activeTab, selectedMonth, selectedYear, purchases]);

  // Subscribe to menu changes
  useEffect(() => {
    const unsubscribe = subscribeToMenu((data) => {
      if (data && Object.keys(data).length > 0) {
        setMenuItems(data);
      }
    });
    return () => unsubscribe();
  }, []);
useEffect(() => {
  if (activeTab === 'kitchen') {
    // Initialize timers for new orders
    const timers = {};
    kitchenOrders.forEach(order => {
      if (order.status === 'preparing' && !orderTimers[order.id]) {
        const totalTime = order.items?.reduce((total, item) => {
          return total + ((item.preparationTime || 5) * item.quantity);
        }, 0) || 5;
        
        timers[order.id] = {
          totalTime: totalTime,
          remainingTime: totalTime,
          startTime: Date.now()
        };
      }
    });
    
    if (Object.keys(timers).length > 0) {
      setOrderTimers(prev => ({ ...prev, ...timers }));
    }
  }
}, [kitchenOrders, activeTab]);

// Add countdown update effect
useEffect(() => {
  if (activeTab === 'kitchen') {
    const interval = setInterval(() => {
      setOrderTimers(prev => {
        const updated = { ...prev };
        let changed = false;
        
        Object.keys(updated).forEach(orderId => {
          if (updated[orderId].remainingTime > 0) {
            const elapsed = Math.floor((Date.now() - updated[orderId].startTime) / 1000);
            const remaining = Math.max(0, updated[orderId].totalTime * 60 - elapsed);
            updated[orderId].remainingTime = remaining;
            changed = true;
          }
        });
        
        return changed ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }
}, [activeTab]);

// Function to start preparation for an order
const startPreparation = (orderId, items) => {
  const totalTime = items?.reduce((total, item) => {
    return total + ((item.preparationTime || 5) * item.quantity);
  }, 0) || 5;
  
  setOrderTimers(prev => ({
    ...prev,
    [orderId]: {
      totalTime: totalTime,
      remainingTime: totalTime * 60,
      startTime: Date.now()
    }
  }));
  
  updateOrderStatus(orderId, 'preparing');
  toast.success(`Started preparing order #${orderId}`);
};

// Function to format time (MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Calculate progress percentage
const getProgressPercentage = (remaining, total) => {
  if (!total || total === 0) return 0;
  return ((total * 60 - remaining) / (total * 60)) * 100;
};


  const loadPurchases = () => {
    const savedPurchases = localStorage.getItem('purchases');
    if (savedPurchases) setPurchases(JSON.parse(savedPurchases));
    else setPurchases([]);
  };

  const loadSalaries = () => {
    const savedSalaries = localStorage.getItem('salaries');
    if (savedSalaries) setSalaries(JSON.parse(savedSalaries));
    else setSalaries([]);
  };

  // Calculate inventory based on purchases and orders
  const calculateInventory = () => {
    const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    
    const purchasedByItem = {};
    purchases.forEach(purchase => {
      const itemKey = purchase.itemName;
      if (!purchasedByItem[itemKey]) {
        purchasedByItem[itemKey] = 0;
      }
      purchasedByItem[itemKey] += purchase.quantity;
    });

    const consumedByItem = {};
    savedOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.weightInKg && item.weightInKg > 0) {
          const consumedKg = item.weightInKg * item.quantity;
          
          let inventoryKey = '';
          if (item.linkedInventoryItem) {
            inventoryKey = item.linkedInventoryItem;
          } else if (item.name.toLowerCase().includes('chicken')) {
            inventoryKey = 'Chicken Meat';
          } else if (item.name.toLowerCase().includes('beef')) {
            inventoryKey = 'Beef Meat';
          } else if (item.name.toLowerCase().includes('meat')) {
            inventoryKey = 'Meat';
          } else {
            return;
          }
          
          if (!consumedByItem[inventoryKey]) {
            consumedByItem[inventoryKey] = 0;
          }
          consumedByItem[inventoryKey] += consumedKg;
        }
      });
    });

    const details = {};
    let totalPurchased = 0;
    let totalConsumed = 0;
    
    Object.keys(purchasedByItem).forEach(item => {
      const purchased = purchasedByItem[item];
      const consumed = consumedByItem[item] || 0;
      const remaining = purchased - consumed;
      
      details[item] = {
        purchased: purchased,
        consumed: consumed,
        remaining: remaining
      };
      
      totalPurchased += purchased;
      totalConsumed += consumed;
    });
    
    setInventoryData({
      totalPurchased: totalPurchased,
      totalConsumed: totalConsumed,
      remainingStock: totalPurchased - totalConsumed,
      details: details
    });
  };

  const savePurchase = () => {
    if (!purchaseForm.itemName || !purchaseForm.quantity || !purchaseForm.price) {
      toast.error('Please fill all required fields');
      return;
    }

    const newPurchase = {
      id: Date.now(),
      ...purchaseForm,
      quantity: parseFloat(purchaseForm.quantity),
      price: parseFloat(purchaseForm.price),
      totalCost: parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.price),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const updatedPurchases = [...purchases, newPurchase];
    setPurchases(updatedPurchases);
    localStorage.setItem('purchases', JSON.stringify(updatedPurchases));
    
    calculateInventory();
    toast.success('Purchase added successfully');
    setShowAddPurchase(false);
    setPurchaseForm({ itemName: '', quantity: '', unit: 'kg', price: '', supplier: '' });
  };

  const saveSalary = () => {
    if (!salaryData.employeeName || !salaryData.amount) {
      toast.error('Please fill all fields');
      return;
    }

    const newSalary = {
      id: Date.now(),
      ...salaryData,
      amount: parseFloat(salaryData.amount),
      date: new Date().toISOString(),
      month: salaryData.month,
      year: salaryData.year
    };

    const updatedSalaries = [...salaries, newSalary];
    setSalaries(updatedSalaries);
    localStorage.setItem('salaries', JSON.stringify(updatedSalaries));
    
    toast.success('Salary recorded successfully');
    setShowAddSalary(false);
    setSalaryData({ employeeName: '', amount: '', month: selectedMonth, year: selectedYear });
  };

  const clearSalaryFilters = () => {
    setSalaryFilter({
      employeeName: '',
      month: 'all',
      year: 'all'
    });
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser?.role === USER_ROLES.ADMIN) {
        await Promise.all([fetchUsers(), fetchStats(), loadAccountingData()]);
      }
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) { console.error(error); }
  };

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) { console.error(error); }
  };

  const loadAccountingData = async () => {
    try {
      const [tx, sum] = await Promise.all([getTransactions(), getFinancialSummary(selectedMonth, selectedYear)]);
      setTransactions(tx || []);
      setSummary(sum || { totalIncome: 0, totalExpense: 0, profit: 0 });
    } catch (error) { console.error(error); }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Menu CRUD Operations
  // const handleAddItem = () => {
  //   setEditingItem(null);
  //   setImagePreview(null);
  //   setEditForm({ 
  //     name: '', price: '', weight: '', weightInKg: '', 
  //     image: '', imageFile: null, basePrice: '', includes: '', 
  //     category: selectedCategory, available: true 
  //   });
  //   setShowEditModal(true);
  // };

  const handleAddItem = () => {
  setEditingItem(null);
  setImagePreview(null);
  setEditForm({ 
    name: '', price: '', weight: '', weightInKg: '', 
    linkedInventoryItem: '',
    preparationTime: 5, // Add default value
    image: '', imageFile: null, basePrice: '', includes: '', 
    category: selectedCategory, available: true 
  });
  setShowEditModal(true);
};

  // const handleEditItem = (item) => {
  //   setEditingItem(item);
  //   setImagePreview(item.image?.startsWith('http') || item.image?.startsWith('data:image') ? item.image : null);
  //   setEditForm({
  //     name: item.name, 
  //     price: item.price, 
  //     weight: item.weight, 
  //     weightInKg: item.weightInKg || '',
  //     image: item.image, 
  //     imageFile: null, 
  //     basePrice: item.basePrice, 
  //     includes: item.includes || '',
  //     category: item.category, 
  //     available: item.available
  //   });
  //   setShowEditModal(true);
  // };

const handleEditItem = (item) => {
  setEditingItem(item);
  setImagePreview(item.image?.startsWith('http') || item.image?.startsWith('data:image') ? item.image : null);
  setEditForm({
    name: item.name, 
    price: item.price, 
    weight: item.weight, 
    weightInKg: item.weightInKg || '',
    linkedInventoryItem: item.linkedInventoryItem || '',
    preparationTime: item.preparationTime || 5, // Add this
    image: item.image, 
    imageFile: null, 
    basePrice: item.basePrice, 
    includes: item.includes || '',
    category: item.category, 
    available: item.available
  });
  setShowEditModal(true);
};

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Delete ${item.name}?`)) {
      try {
        await deleteMenuItem(item.id);
        toast.success(`${item.name} deleted`);
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setEditForm({ ...editForm, image: reader.result, imageFile: file });
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Invalid image file. Max 2MB');
    }
  };

  // const handleSaveItem = async () => {
  //   if (!editForm.name || !editForm.price || !editForm.weight) {
  //     toast.error('Please fill all required fields');
  //     return;
  //   }

  //   const itemData = {
  //     name: editForm.name,
  //     price: parseFloat(editForm.price),
  //     weight: editForm.weight,
  //     weightInKg: parseFloat(editForm.weightInKg) || 0,
  //     image: editForm.image || '🍽️',
  //     basePrice: parseFloat(editForm.basePrice || editForm.price),
  //     includes: editForm.includes,
  //     category: editForm.category,
  //     available: editForm.available
  //   };

  //   try {
  //     if (editingItem) {
  //       await updateMenuItem(editingItem.id, itemData);
  //       toast.success(`${itemData.name} updated`);
  //     } else {
  //       await addMenuItem(itemData);
  //       toast.success(`${itemData.name} added`);
  //     }

  //     setShowEditModal(false);
  //     setEditingItem(null);
  //     setImagePreview(null);
  //   } catch (error) {
  //     toast.error('Operation failed');
  //     console.error(error);
  //   }
  // };

 const handleSaveItem = async () => {
  if (!editForm.name || !editForm.price || !editForm.weight) {
    toast.error('Please fill all required fields');
    return;
  }

  const itemData = {
    name: editForm.name,
    price: parseFloat(editForm.price),
    weight: editForm.weight,
    weightInKg: parseFloat(editForm.weightInKg) || 0,
    linkedInventoryItem: editForm.linkedInventoryItem || '',
    preparationTime: parseInt(editForm.preparationTime) || 5, // Add preparation time
    image: editForm.image || '🍽️',
    basePrice: parseFloat(editForm.basePrice || editForm.price),
    includes: editForm.includes,
    category: editForm.category,
    available: editForm.available
  };

  try {
    if (editingItem) {
      await updateMenuItem(editingItem.id, itemData);
      toast.success(`${itemData.name} updated`);
    } else {
      await addMenuItem(itemData);
      toast.success(`${itemData.name} added`);
    }

    setShowEditModal(false);
    setEditingItem(null);
    setImagePreview(null);
  } catch (error) {
    toast.error('Operation failed');
    console.error(error);
  }
};
 
  const toggleItemAvailability = async (item) => {
    try {
      await updateMenuItem(item.id, {
        ...item,
        available: !item.available
      });
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const formatShiftTime = (val) => {
    if (!val) return '09:00';
    if (typeof val === 'string') return val;
    // Handle Firestore Timestamp
    if (val && typeof val === 'object' && 'seconds' in val) {
      const date = new Date(val.seconds * 1000);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return '09:00';
  };

  // Cashier functions
  const addToCart = (item) => {
    const cartItem = { ...item, quantity: 1, extras: [], totalPrice: item.price };
    setCart([...cart, cartItem]);
    toast.success(t('cashier.addedToCart', { name: item.name }));
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success(t('cashier.removedFromCart'));
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleOrder = async () => {
    if (!cart.length) return toast.error(t('cashier.cartEmpty'));
    setProcessing(true);
    try {
      const order = { 
        items: cart, 
        total: calculateTotal(), 
        customerName: customerName || "Walk-in Customer", 
        status: 'pending', 
        orderNumber: Math.floor(Math.random() * 9000 + 1000).toString(), 
        createdAt: new Date().toISOString() 
      };
      
      await addDoc(collection(db, 'orders'), order);
      await addDoc(collection(db, 'transactions'), { 
        type: 'income', 
        amount: calculateTotal(), 
        description: `Order #${order.orderNumber}`, 
        category: 'sales', 
        createdAt: new Date().toISOString() 
      });
      
      const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
      savedOrders.push(order);
      localStorage.setItem('orders', JSON.stringify(savedOrders));
      
      calculateInventory();
      
      toast.success(t('cashier.orderCreated', { number: order.orderNumber }));
      setCart([]);
      setCustomerName('');
      fetchStats();
    } catch (error) { 
      toast.error(t('cashier.failedToCreate')); 
      console.error(error);
    } finally { 
      setProcessing(false); 
    }
  };

  // User CRUD with shift times
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) return toast.error("Fill all fields");
    setSubmitting(true);
    const res = await registerUser(newUserData.email, newUserData.password, {
      name: newUserData.name, 
      role: newUserData.role, 
      shiftStart: newUserData.shiftStart, 
      shiftEnd: newUserData.shiftEnd, 
      createdBy: user?.uid
    });
    if (res.success) {
      toast.success(`User ${newUserData.name} created`);
      setShowAddUser(false);
      setNewUserData({ name: '', email: '', password: '', role: USER_ROLES.CASHIER, shiftStart: '09:00', shiftEnd: '17:00' });
      fetchUsers();
    } else toast.error(res.error);
    setSubmitting(false);
  };

  const handleEditUserClick = (userToEdit) => {
    setSelectedUser(userToEdit);
    setEditUserData({ 
      name: userToEdit.name, 
      role: userToEdit.role, 
      shiftStart: formatShiftTime(userToEdit.shiftStart), 
      shiftEnd: formatShiftTime(userToEdit.shiftEnd) 
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, { 
        name: editUserData.name, 
        role: editUserData.role, 
        shiftStart: editUserData.shiftStart, 
        shiftEnd: editUserData.shiftEnd, 
        updatedAt: new Date().toISOString() 
      });
      toast.success('User updated');
      setShowEditUser(false);
      fetchUsers();
    } catch (error) { toast.error('Update failed'); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === user?.uid) return toast.error("Cannot delete yourself");
    if (window.confirm(`Delete ${userName}?`)) {
      await deleteDoc(doc(db, 'users', userId));
      toast.success(`${userName} deleted`);
      fetchUsers();
    }
  };

  // Report generation
  const generateReport = async () => {
    if (!reportFilter.fromDate || !reportFilter.toDate) {
      toast.error('Please select date range');
      return;
    }
    
    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    orders = orders.filter(order => order.createdAt >= reportFilter.fromDate && order.createdAt <= reportFilter.toDate);
    if (reportFilter.status !== 'all') orders = orders.filter(order => order.status === reportFilter.status);
    
    setReportData(orders);
    setShowReport(true);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center"><h1 className="text-white text-xl font-bold">{t('admin.dashboard')}</h1></div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="bg-orange-700 text-white px-4 py-2 rounded-lg">{t('admin.logout')}</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white shadow-md overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-orange-600'}`}>
                <tab.icon size={18} /> {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

       {/* className="container mx-auto px-4 py-8"> */}
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
              onClick={() => setActiveTab('reports')}
            >
              <h3 className="text-lg font-semibold text-gray-700">{t('admin.overview.totalSales')}</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">₪{stats.todayRevenue || 0}</p>
              <p className="text-xs text-gray-400 mt-2">Click to view details</p>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
              onClick={() => setActiveTab('reports')}
            >
              <h3 className="text-lg font-semibold text-gray-700">{t('admin.overview.totalOrders')}</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalOrdersToday || 0}</p>
              <p className="text-xs text-gray-400 mt-2">Click to view details</p>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
              onClick={() => setActiveTab('kitchen')}
            >
              <h3 className="text-lg font-semibold text-gray-700">{t('admin.overview.pendingOrders')}</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{(stats.pendingOrders || 0) + (stats.preparingOrders || 0)}</p>
              <p className="text-xs text-gray-400 mt-2">Click to view kitchen</p>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all"
              onClick={() => setActiveTab('users')}
            >
              <h3 className="text-lg font-semibold text-gray-700">{t('admin.users.title')}</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{users.length}</p>
              <p className="text-xs text-gray-400 mt-2">Click to manage users</p>
            </div>
          </div>
        )}

        {/* CASHIER TAB */}
        {/* {activeTab === 'cashier' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (<button key={key} onClick={() => setCashierActiveTab(key)} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${cashierActiveTab === key ? config.color + ' text-white' : 'bg-gray-200'}`}><Icon size={16} />{config.name}</button>);
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(menuItems[cashierActiveTab] || []).filter(i => i.available).map(item => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg cursor-pointer" onClick={() => addToCart(item)}>
                      <div className="w-full h-24 mb-2 flex items-center justify-center">
                        {item.image && (item.image.startsWith('data:image') || item.image.startsWith('http')) ? (
                          <img src={item.image} alt={item.name} className="h-20 w-20 object-cover rounded-lg" />
                        ) : (
                          <span className="text-4xl">{item.image || '🍽️'}</span>
                        )}
                      </div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500"><Scale size={14} />{item.weight}</div>
                      <p className="text-green-600 font-bold">₪{item.price}</p>
                      <button className="mt-2 bg-green-500 text-white px-3 py-1 rounded w-full">Add to Order</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
                <h3 className="text-xl font-bold mb-4">Current Order</h3>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Customer name" />
                <div className="border-t border-b py-4 mb-4 max-h-96 overflow-y-auto">
                  {cart.map(item => (<div key={item.id} className="flex justify-between items-center mb-3"><div><p className="font-semibold">{item.name}</p><p className="text-sm">₪{item.price} each</p></div><div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.id, -1)} className="bg-gray-200 px-2 rounded">-</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="bg-gray-200 px-2 rounded">+</button><button onClick={() => removeFromCart(item.id)} className="text-red-500">×</button></div></div>))}
                </div>
                <div className="flex justify-between text-xl font-bold mb-4"><span>Total:</span><span>₪{calculateTotal()}</span></div>
                <button onClick={handleOrder} disabled={processing || !cart.length} className="w-full bg-blue-500 text-white py-3 rounded">{processing ? 'Processing...' : 'Complete Order'}</button>
              </div>
            </div>
          </div>
        )} */}


{activeTab === 'cashier' && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button 
                key={key} 
                onClick={() => setCashierActiveTab(key)} 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${cashierActiveTab === key ? config.color + ' text-white' : 'bg-gray-200'}`}
              >
                <Icon size={16} />
                {config.name}
                <span className="ml-1 text-xs">
                  ({menuItems[key]?.filter(i => i.available).length || 0})
                </span>
              </button>
            );
          })}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems[cashierActiveTab] && menuItems[cashierActiveTab].length > 0 ? (
            menuItems[cashierActiveTab]
              .filter(item => item.available !== false)
              .map(item => (
                <div 
                  key={item.id} 
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all" 
                  onClick={() => addToCart(item)}
                >
                  <div className="w-full h-24 mb-2 flex items-center justify-center">
                    {item.image && (item.image.startsWith('data:image') || item.image.startsWith('http')) ? (
                      <img src={item.image} alt={item.name} className="h-20 w-20 object-cover rounded-lg" />
                    ) : (
                      <span className="text-4xl">{item.image || '🍽️'}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Scale size={14} />
                    <span>{item.weight}</span>
                  </div>
                  <p className="text-green-600 font-bold text-lg mt-1">₪{item.price}</p>
                  {item.includes && (
                    <p className="text-xs text-gray-500 mt-1">{item.includes}</p>
                  )}
                  <button className="mt-3 bg-green-500 text-white px-3 py-1 rounded w-full hover:bg-green-600 transition">
                    {t('cashier.addToOrder')}
                  </button>
                </div>
              ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No items available in this category. {user?.role === 'admin' && 'Click "Add Item" to add menu items.'}
            </div>
          )}
        </div>
      </div>
    </div>
    
    <div className="lg:col-span-1">
      {/* Cart section remains the same */}
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
        <h3 className="text-xl font-bold mb-4">{t('cashier.currentOrder')}</h3>
        <input 
          type="text" 
          value={customerName} 
          onChange={(e) => setCustomerName(e.target.value)} 
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder={t('cashier.enterCustomerName')}
        />
        <div className="border-t border-b py-4 mb-4 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center">{t('cashier.cartEmpty')}</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-3 pb-2 border-b">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">₪{item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)} 
                    className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)} 
                    className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-red-500 ml-2 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between text-xl font-bold mb-4">
          <span>{t('cashier.total')}:</span>
          <span>₪{calculateTotal()}</span>
        </div>
        <button 
          onClick={handleOrder} 
          disabled={processing || !cart.length} 
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {processing ? t('cashier.processing') : t('cashier.completeOrder')}
        </button>
      </div>
    </div>
  </div>
)}

        {/* MENU MANAGEMENT TAB */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">{t('admin.tabs.menu')}</h2><button onClick={handleAddItem} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} />{t('admin.inventory.addPurchase')}</button></div>
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (<button key={key} onClick={() => setSelectedCategory(key)} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selectedCategory === key ? config.color + ' text-white' : 'bg-white border'}`}><Icon size={16} />{config.name}</button>);
              })}
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left">{t('admin.inventory.history')}</th><th className="px-6 py-3 text-left">{t('admin.inventory.itemName')}</th><th className="px-6 py-3 text-left">{t('admin.inventory.price')}</th><th className="px-6 py-3 text-left">{t('admin.inventory.unit')}</th><th className="px-6 py-3 text-left">{t('reports.status')}</th><th className="px-6 py-3 text-left">{t('admin.users.actions')}</th></tr>
                </thead>
                <tbody>
                  {(menuItems[selectedCategory] || []).map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="px-6 py-4">
                        {item.image && (item.image.startsWith('data:image') || item.image.startsWith('http')) ? (
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <span className="text-2xl">{item.image || '🍽️'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4">₪{item.price}</td>
                      <td className="px-6 py-4">{item.weight}</td>
                      <td className="px-6 py-4"><button onClick={() => toggleItemAvailability(item)} className={`px-2 py-1 rounded text-xs ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.available ? t('kitchen.ready') : t('cashier.unavailable', { name: '' })}</button></td>
                      <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => handleEditItem(item)} className="text-blue-600"><Edit2 size={18} /></button><button onClick={() => handleDeleteItem(item)} className="text-red-600"><Trash2 size={18} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KITCHEN TAB */}
        {/* {activeTab === 'kitchen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitchenOrders.map(order => (<div key={order.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500"><h3 className="text-xl font-bold">Order #{order.orderNumber}</h3><p className="text-gray-600">{order.customerName}</p><div className="border-t py-2 my-2">{order.items?.map((item, i) => (<div key={i} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>₪{item.price * item.quantity}</span></div>))}</div><div className="flex justify-between"><span className="font-bold">Total: ₪{order.total}</span><button onClick={() => updateOrderStatus(order.id, 'ready')} className="bg-green-500 text-white px-4 py-2 rounded">Mark Ready</button></div></div>))}
          </div>
        )} */}

        {/* KITCHEN TAB WITH COUNTDOWN */}
{activeTab === 'kitchen' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {kitchenOrders.map(order => {
      const timer = orderTimers[order.id];
      const totalPrepTime = order.items?.reduce((total, item) => {
        return total + ((item.preparationTime || 5) * item.quantity);
      }, 0) || 5;
      
      return (
        <div key={order.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold">Order #{order.orderNumber}</h3>
            <span className={`px-2 py-1 rounded text-xs ${
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
              order.status === 'ready' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
          
          <p className="text-gray-600 mb-2">{order.customerName}</p>
          <p className="text-sm text-gray-500 mb-3">
            Total items: {order.items?.length} | Est. time: {totalPrepTime} min
          </p>
          
          <div className="border-t py-3 my-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="ml-2">{item.name}</span>
                  {item.preparationTime && (
                    <span className="text-xs text-gray-500 ml-2">
                      (⏱️ {item.preparationTime} min each)
                    </span>
                  )}
                </div>
                <span className="font-bold">₪{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">Total: ₪{order.total}</span>
          </div>
          
          {/* Countdown Timer Display */}
          {order.status === 'preparing' && timer && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Preparation Time Remaining:</span>
                <span className="font-mono font-bold text-lg">
                  {formatTime(timer.remainingTime)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgressPercentage(timer.remainingTime, timer.totalTime)}%` }}
                ></div>
              </div>
              {timer.remainingTime === 0 && (
                <div className="mt-2 text-green-600 text-sm font-semibold animate-pulse">
                  ✓ Ready to serve!
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {order.status === 'pending' && (
                <button 
                onClick={() => startPreparation(order.id, order.items)} 
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {t('kitchen.startPrep')}
              </button>
            )}
            
            {order.status === 'preparing' && timer && timer.remainingTime === 0 && (
              <button 
                onClick={() => updateOrderStatus(order.id, 'ready')} 
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {t('kitchen.markReady')}
              </button>
            )}
            
            {order.status === 'ready' && (
              <button 
                onClick={() => updateOrderStatus(order.id, 'completed')} 
                className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                {t('kitchen.completeOrder')}
              </button>
            )}
          </div>
        </div>
      );
    })}
    
    {kitchenOrders.length === 0 && (
      <div className="col-span-3 text-center py-12 text-gray-500">
        {t('kitchen.noActive')}
      </div>
    )}
  </div>
)}


        {/* PURCHASES TAB */}
        {activeTab === 'purchases' && (
          <div>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">{t('admin.inventory.title')}</h2>
              <button onClick={() => setShowAddPurchase(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} /> {t('admin.inventory.addPurchase')}
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">{t('admin.inventory.history')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.inventory.totalPurchased')}</p>
                  <p className="text-2xl font-bold text-blue-600">{inventoryData.totalPurchased.toFixed(2)} kg</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.inventory.totalConsumed')}</p>
                  <p className="text-2xl font-bold text-orange-600">{inventoryData.totalConsumed.toFixed(2)} kg</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.inventory.remainingStock')}</p>
                  <p className="text-2xl font-bold text-green-600">{inventoryData.remainingStock.toFixed(2)} kg</p>
                </div>
              </div>
              
              <h4 className="font-semibold mb-3">Detailed Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(inventoryData.details).map(([item, data]) => (
                  <div key={item} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{item}</span>
                    <div className="flex gap-4 text-sm">
                      <span>Purchased: <strong>{data.purchased.toFixed(2)} kg</strong></span>
                      <span className="text-orange-600">Consumed: <strong>{data.consumed.toFixed(2)} kg</strong></span>
                      <span className="text-green-600">Remaining: <strong>{data.remaining.toFixed(2)} kg</strong></span>
                    </div>
                  </div>
                ))}
                {Object.keys(inventoryData.details).length === 0 && (
                  <div className="text-center py-4 text-gray-500">No inventory data available. Add purchases to track inventory.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <h3 className="text-xl font-bold p-6 border-b">{t('admin.inventory.history')}</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3">{t('admin.inventory.date')}</th><th className="px-6 py-3">{t('admin.inventory.itemName')}</th><th className="px-6 py-3">{t('admin.inventory.quantity')}</th><th className="px-6 py-3">{t('admin.inventory.unit')}</th><th className="px-6 py-3">{t('admin.inventory.price')}</th><th className="px-6 py-3">{t('admin.inventory.total')}</th></tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} className="border-t">
                      <td className="px-6 py-4">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{p.itemName}</td>
                      <td className="px-6 py-4">{p.quantity}</td>
                      <td className="px-6 py-4">{p.unit}</td>
                      <td className="px-6 py-4">₪{p.price}</td>
                      <td className="px-6 py-4 font-bold">₪{p.totalCost}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No purchase records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SALARIES TAB */}
        {activeTab === 'salaries' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t('admin.salaries.title')}</h2>
              <button onClick={() => setShowAddSalary(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} /> Add Salary
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.salaries.employeeName')}</label>
                  <input type="text" placeholder="Search employee..." className="w-full border rounded-lg px-3 py-2" value={salaryFilter.employeeName} onChange={(e) => setSalaryFilter({...salaryFilter, employeeName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.salaries.month')}</label>
                  <select className="w-full border rounded-lg px-3 py-2" value={salaryFilter.month} onChange={(e) => setSalaryFilter({...salaryFilter, month: e.target.value})}>
                    <option value="all">All Months</option>
                    {months.map((month, i) => (<option key={i} value={i+1}>{month}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.salaries.year')}</label>
                  <select className="w-full border rounded-lg px-3 py-2" value={salaryFilter.year} onChange={(e) => setSalaryFilter({...salaryFilter, year: e.target.value})}>
                    <option value="all">All Years</option>
                    {years.map(year => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={clearSalaryFilters} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">{t('admin.salaries.clearFilters')}</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Salaries Paid</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₪{salaries.filter(s => {
                    if (salaryFilter.employeeName && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
                    if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
                    if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
                    return true;
                  }).reduce((sum, s) => sum + s.amount, 0)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Employees Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(salaries.filter(s => {
                    if (salaryFilter.employeeName && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
                    if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
                    if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
                    return true;
                  }).map(s => s.employeeName)).size}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Average Salary</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₪{(() => {
                    const filtered = salaries.filter(s => {
                      if (salaryFilter.employeeName && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
                      if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
                      if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
                      return true;
                    });
                    return filtered.length ? Math.round(filtered.reduce((sum, s) => sum + s.amount, 0) / filtered.length) : 0;
                  })()}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3">Employee</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Month</th><th className="px-6 py-3">Year</th><th className="px-6 py-3">Date Paid</th></tr></thead>
              <tbody>{salaries.filter(s => {
                if (salaryFilter.employeeName && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
                if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
                if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
                return true;
              }).map(s => (<tr key={s.id} className="border-t"><td className="px-6 py-4 font-medium">{s.employeeName}</td><td className="px-6 py-4 font-bold text-green-600">₪{s.amount}</td><td className="px-6 py-4">{months[s.month-1]}</td><td className="px-6 py-4">{s.year}</td><td className="px-6 py-4">{new Date(s.date).toLocaleDateString()}</td></tr>))}</tbody>
              </table>
              {salaries.filter(s => {
                if (salaryFilter.employeeName && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
                if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
                if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
                return true;
              }).length === 0 && (<div className="text-center py-8 text-gray-500">No salary records found</div>)}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Reports</h2>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium mb-1">{t('admin.reports.fromDate')}</label><input type="date" value={reportFilter.fromDate} onChange={(e) => setReportFilter({...reportFilter, fromDate: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">{t('admin.reports.toDate')}</label><input type="date" value={reportFilter.toDate} onChange={(e) => setReportFilter({...reportFilter, toDate: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                <div><label className="block text-sm font-medium mb-1">{t('admin.reports.status')}</label><select value={reportFilter.status} onChange={(e) => setReportFilter({...reportFilter, status: e.target.value})} className="w-full border rounded px-3 py-2"><option value="all">{t('admin.reports.all')}</option><option value="pending">{t('reports.statusPending')}</option><option value="preparing">{t('reports.statusPreparing')}</option><option value="ready">{t('reports.statusReady')}</option><option value="completed">{t('reports.statusCompleted')}</option></select></div>
                <div className="flex items-end"><button onClick={generateReport} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center gap-2"><Filter size={18} /> {t('admin.reports.generate')}</button></div>
              </div>
            </div>
            {showReport && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                  <h3 className="text-xl font-bold">Order Report</h3>
                  <button className="text-blue-600 flex items-center gap-1">
                    <Download size={18} /> {t('admin.reports.download')}
                  </button>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-6 py-3">{t('cashier.receipt.orderNumber')}</th><th className="px-6 py-3">{t('admin.inventory.date')}</th><th className="px-6 py-3">{t('admin.users.fullName')}</th><th className="px-6 py-3">{t('admin.tabs.menu')}</th><th className="px-6 py-3">{t('admin.inventory.total')}</th><th className="px-6 py-3">{t('admin.reports.status')}</th><th className="px-6 py-3">Timing</th></tr>
                  </thead>
                  <tbody>
                    {reportData.map(order => (
                      <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedReportOrder(order)}>
                        <td className="px-6 py-4">#{order.orderNumber}</td>
                        <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{order.customerName}</td>
                        <td className="px-6 py-4">{order.items?.length} items</td>
                        <td className="px-6 py-4 font-bold">₪{order.total}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const expected = order.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                            const actual = order.completedAt 
                              ? (new Date(order.completedAt) - new Date(order.createdAt)) / (1000 * 60)
                              : (new Date() - new Date(order.createdAt)) / (1000 * 60);
                            
                            const isDelayed = actual > expected;
                            
                            if (order.status === 'completed') {
                              return (
                                <span className={`px-2 py-1 rounded text-xs font-bold ${isDelayed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                  {isDelayed ? `Delayed (${Math.round(actual - expected)}m)` : 'On Time'}
                                </span>
                              );
                            } else {
                              return isDelayed ? <span className="text-red-500 font-bold animate-pulse text-xs">Delayed</span> : <span className="text-gray-400 text-xs">In Progress</span>;
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ACCOUNTING TAB */}
        {activeTab === 'accounting' && (
          <div>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6"><h3>{t('admin.accounting.income')}</h3><p className="text-3xl font-bold text-green-600">₪{summary.totalIncome}</p></div>
              <div className="bg-white rounded-lg p-6"><h3>{t('admin.accounting.expenses')}</h3><p className="text-3xl font-bold text-red-600">₪{summary.totalExpense}</p></div>
              <div className="bg-white rounded-lg p-6"><h3>{t('admin.accounting.profit')}</h3><p className="text-3xl font-bold text-blue-600">₪{summary.profit}</p></div>
            </div>
            <div className="flex gap-4 mb-6">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="border rounded px-3 py-2">
                {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="border rounded px-3 py-2">
                {years.map(y => <option key={y}>{y}</option>)}
              </select>
              <button onClick={() => setShowAddTransaction(true)} className="bg-blue-500 text-white px-4 py-2 rounded">{t('admin.accounting.addTransaction')}</button>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3">{t('admin.inventory.date')}</th><th className="px-6 py-3">{t('admin.accounting.description')}</th><th className="px-6 py-3">{t('admin.accounting.category')}</th><th className="px-6 py-3">{t('admin.accounting.type')}</th><th className="px-6 py-3 text-right">{t('admin.inventory.quantity')}</th></tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{t.description}</td>
                      <td className="px-6 py-4">{t.category}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type}</span></td>
                      <td className="px-6 py-4 text-right font-bold">₪{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">{t('admin.users.title')}</h2><button onClick={() => setShowAddUser(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><UserPlus size={18} />{t('admin.users.addNew')}</button></div>
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3">{t('admin.users.fullName')}</th><th className="px-6 py-3">{t('admin.users.email')}</th><th className="px-6 py-3">{t('admin.users.role')}</th><th className="px-6 py-3">{t('admin.users.shift')}</th><th className="px-6 py-3">{t('admin.users.actions')}</th></tr></thead>
          <tbody>
  {users.map(u => (
    <tr key={u.id} className="border-t">
      <td className="px-6 py-4">
        {u.name}
        {u.id === user?.uid && <span className="ml-2 text-xs bg-orange-100 px-2 py-0.5 rounded">You</span>}
      </td>
      <td className="px-6 py-4">{u.email}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-xs ${
          u.role === 'admin' ? 'bg-red-100 text-red-800' : 
          u.role === 'cashier' ? 'bg-green-100 text-green-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {u.role}
        </span>
      </td>
      <td className="px-6 py-4">
        {formatShiftTime(u.shiftStart)} - {formatShiftTime(u.shiftEnd)}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button onClick={() => handleEditUserClick(u)} className="text-blue-600">
            <Edit2 size={18} />
          </button>
          <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-red-600">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
            </table></div>
          </div>
        )}
      {/* Modals */}
      {showAddUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.users.addNew')}</h2><form onSubmit={handleAddUserSubmit}><input type="text" placeholder={t('admin.users.fullName')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} required /><input type="email" placeholder={t('admin.users.email')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} required /><input type="password" placeholder={t('admin.users.password')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} required /><select className="w-full border rounded px-3 py-2 mb-3" value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})}><option value={USER_ROLES.ADMIN}>Admin</option><option value={USER_ROLES.CASHIER}>Cashier</option><option value={USER_ROLES.CHEF}>Chef</option></select><div className="grid grid-cols-2 gap-3 mb-3"><input type="time" placeholder={t('admin.users.shiftStart')} className="border rounded px-3 py-2" value={newUserData.shiftStart} onChange={e => setNewUserData({...newUserData, shiftStart: e.target.value})} /><input type="time" placeholder={t('admin.users.shiftEnd')} className="border rounded px-3 py-2" value={newUserData.shiftEnd} onChange={e => setNewUserData({...newUserData, shiftEnd: e.target.value})} /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-500 text-white rounded">{submitting ? t('admin.users.creating') : t('admin.users.createUser')}</button></div></form></div></div>)}

      {showEditUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.users.edit')}</h2><form onSubmit={handleUpdateUser}><input type="text" placeholder={t('admin.users.fullName')} className="w-full border rounded px-3 py-2 mb-3" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} required /><select className="w-full border rounded px-3 py-2 mb-3" value={editUserData.role} onChange={e => setEditUserData({...editUserData, role: e.target.value})}><option value={USER_ROLES.ADMIN}>Admin</option><option value={USER_ROLES.CASHIER}>Cashier</option><option value={USER_ROLES.CHEF}>Chef</option></select><div className="grid grid-cols-2 gap-3 mb-3"><input type="time" className="border rounded px-3 py-2" value={editUserData.shiftStart} onChange={e => setEditUserData({...editUserData, shiftStart: e.target.value})} /><input type="time" className="border rounded px-3 py-2" value={editUserData.shiftEnd} onChange={e => setEditUserData({...editUserData, shiftEnd: e.target.value})} /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowEditUser(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.common.update')}</button></div></form></div></div>)}

      {showAddPurchase && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.inventory.addPurchase')}</h2><input type="text" placeholder={t('admin.inventory.itemName')} className="w-full border rounded px-3 py-2 mb-3" value={purchaseForm.itemName} onChange={e => setPurchaseForm({...purchaseForm, itemName: e.target.value})} /><input type="number" placeholder={t('admin.inventory.quantity')} className="w-full border rounded px-3 py-2 mb-3" value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: e.target.value})} /><input type="number" placeholder={t('admin.inventory.price')} className="w-full border rounded px-3 py-2 mb-3" value={purchaseForm.price} onChange={e => setPurchaseForm({...purchaseForm, price: e.target.value})} /><input type="text" placeholder={t('admin.inventory.supplier')} className="w-full border rounded px-3 py-2 mb-4" value={purchaseForm.supplier} onChange={e => setPurchaseForm({...purchaseForm, supplier: e.target.value})} /><div className="flex justify-end gap-3"><button onClick={() => setShowAddPurchase(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={savePurchase} className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.inventory.addPurchase')}</button></div></div></div>)}

      {showAddSalary && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.salaries.addSalary')}</h2><input type="text" placeholder={t('admin.salaries.employeeName')} className="w-full border rounded px-3 py-2 mb-3" value={salaryData.employeeName} onChange={e => setSalaryData({...salaryData, employeeName: e.target.value})} /><input type="number" placeholder={t('admin.salaries.amount')} className="w-full border rounded px-3 py-2 mb-3" value={salaryData.amount} onChange={e => setSalaryData({...salaryData, amount: e.target.value})} /><select className="w-full border rounded px-3 py-2 mb-3" value={salaryData.month} onChange={e => setSalaryData({...salaryData, month: parseInt(e.target.value)})}>{months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}</select><select className="w-full border rounded px-3 py-2 mb-4" value={salaryData.year} onChange={e => setSalaryData({...salaryData, year: parseInt(e.target.value)})}>{years.map(y => <option key={y}>{y}</option>)}</select><div className="flex justify-end gap-3"><button onClick={() => setShowAddSalary(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={saveSalary} className="px-4 py-2 bg-green-500 text-white rounded">{t('admin.common.save')}</button></div></div></div>)}

      {showAddTransaction && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.accounting.addTransaction')}</h2><select className="w-full border rounded px-3 py-2 mb-3" value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})}><option value="expense">{t('admin.accounting.expenses')}</option><option value="income">{t('admin.accounting.income')}</option></select><input type="number" placeholder={t('admin.salaries.amount')} className="w-full border rounded px-3 py-2 mb-3" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} /><input type="text" placeholder={t('admin.accounting.description')} className="w-full border rounded px-3 py-2 mb-3" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} /><input type="text" placeholder={t('admin.accounting.category')} className="w-full border rounded px-3 py-2 mb-4" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})} /><div className="flex justify-end gap-3"><button onClick={() => setShowAddTransaction(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={async (e) => { e.preventDefault(); await addTransaction({...newTransaction, amount: parseFloat(newTransaction.amount)}); toast.success(t('admin.common.success')); setShowAddTransaction(false); loadAccountingData(); }} className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.common.save')}</button></div></div></div>)}

      {/* Edit Item Modal */}
{/* Edit Item Modal - Add preparation time field */}
{showEditModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">{editingItem ? t('admin.common.edit') : t('admin.inventory.addPurchase')}</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }}>
        <input 
          type="text" 
          placeholder={t('admin.inventory.itemName')} 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.name} 
          onChange={e => setEditForm({...editForm, name: e.target.value})} 
          required 
        />
        
        <input 
          type="number" 
          placeholder={t('admin.inventory.price')} 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.price} 
          onChange={e => setEditForm({...editForm, price: e.target.value})} 
          required 
        />
        
        <input 
          type="text" 
          placeholder={t('admin.inventory.unit')} 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.weight} 
          onChange={e => setEditForm({...editForm, weight: e.target.value})} 
          required 
        />
        
        <input 
          type="number" 
          placeholder="Weight in kg (for inventory)" 
          step="0.01" 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.weightInKg} 
          onChange={e => setEditForm({...editForm, weightInKg: e.target.value})} 
        />
        
        <select 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.linkedInventoryItem || ""} 
          onChange={e => setEditForm({...editForm, linkedInventoryItem: e.target.value})}
        >
          <option value="">-- No Inventory Link --</option>
          {Array.from(new Set(purchases.map(p => p.itemName))).map(item => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        
        {/* NEW: Preparation Time Field */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Preparation Time (minutes)</label>
          <input 
            type="number" 
            placeholder="Preparation time in minutes" 
            className="w-full border rounded px-3 py-2" 
            value={editForm.preparationTime || 5} 
            onChange={e => setEditForm({...editForm, preparationTime: e.target.value})}
            min="1"
            max="60"
            required
          />
          <p className="text-xs text-gray-500 mt-1">How long this item takes to prepare (will show countdown in kitchen)</p>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Item Image</label>
          <div className="flex items-center gap-4">
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />}
            <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">
              <Upload size={18} className="inline mr-2" />
              Upload Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>
        
        <input 
          type="text" 
          placeholder={t('admin.inventory.itemName')} 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.image} 
          onChange={e => setEditForm({...editForm, image: e.target.value})} 
        />
        
        <input 
          type="text" 
          placeholder="Includes (e.g., Fries + Drink)" 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.includes} 
          onChange={e => setEditForm({...editForm, includes: e.target.value})} 
        />
        
        <select 
          className="w-full border rounded px-3 py-2 mb-3" 
          value={editForm.category} 
          onChange={e => setEditForm({...editForm, category: e.target.value})}
        >
          <option value="shawarma">Shawarma</option>
          <option value="plates">Plates</option>
          <option value="sandwiches">Sandwiches</option>
          <option value="sides">Sides</option>
          <option value="drinks">Drinks</option>
        </select>
        
        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" checked={editForm.available} onChange={e => setEditForm({...editForm, available: e.target.checked})} />
          <span>Available for sale</span>
        </label>
        
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            {editingItem ? t('admin.common.update') : t('admin.common.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Order Details Modal for Reports */}
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
                <p className="text-gray-500 font-medium">Date & Time</p>
                <p className="font-semibold text-gray-800">{new Date(selectedReportOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Customer</p>
                <p className="font-semibold text-gray-800">{selectedReportOrder.customerName || 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Status</p>
                <p className="font-medium mt-1">
                  <span className={`px-2 py-1 rounded text-xs ${selectedReportOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedReportOrder.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Total Amount</p>
                <p className="font-bold text-lg text-green-600">₪{selectedReportOrder.total}</p>
              </div>
              <div className="col-span-2 border-t pt-2 mt-2">
                <p className="text-gray-500 font-medium">Timing Analysis</p>
                {(() => {
                  const expected = selectedReportOrder.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                  const actual = selectedReportOrder.completedAt 
                    ? (new Date(selectedReportOrder.completedAt) - new Date(selectedReportOrder.createdAt)) / (1000 * 60)
                    : (new Date() - new Date(selectedReportOrder.createdAt)) / (1000 * 60);
                  
                  const isDelayed = actual > expected;
                  
                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDelayed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isDelayed ? 'Delayed' : 'On Time'}
                      </span>
                      <span className="text-xs text-gray-600">
                        (Expected: {expected}m | Actual: {Math.round(actual)}m)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <h3 className="font-bold text-lg border-b pb-2 mb-4 text-gray-700">Order Items</h3>
            <div className="space-y-3 mb-6">
              {selectedReportOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 shadow-sm p-3 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-md text-sm font-bold">{item.quantity}x</span>
                    <div>
                      <p className="font-bold text-gray-800">{item.name}</p>
                      {item.includes && <p className="text-xs text-gray-500 mt-1">{item.includes}</p>}
                    </div>
                  </div>
                  <span className="font-bold text-gray-700">₪{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {(!selectedReportOrder.items || selectedReportOrder.items.length === 0) && (
                <p className="text-gray-500 text-center py-4">No items details available.</p>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <button onClick={() => setSelectedReportOrder(null)} className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;