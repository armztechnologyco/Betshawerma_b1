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
  Sandwich, Coffee, Droplet, Activity, Circle, CheckCircle2, Search
} from 'lucide-react';
import { getCurrentUser, logoutUser, getAllUsers, registerUser, USER_ROLES, updateUserActiveStatus } from '../../services/authService';
import {
  getDashboardStats, addTransaction, getTransactions,
  getFinancialSummary, recordSalary, updateOrderStatus,
  subscribeToKitchenOrders, addPurchase, subscribeToPurchases,
  getAllOrders, deletePurchase, updatePurchase
} from '../../services/firebaseService';
import {
  subscribeToMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../../services/menuService';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

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
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [showPurchaseFilter, setShowPurchaseFilter] = useState(false);

  // Inventory calculation state
  const [inventoryData, setInventoryData] = useState({
    totalPurchased: 0,
    totalConsumed: 0,
    remainingStock: 0,
    details: {}
  });

  // Inventory categories state
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
  const [lastRefresh, setLastRefresh] = useState(Date.now());

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
    loadSalaries();
  }, []);

  useEffect(() => {
    if (activeTab === 'accounting') loadAccountingData();
    if (activeTab === 'kitchen' || activeTab === 'overview') {
      const unsubscribe = subscribeToKitchenOrders(setKitchenOrders);
      return () => unsubscribe();
    }
    if (activeTab === 'purchases' || activeTab === 'overview') {
      const unsubscribe = subscribeToPurchases(setPurchases);
      return () => unsubscribe();
    }
    if (activeTab === 'reports') {
      generateReport();
    }
  }, [activeTab, selectedMonth, selectedYear, purchases]);

  useEffect(() => {
    calculateInventory();
  }, [purchases, kitchenOrders]);

  // Subscribe to menu changes
  useEffect(() => {
    const unsubscribe = subscribeToMenu((data) => {
      if (data && Object.keys(data).length > 0) {
        setMenuItems(data);
      }
    });

    // Real-time inventory categories
    const qCats = query(collection(db, 'inventory_categories'), orderBy('name', 'asc'));
    const unsubscribeCats = onSnapshot(qCats, (snapshot) => {
      setInventoryCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeCats();
    };
  }, []);

  // Update active status periodically
  useEffect(() => {
    if (user?.uid) {
      updateUserActiveStatus(user.uid);
      const interval = setInterval(() => updateUserActiveStatus(user.uid), 60000); // every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // Real-time users listener
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'kitchen' || activeTab === 'overview') {
      // Auto-start pending orders and initialize timers
      const timers = {};
      kitchenOrders.forEach(order => {
        // 1. Auto-move pending to preparing
        if (order.status === 'pending') {
          updateOrderStatus(order.id, 'preparing');
          return; // The status update will trigger a re-run
        }

        // 2. Initialize timers for preparing orders
        if (order.status === 'preparing' && !orderTimers[order.id]) {
          const totalTime = order.items?.reduce((total, item) => {
            return total + ((item.preparationTime || 5) * item.quantity);
          }, 0) || 5;

          // Use createdAt if available, otherwise fallback to now
          const orderStart = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
          const elapsedSeconds = Math.floor((Date.now() - orderStart) / 1000);
          const totalSeconds = totalTime * 60;

          timers[order.id] = {
            totalTime: totalTime,
            remainingTime: Math.max(0, totalSeconds - elapsedSeconds),
            startTime: orderStart
          };
        }
      });

      if (Object.keys(timers).length > 0) {
        setOrderTimers(prev => ({ ...prev, ...timers }));
      }
    }
  }, [kitchenOrders, activeTab]);

  // Refresh component every minute to update "Time Elapsed" and "Delayed" statuses
  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Add countdown update effect
  useEffect(() => {
    if (activeTab === 'kitchen' || activeTab === 'overview') {
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
    toast.success(t('admin.common.success'));
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


  const loadSalaries = () => {
    const savedSalaries = localStorage.getItem('salaries');
    if (savedSalaries) setSalaries(JSON.parse(savedSalaries));
    else setSalaries([]);
  };

  // Calculate inventory based on purchases and orders
  const calculateInventory = async () => {
    // Get all orders from Firestore instead of localStorage
    let allOrders = [];
    try {
      allOrders = await getAllOrders();
    } catch (error) {
      console.error("Failed to fetch orders for inventory:", error);
      allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    }

    const purchasedByItem = {};
    const consumedByItem = {};
    const consumptionLog = {}; // Track details: { 'Meat': [{ orderId, date, itemName, quantity, consumedKg }, ...] }
    const displayNames = {}; // Map to keep original casing for display

    purchases.forEach(purchase => {
      const originalName = purchase.itemName;
      const itemKey = originalName?.trim().toLowerCase();
      if (!itemKey) return;

      displayNames[itemKey] = originalName;
      purchasedByItem[itemKey] = (purchasedByItem[itemKey] || 0) + purchase.quantity;
    });

    allOrders.forEach(order => {
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
            consumptionLog[inventoryKey] = [];
          }
          consumedByItem[inventoryKey] += consumedKg;
          consumptionLog[inventoryKey].push({
            orderNumber: order.orderNumber,
            orderId: order.id,
            date: order.createdAt,
            menuItemName: item.name,
            itemQuantity: item.quantity,
            consumedAmount: consumedKg
          });
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
        remaining: remaining,
        unit: purchases.find(p => p.itemName === item)?.unit || 'kg',
        history: consumptionLog[item] || []
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

  const savePurchase = async () => {
    if (!purchaseForm.itemName || !purchaseForm.quantity || !purchaseForm.price) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const pData = {
        itemName: purchaseForm.itemName,
        quantity: parseFloat(purchaseForm.quantity),
        unit: purchaseForm.unit,
        price: parseFloat(purchaseForm.price),
        totalCost: parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.price),
        supplier: purchaseForm.supplier,
        date: editingPurchase ? editingPurchase.date : new Date().toISOString()
      };

      if (editingPurchase) {
        await updatePurchase(editingPurchase.id, pData);
        toast.success(t('admin.common.success'));
      } else {
        await addPurchase(pData);
        toast.success(t('admin.common.success'));
      }

      setShowAddPurchase(false);
      setEditingPurchase(null);
      setPurchaseForm({ itemName: '', quantity: '', unit: 'kg', price: '', supplier: '' });
      loadAccountingData();
    } catch (error) {
      toast.error('Operation failed');
      console.error(error);
    }
  };

  const handleEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setPurchaseForm({
      itemName: purchase.itemName,
      quantity: purchase.quantity,
      unit: purchase.unit,
      price: purchase.price,
      supplier: purchase.supplier || ''
    });
    setShowAddPurchase(true);
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (window.confirm(t('admin.common.confirmDelete'))) {
      try {
        await deletePurchase(purchaseId);
        toast.success(t('admin.common.success'));
      } catch (error) {
        toast.error(t('admin.common.failed'));
      }
    }
  };

  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Prepare headers and rows
    const headers = Object.keys(data[0]).filter(k => k !== 'id').join(',');
    const rows = data.map(obj => {
      return Object.entries(obj)
        .filter(([key]) => key !== 'id')
        .map(([_, val]) => {
          const stringVal = typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',');
    }).join('\n');

    const csvContent = "\uFEFF" + headers + "\n" + rows; // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveSalary = () => {
    if (!salaryData.employeeName || !salaryData.amount) {
      toast.error('Please fill all fields');
      return;
    }

    let updatedSalaries;
    if (salaryData.id) {
      // Edit existing
      updatedSalaries = salaries.map(s => 
        s.id === salaryData.id ? { ...salaryData, amount: parseFloat(salaryData.amount), month: salaryData.month, year: salaryData.year } : s
      );
      toast.success('Salary updated successfully');
    } else {
      // Add new
      const newSalary = {
        id: Date.now(),
        ...salaryData,
        amount: parseFloat(salaryData.amount),
        date: new Date().toISOString(),
        month: salaryData.month,
        year: salaryData.year
      };
      updatedSalaries = [...salaries, newSalary];
      toast.success('Salary recorded successfully');
    }

    setSalaries(updatedSalaries);
    localStorage.setItem('salaries', JSON.stringify(updatedSalaries));

    setShowAddSalary(false);
    setSalaryData({ employeeName: '', amount: '', month: selectedMonth, year: selectedYear });
  };

  const handleEditSalary = (salary) => {
    setSalaryData(salary);
    setShowAddSalary(true);
  };

  const handleDeleteSalary = (id) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      const updatedSalaries = salaries.filter(s => s.id !== id);
      setSalaries(updatedSalaries);
      localStorage.setItem('salaries', JSON.stringify(updatedSalaries));
      toast.success('Salary deleted successfully');
    }
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
      name: '', price: '', foreignerPrice: '', weight: '', weightInKg: '',
      linkedInventoryItem: '',
      preparationTime: 5,
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
      foreignerPrice: item.foreignerPrice || '',
      weight: item.weight,
      weightInKg: item.weightInKg || '',
      linkedInventoryItem: item.linkedInventoryItem || '',
      preparationTime: item.preparationTime || 5,
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
      foreignerPrice: editForm.foreignerPrice ? parseFloat(editForm.foreignerPrice) : null,
      weight: editForm.weight,
      weightInKg: parseFloat(editForm.weightInKg) || 0,
      linkedInventoryItem: editForm.linkedInventoryItem || '',
      preparationTime: parseInt(editForm.preparationTime) || 5,
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
              <span className="text-white">{t('admin.overview.welcome')}, {user?.name}</span>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div
              onClick={() => setActiveTab('accounting')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-green-500 cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-green-600 transition-colors">{t('admin.overview.totalSales')}</h3>
                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors"><TrendingUp className="text-green-500" size={20} /></div>
              </div>
              <p className="text-3xl font-black text-gray-900">${stats.todayRevenue || 0}</p>
            </div>

            <div
              onClick={() => setActiveTab('reports')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-blue-500 cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-blue-600 transition-colors">{t('admin.overview.totalOrders')}</h3>
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><ShoppingBag className="text-blue-500" size={20} /></div>
              </div>
              <p className="text-3xl font-black text-gray-900">{stats.totalOrdersToday || 0}</p>
            </div>

            <div
              onClick={() => setActiveTab('kitchen')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-orange-500 cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-orange-600 transition-colors">{t('admin.overview.pendingOrders')}</h3>
                <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors"><Clock className="text-orange-500" size={20} /></div>
              </div>
              <p className="text-3xl font-black text-gray-900">{(stats.pendingOrders || 0) + (stats.preparingOrders || 0)}</p>
            </div>

            <div
              onClick={() => setActiveTab('users')}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-purple-500 cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase group-hover:text-purple-600 transition-colors">{t('admin.overview.onlineStaff')}</h3>
                <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors"><Activity className="text-purple-500" size={20} /></div>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {users.filter(u => {
                  if (!u.lastActive) return false;
                  const lastActive = new Date(u.lastActive).getTime();
                  return (Date.now() - lastActive) < 300000; // 5 minutes
                }).length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Order Monitor */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  <h3 className="font-bold text-gray-800">{t('admin.overview.liveMonitor')}</h3>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.overview.realtime')}</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {kitchenOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic">{t('admin.overview.noActiveOrders')}</div>
                ) : (
                  kitchenOrders
                    .filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
                    .map(order => (
                      <div
                        key={order.id}
                        onClick={() => setActiveTab('kitchen')}
                        className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${order.status === 'ready' ? 'bg-green-100 text-green-600' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                            #{order.orderNumber}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{order.customerName || t('admin.overview.walkIn')}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className={`flex items-center gap-1 font-bold ${order.status === 'ready' ? 'text-green-500' :
                                order.status === 'preparing' ? 'text-blue-500' : 'text-orange-500'
                                }`}>
                                <Circle size={8} fill="currentColor" /> {order.status.toUpperCase()}
                              </span>
                              <span>•</span>
                              <span>{order.items?.length || 0} {t('admin.overview.items')}</span>
                              {(() => {
                                const expected = order.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                                const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                                if (elapsed > expected && order.status !== 'ready') {
                                  return (
                                    <>
                                      <span>•</span>
                                      <span className="text-red-500 font-bold animate-pulse">
                                        {t('reports.delayed')} (+{Math.round(elapsed - expected)}m)
                                      </span>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">${order.total}</p>
                          <p className="text-[10px] text-gray-400 font-bold">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {order.status === 'preparing' && orderTimers[order.id] && (
                            <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                              {formatTime(orderTimers[order.id].remainingTime)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Online Staff List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users size={18} className="text-purple-500" /> {t('admin.overview.onlineStaff')}
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {users.map(u => {
                  const isOnline = u.lastActive && (Date.now() - new Date(u.lastActive).getTime()) < 300000;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setActiveTab('users')}
                      className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {isOnline && (
                            <div className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{u.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isOnline ? (
                          <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full uppercase">{t('admin.overview.online')}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">
                            {u.lastActive ? new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('admin.overview.offline')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                      <p className="text-green-600 font-bold">${item.price}</p>
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
                  {cart.map(item => (<div key={item.id} className="flex justify-between items-center mb-3"><div><p className="font-semibold">{item.name}</p><p className="text-sm">${item.price} each</p></div><div className="flex items-center gap-2"><button onClick={() => updateQuantity(item.id, -1)} className="bg-gray-200 px-2 rounded">-</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="bg-gray-200 px-2 rounded">+</button><button onClick={() => removeFromCart(item.id)} className="text-red-500">×</button></div></div>))}
                </div>
                <div className="flex justify-between text-xl font-bold mb-4"><span>Total:</span><span>${calculateTotal()}</span></div>
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
                        <p className="text-green-600 font-bold text-lg mt-1">${item.price}</p>
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
                        <p className="text-sm text-gray-600">${item.price} each</p>
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
                <span>${calculateTotal()}</span>
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
                    <td className="px-6 py-4">${item.price}</td>
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
            {kitchenOrders.map(order => (<div key={order.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500"><h3 className="text-xl font-bold">Order #{order.orderNumber}</h3><p className="text-gray-600">{order.customerName}</p><div className="border-t py-2 my-2">{order.items?.map((item, i) => (<div key={i} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>${item.price * item.quantity}</span></div>))}</div><div className="flex justify-between"><span className="font-bold">Total: ${order.total}</span><button onClick={() => updateOrderStatus(order.id, 'ready')} className="bg-green-500 text-white px-4 py-2 rounded">Mark Ready</button></div></div>))}
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
                  <span className={`px-2 py-1 rounded text-xs ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status}
                  </span>
                  {(() => {
                    const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
                    if (elapsed > totalPrepTime && order.status !== 'ready') {
                      return (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black animate-pulse flex items-center gap-1 border border-red-200">
                          <AlertCircle size={12} /> {t('reports.delayed')} (+{Math.round(elapsed - totalPrepTime)}m)
                        </span>
                      );
                    }
                    return null;
                  })()}
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
                      <span className="font-bold">${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold">Total: ${order.total}</span>
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


      {/* INVENTORY / PURCHASES TAB */}
      {activeTab === 'purchases' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">{t('admin.inventory.title')}</h2>
              <p className="text-gray-500 mt-1">Monitor stock levels and manage ingredient purchases</p>
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
                <h3 className="text-gray-900 font-bold text-lg">No Inventory Data</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">Start adding ingredient purchases to track your real-time stock levels automatically.</p>
                <button
                  onClick={() => setShowAddPurchase(true)}
                  className="mt-6 text-orange-600 font-bold hover:underline"
                >
                  Add your first purchase →
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
                  onClick={() => handleExportCSV(purchases, 'Purchases_Report')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>

            {showPurchaseFilter && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top duration-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by item name or supplier..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                  />
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
                      p.itemName.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
                      (p.supplier && p.supplier.toLowerCase().includes(purchaseSearch.toLowerCase()))
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${p.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600 font-black text-sm">${p.totalCost}</span>
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
                No purchase records found
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
                <input type="text" placeholder="Search employee..." className="w-full border rounded-lg px-3 py-2" value={salaryFilter.employeeName} onChange={(e) => setSalaryFilter({ ...salaryFilter, employeeName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.salaries.month')}</label>
                <select className="w-full border rounded-lg px-3 py-2" value={salaryFilter.month} onChange={(e) => setSalaryFilter({ ...salaryFilter, month: e.target.value })}>
                  <option value="all">All Months</option>
                  {months.map((month, i) => (<option key={i} value={i + 1}>{month}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.salaries.year')}</label>
                <select className="w-full border rounded-lg px-3 py-2" value={salaryFilter.year} onChange={(e) => setSalaryFilter({ ...salaryFilter, year: e.target.value })}>
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
                ${salaries.filter(s => {
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
                ${(() => {
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
            <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3">Employee</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Month</th><th className="px-6 py-3">Year</th><th className="px-6 py-3">Date Paid</th><th className="px-6 py-3">Actions</th></tr></thead>
              <tbody>{salaries.filter(s => {
                if (salaryFilter.employeeName && !s.employeeName.toLowerCase().includes(salaryFilter.employeeName.toLowerCase())) return false;
                if (salaryFilter.month !== 'all' && s.month !== parseInt(salaryFilter.month)) return false;
                if (salaryFilter.year !== 'all' && s.year !== parseInt(salaryFilter.year)) return false;
                return true;
              }).map(s => (<tr key={s.id} className="border-t"><td className="px-6 py-4 font-medium">{s.employeeName}</td><td className="px-6 py-4 font-bold text-green-600">${s.amount}</td><td className="px-6 py-4">{months[s.month - 1]}</td><td className="px-6 py-4">{s.year}</td><td className="px-6 py-4">{new Date(s.date).toLocaleDateString()}</td><td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => handleEditSalary(s)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button><button onClick={() => handleDeleteSalary(s.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button></div></td></tr>))}</tbody>
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
              <div><label className="block text-sm font-medium mb-1">{t('admin.reports.fromDate')}</label><input type="date" value={reportFilter.fromDate} onChange={(e) => setReportFilter({ ...reportFilter, fromDate: e.target.value })} className="w-full border rounded px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('admin.reports.toDate')}</label><input type="date" value={reportFilter.toDate} onChange={(e) => setReportFilter({ ...reportFilter, toDate: e.target.value })} className="w-full border rounded px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">{t('admin.reports.status')}</label><select value={reportFilter.status} onChange={(e) => setReportFilter({ ...reportFilter, status: e.target.value })} className="w-full border rounded px-3 py-2"><option value="all">{t('admin.reports.all')}</option><option value="pending">{t('reports.statusPending')}</option><option value="preparing">{t('reports.statusPreparing')}</option><option value="ready">{t('reports.statusReady')}</option><option value="completed">{t('reports.statusCompleted')}</option></select></div>
              <div className="flex items-end"><button onClick={generateReport} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center gap-2"><Filter size={18} /> {t('admin.reports.generate')}</button></div>
            </div>
          </div>
          {showReport && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-bold">Order Report</h3>
                <button
                  onClick={() => handleExportCSV(reportData, 'Order_Report')}
                  className="text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
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
                      <td className="px-6 py-4 font-bold">${order.total}</td>
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
            <div className="bg-white rounded-lg p-6"><h3>{t('admin.accounting.income')}</h3><p className="text-3xl font-bold text-green-600">${summary.totalIncome}</p></div>
            <div className="bg-white rounded-lg p-6"><h3>{t('admin.accounting.expenses')}</h3><p className="text-3xl font-bold text-red-600">${summary.totalExpense}</p></div>
            <div className="bg-white rounded-lg p-6"><h3>{t('admin.accounting.profit')}</h3><p className="text-3xl font-bold text-blue-600">${summary.profit}</p></div>
          </div>
          <div className="flex gap-4 mb-6">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="border rounded px-3 py-2">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
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
                    <td className="px-6 py-4 text-right font-bold">${t.amount}</td>
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
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-800' :
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
      {showAddUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.users.addNew')}</h2><form onSubmit={handleAddUserSubmit}><input type="text" placeholder={t('admin.users.fullName')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} required /><input type="email" placeholder={t('admin.users.email')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} required /><input type="password" placeholder={t('admin.users.password')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} required /><select className="w-full border rounded px-3 py-2 mb-3" value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}><option value={USER_ROLES.ADMIN}>Admin</option><option value={USER_ROLES.CASHIER}>Cashier</option><option value={USER_ROLES.CHEF}>Chef</option></select><div className="grid grid-cols-2 gap-3 mb-3"><input type="time" placeholder={t('admin.users.shiftStart')} className="border rounded px-3 py-2" value={newUserData.shiftStart} onChange={e => setNewUserData({ ...newUserData, shiftStart: e.target.value })} /><input type="time" placeholder={t('admin.users.shiftEnd')} className="border rounded px-3 py-2" value={newUserData.shiftEnd} onChange={e => setNewUserData({ ...newUserData, shiftEnd: e.target.value })} /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-500 text-white rounded">{submitting ? t('admin.users.creating') : t('admin.users.createUser')}</button></div></form></div></div>)}

      {showEditUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.users.edit')}</h2><form onSubmit={handleUpdateUser}><input type="text" placeholder={t('admin.users.fullName')} className="w-full border rounded px-3 py-2 mb-3" value={editUserData.name} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} required /><select className="w-full border rounded px-3 py-2 mb-3" value={editUserData.role} onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}><option value={USER_ROLES.ADMIN}>Admin</option><option value={USER_ROLES.CASHIER}>Cashier</option><option value={USER_ROLES.CHEF}>Chef</option></select><div className="grid grid-cols-2 gap-3 mb-3"><input type="time" className="border rounded px-3 py-2" value={editUserData.shiftStart} onChange={e => setEditUserData({ ...editUserData, shiftStart: e.target.value })} /><input type="time" className="border rounded px-3 py-2" value={editUserData.shiftEnd} onChange={e => setEditUserData({ ...editUserData, shiftEnd: e.target.value })} /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowEditUser(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.common.update')}</button></div></form></div></div>)}

      {showAddPurchase && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.inventory.addPurchase')}</h2><input type="text" placeholder={t('admin.inventory.itemName')} className="w-full border rounded px-3 py-2 mb-3" value={purchaseForm.itemName} onChange={e => setPurchaseForm({ ...purchaseForm, itemName: e.target.value })} /><input type="number" placeholder={t('admin.inventory.quantity')} className="w-full border rounded px-3 py-2 mb-3" value={purchaseForm.quantity} onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} /><input type="number" placeholder={t('admin.inventory.price')} className="w-full border rounded px-3 py-2 mb-3" value={purchaseForm.price} onChange={e => setPurchaseForm({ ...purchaseForm, price: e.target.value })} /><input type="text" placeholder={t('admin.inventory.supplier')} className="w-full border rounded px-3 py-2 mb-4" value={purchaseForm.supplier} onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} /><div className="flex justify-end gap-3"><button onClick={() => setShowAddPurchase(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={savePurchase} className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.inventory.addPurchase')}</button></div></div></div>)}

      {showAddSalary && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{salaryData.id ? t('admin.salaries.editSalary', 'Edit Salary') : t('admin.salaries.addSalary')}</h2><input type="text" placeholder={t('admin.salaries.employeeName')} className="w-full border rounded px-3 py-2 mb-3" value={salaryData.employeeName} onChange={e => setSalaryData({ ...salaryData, employeeName: e.target.value })} /><input type="number" placeholder={t('admin.salaries.amount')} className="w-full border rounded px-3 py-2 mb-3" value={salaryData.amount} onChange={e => setSalaryData({ ...salaryData, amount: e.target.value })} /><select className="w-full border rounded px-3 py-2 mb-3" value={salaryData.month} onChange={e => setSalaryData({ ...salaryData, month: parseInt(e.target.value) })}>{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select><select className="w-full border rounded px-3 py-2 mb-4" value={salaryData.year} onChange={e => setSalaryData({ ...salaryData, year: parseInt(e.target.value) })}>{years.map(y => <option key={y}>{y}</option>)}</select><div className="flex justify-end gap-3"><button onClick={() => { setShowAddSalary(false); setSalaryData({ employeeName: '', amount: '', month: selectedMonth, year: selectedYear }); }} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={saveSalary} className="px-4 py-2 bg-green-500 text-white rounded">{t('admin.common.save')}</button></div></div></div>)}

      {showAddTransaction && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.accounting.addTransaction')}</h2><select className="w-full border rounded px-3 py-2 mb-3" value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}><option value="expense">{t('admin.accounting.expenses')}</option><option value="income">{t('admin.accounting.income')}</option></select><input type="number" placeholder={t('admin.salaries.amount')} className="w-full border rounded px-3 py-2 mb-3" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} /><input type="text" placeholder={t('admin.accounting.description')} className="w-full border rounded px-3 py-2 mb-3" value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} /><input type="text" placeholder={t('admin.accounting.category')} className="w-full border rounded px-3 py-2 mb-4" value={newTransaction.category} onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })} /><div className="flex justify-end gap-3"><button onClick={() => setShowAddTransaction(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={async (e) => { e.preventDefault(); await addTransaction({ ...newTransaction, amount: parseFloat(newTransaction.amount) }); toast.success(t('admin.common.success')); setShowAddTransaction(false); loadAccountingData(); }} className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.common.save')}</button></div></div></div>)}

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
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">🇪🇬 Egyptian Price ($) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="e.g., 140"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">🌍 Foreigner Price ($) <span className="text-gray-400 font-normal text-xs">(leave blank to use same price)</span></label>
                <input
                  type="number"
                  placeholder="e.g., 250"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.foreignerPrice}
                  onChange={e => setEditForm({ ...editForm, foreignerPrice: e.target.value })}
                />
              </div>

              <input
                type="text"
                placeholder={t('admin.inventory.unit')}
                className="w-full border rounded px-3 py-2 mb-3"
                value={editForm.weight}
                onChange={e => {
                  const val = e.target.value;
                  let updatedForm = { ...editForm, weight: val };
                  const numMatch = val.match(/[\d.]+/);
                  if (numMatch) {
                    const num = parseFloat(numMatch[0]);
                    if (!isNaN(num)) {
                      // If it contains "kg" or "كيلو", assume kg, otherwise assume grams and divide by 1000
                      const isKg = val.toLowerCase().includes('kg') || val.includes('كيلو');
                      updatedForm.weightInKg = isKg ? num : num / 1000;
                    }
                  } else if (val === '') {
                    updatedForm.weightInKg = '';
                  }
                  setEditForm(updatedForm);
                }}
                required
              />

              <input
                type="number"
                placeholder={t('menu_edit.weight_kg')}
                step="0.01"
                className="w-full border rounded px-3 py-2 mb-3"
                value={editForm.weightInKg}
                onChange={e => setEditForm({ ...editForm, weightInKg: e.target.value })}
              />

              <select
                className="w-full border rounded px-3 py-2 mb-3"
                value={editForm.linkedInventoryItem || ""}
                onChange={e => setEditForm({ ...editForm, linkedInventoryItem: e.target.value })}
              >
                <option value="">{t('menu_edit.no_inventory_link')}</option>
                {Array.from(new Set(purchases.map(p => p.itemName))).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              {/* NEW: Preparation Time Field */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">{t('menu_edit.prep_time')}</label>
                <input
                  type="number"
                  placeholder={t('menu_edit.prep_time')}
                  className="w-full border rounded px-3 py-2"
                  value={editForm.preparationTime || 5}
                  onChange={e => setEditForm({ ...editForm, preparationTime: e.target.value })}
                  min="1"
                  max="60"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('menu_edit.prep_time_desc')}</p>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">{t('menu_edit.item_image')}</label>
                <div className="flex items-center gap-4">
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />}
                  <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">
                    <Upload size={18} className="inline mr-2" />
                    {t('menu_edit.upload_image')}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <input
                type="text"
                placeholder={t('admin.inventory.itemName')}
                className="w-full border rounded px-3 py-2 mb-3"
                value={editForm.image}
                onChange={e => setEditForm({ ...editForm, image: e.target.value })}
              />

              <input
                type="text"
                placeholder={t('menu_edit.includes')}
                className="w-full border rounded px-3 py-2 mb-3"
                value={editForm.includes}
                onChange={e => setEditForm({ ...editForm, includes: e.target.value })}
              />

              <select
                className="w-full border rounded px-3 py-2 mb-3"
                value={editForm.category}
                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
              >
                <option value="shawarma">{t('cashier.categories.shawarma')}</option>
                <option value="plates">{t('cashier.categories.plates')}</option>
                <option value="sandwiches">{t('cashier.categories.sandwiches')}</option>
                <option value="sides">{t('cashier.categories.sides')}</option>
                <option value="drinks">{t('cashier.categories.drinks')}</option>
              </select>

              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={editForm.available} onChange={e => setEditForm({ ...editForm, available: e.target.checked })} />
                <span>{t('menu_edit.available_for_sale')}</span>
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
                <p className="text-gray-500 font-medium">{t('admin.inventory.date')} & {t('shiftTimer.shift')}</p>
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
                <p className="text-gray-500 font-medium">{t('cashier.total')}</p>
                <p className="font-bold text-lg text-green-600">${selectedReportOrder.total}</p>
              </div>
              <div className="col-span-2 border-t pt-2 mt-2">
                <p className="text-gray-500 font-medium">{t('reports.timing_analysis')}</p>
                {(() => {
                  const expected = selectedReportOrder.items?.reduce((total, item) => total + ((item.preparationTime || 5) * item.quantity), 0) || 5;
                  const actual = selectedReportOrder.completedAt
                    ? (new Date(selectedReportOrder.completedAt) - new Date(selectedReportOrder.createdAt)) / (1000 * 60)
                    : (new Date() - new Date(selectedReportOrder.createdAt)) / (1000 * 60);

                  const isDelayed = actual > expected;

                  return (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDelayed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isDelayed ? t('reports.delayed') : t('reports.on_time')}
                      </span>
                      <span className="text-xs text-gray-600">
                        ({t('reports.expected')}: {expected}m | {t('reports.actual')}: {Math.round(actual)}m)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <h3 className="font-bold text-lg border-b pb-2 mb-4 text-gray-700">{t('reports.order_items')}</h3>
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
                  <span className="font-bold text-gray-700">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {(!selectedReportOrder.items || selectedReportOrder.items.length === 0) && (
                <p className="text-gray-500 text-center py-4">{t('reports.no_items')}</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button onClick={() => setSelectedReportOrder(null)} className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors">
                {t('reports.close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;