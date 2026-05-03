// Admin Dashboard Component
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
import ShiftTimer from '../Common/ShiftTimer';
import { getCurrentUser, logoutUser, getAllUsers, registerUser, USER_ROLES, updateUserActiveStatus } from '../../services/authService';
import {
  getDashboardStats, addTransaction, getTransactions, updateTransaction, deleteTransaction,
  getFinancialSummary, recordSalary, updateOrderStatus,
  subscribeToKitchenOrders, addPurchase, subscribeToPurchases,
  getAllOrders, deletePurchase, updatePurchase
} from '../../services/firebaseService';
import {
  subscribeToMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  subscribeToCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  subscribeToOptions,
  addOption,
  updateOption,
  deleteOption,
  uploadImage,
  deleteImage
} from '../../services/menuService';
import { db } from '../../firebase';
import i18n from '../../i18n';
import OverviewTab from './Tabs/OverviewTab';
import InventoryTab from './Tabs/InventoryTab';
import UsersTab from './Tabs/UsersTab';
import MenuTab from './Tabs/MenuTab';
import ReportsTab from './Tabs/ReportsTab';
import AccountingTab from './Tabs/AccountingTab';
import SalariesTab from './Tabs/SalariesTab';
import KitchenTab from './Tabs/KitchenTab';
import LanguageSwitcher from '../Common/LanguageSwitcher';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { formatTime, getProgressPercentage, formatShiftTime, months, years } from '../../utils/formatters';
import { handleExportCSV } from '../../utils/exportUtils';
import { useMemo, useCallback } from 'react';

function AdminDashboard({ user, initialTab = 'overview' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();


  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orderTimers, setOrderTimers] = useState({});

  // Menu management state
  const [menuItems, setMenuItems] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [availableOptions, setAvailableOptions] = useState([]);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);

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
  const [allOrders, setAllOrders] = useState([]);

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

  // Today Overview modals state
  const [showTodayItemsModal, setShowTodayItemsModal] = useState(false);
  const [showTodayOrdersModal, setShowTodayOrdersModal] = useState(false);



  // Purchases/Inventory state
  const [purchases, setPurchases] = useState([]);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ itemName: '', quantity: '', unit: 'kg', price: '', supplier: '' });
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [showPurchaseFilter, setShowPurchaseFilter] = useState(false);

  // Memoized inventory calculation
  const inventoryData = useMemo(() => {
    if (!allOrders.length && !purchases.length) return {
      totalPurchased: 0,
      totalConsumed: 0,
      remainingStock: 0,
      details: {}
    };

    const purchasedByItem = {};
    const consumedByItem = {};
    const consumptionLog = {};
    const displayNames = {};

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

    return {
      totalPurchased: totalPurchased,
      totalConsumed: totalConsumed,
      remainingStock: totalPurchased - totalConsumed,
      details: details
    };
  }, [allOrders, purchases]);

  // Inventory categories state
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Salaries state
  const [salaries, setSalaries] = useState([]);
  const [editingSalary, setEditingSalary] = useState(null);

  // Reports state
  const [reportData, setReportData] = useState([]);
  const [reportFilter, setReportFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return { fromDate: today, toDate: today, status: 'all', cashierName: 'all' };
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

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) { console.error(error); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) { console.error(error); }
  }, []);

  const loadAccountingData = useCallback(async () => {
    try {
      const [tx, sum] = await Promise.all([getTransactions(), getFinancialSummary(selectedMonth, selectedYear)]);
      setTransactions(tx || []);
      setSummary(sum || { totalIncome: 0, totalExpense: 0, profit: 0 });
    } catch (error) { console.error(error); }
  }, [selectedMonth, selectedYear]);

  const loadSalaries = useCallback(async () => {
    try {
      const allTx = await getTransactions();
      const salaryTx = allTx.filter(tx => tx.category === 'salary');
      setSalaries(salaryTx);
    } catch (error) {
      console.error('Error loading salaries:', error);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      if (user?.role === USER_ROLES.ADMIN) {
        await Promise.all([fetchUsers(), fetchStats(), loadAccountingData()]);
      }
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user, fetchUsers, fetchStats, loadAccountingData]);

  const generateReport = useCallback(async () => {
    if (!reportFilter.fromDate || !reportFilter.toDate) {
      toast.error(t('admin.reports.selectDateRange'));
      return;
    }

    const ordersRef = collection(db, 'orders');
    let q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    orders = orders.filter(order => order.createdAt >= reportFilter.fromDate && order.createdAt <= reportFilter.toDate);
    if (reportFilter.status !== 'all') orders = orders.filter(order => order.status === reportFilter.status);
    if (reportFilter.cashierName !== 'all') orders = orders.filter(order => order.cashierName === reportFilter.cashierName);

    setReportData(orders);
    setShowReport(true);
  }, [reportFilter, t]);




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



  // Subscribe to ALL orders for inventory and reports
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to menu changes
  useEffect(() => {
    const unsubscribeMenu = subscribeToMenu((data) => {
      if (data && Object.keys(data).length > 0) {
        setMenuItems(data);
      }
    });



    // Real-time options subscription
    const unsubscribeOptions = subscribeToOptions((data) => {
      setAvailableOptions(data);
    });

    // Real-time categories subscription
    const unsubscribeCats = subscribeToCategories((data) => {
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    });

    // Real-time inventory categories
    const qInvCats = query(collection(db, 'inventory_categories'), orderBy('name', 'asc'));
    const unsubscribeInvCats = onSnapshot(qInvCats, (snapshot) => {
      setInventoryCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeMenu();
      unsubscribeOptions();
      unsubscribeCats();
      unsubscribeInvCats();
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
  const startPreparation = useCallback((orderId, items) => {
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
  }, [t]);








  const savePurchase = useCallback(async () => {
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
  }, [purchaseForm, editingPurchase, t]);

  const handleEditPurchase = useCallback((purchase) => {
    setEditingPurchase(purchase);
    setPurchaseForm({
      itemName: purchase.itemName,
      quantity: purchase.quantity,
      unit: purchase.unit,
      price: purchase.price,
      supplier: purchase.supplier || ''
    });
    setShowAddPurchase(true);
  }, []);

  const handleDeletePurchase = useCallback(async (purchaseId) => {
    if (window.confirm(t('admin.common.confirmDelete'))) {
      try {
        await deletePurchase(purchaseId);
        toast.success(t('admin.common.success'));
      } catch (error) {
        toast.error(t('admin.common.failed'));
      }
    }
  }, [t]);



  const saveSalary = useCallback(async () => {
    if (!salaryData.employeeName || !salaryData.amount) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (editingSalary) {
        await updateTransaction(editingSalary.id, {
          ...salaryData,
          amount: parseFloat(salaryData.amount),
          description: `Salary for ${salaryData.employeeName}`
        });
        toast.success('Salary updated successfully');
      } else {
        await recordSalary(salaryData.employeeName, parseFloat(salaryData.amount), salaryData.month, salaryData.year);
        toast.success('Salary recorded successfully');
      }

      setShowAddSalary(false);
      setEditingSalary(null);
      setSalaryData({ employeeName: '', amount: '', month: selectedMonth, year: selectedYear });
      loadSalaries();
      loadAccountingData();
    } catch (error) {
      toast.error('Operation failed');
    }
  }, [salaryData, editingSalary, selectedMonth, selectedYear, loadSalaries, loadAccountingData]);

  const handleEditSalary = useCallback((salary) => {
    setEditingSalary(salary);
    setSalaryData({
      employeeName: salary.employeeName,
      amount: salary.amount.toString(),
      month: salary.month,
      year: salary.year
    });
    setShowAddSalary(true);
  }, []);

  const handleDeleteSalary = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      try {
        await deleteTransaction(id);
        toast.success('Salary record deleted');
        loadSalaries();
        loadAccountingData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  }, [loadSalaries, loadAccountingData]);

  const clearSalaryFilters = useCallback(() => {
    setSalaryFilter({
      employeeName: '',
      month: 'all',
      year: 'all'
    });
  }, []);



  const handleLogout = useCallback(async () => {
    await logoutUser();
    navigate('/login');
    toast.success(t('shiftTimer.logoutSuccess'));
  }, [navigate, t]);

  // Menu CRUD Operations


  const handleAddItem = useCallback(() => {
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
  }, [selectedCategory]);



  const handleEditItem = useCallback((item) => {
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
  }, []);

  const handleDeleteItem = useCallback(async (item) => {
    if (window.confirm(`Delete ${item.name}?`)) {
      try {
        // Phase 1: Keep storage clean
        if (item.imagePath) {
          await deleteImage(item.imagePath);
        }
        await deleteMenuItem(item.id);
        toast.success(`${item.name} deleted`);
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      // Create local preview URL (doesn't save to DB yet)
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setEditForm({ ...editForm, imageFile: file });
    } else {
      toast.error('Invalid image file. Max 5MB');
    }
  };



  const handleSaveItem = useCallback(async () => {
    if (!editForm.name || !editForm.price || !editForm.weight) {
      toast.error(t('admin.common.requiredFields', { defaultValue: 'Please fill all required fields' }));
      return;
    }

    setSubmitting(true);
    let imageUrl = editingItem?.imageUrl || null;
    let imagePath = editingItem?.imagePath || null;

    try {
      // 1. Handle Image Upload if a new file was selected
      if (editForm.imageFile) {
        // Delete old image if it exists
        if (editingItem?.imagePath) {
          await deleteImage(editingItem.imagePath);
        }

        const uploadRes = await uploadImage(editingItem?.id || 'new', editForm.imageFile);
        if (uploadRes.success) {
          imageUrl = uploadRes.url;
          imagePath = uploadRes.path;
        } else {
          toast.error('Image upload failed, but saving item...');
        }
      }

      const itemData = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        foreignerPrice: editForm.foreignerPrice ? parseFloat(editForm.foreignerPrice) : null,
        weight: editForm.weight,
        weightInKg: parseFloat(editForm.weightInKg) || 0,
        linkedInventoryItem: editForm.linkedInventoryItem || '',
        preparationTime: parseInt(editForm.preparationTime) || 5,
        imageUrl: imageUrl, // Real URL
        imagePath: imagePath, // Storage Path
        image: imageUrl || '🍽️', // Fallback for legacy views
        basePrice: parseFloat(editForm.basePrice || editForm.price),
        includes: editForm.includes,
        category: editForm.category,
        available: editForm.available
      };

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
    } finally {
      setSubmitting(false);
    }
  }, [editForm, editingItem, t]);

  const toggleItemAvailability = useCallback(async (item) => {
    try {
      await updateMenuItem(item.id, {
        ...item,
        available: !item.available
      });
    } catch (error) {
      toast.error('Update failed');
    }
  }, []);



  // Cashier functions
  const addToCart = useCallback((item) => {
    const cartItem = { ...item, quantity: 1, options: [], totalPrice: item.price };
    setCart(prev => [...prev, cartItem]);
    toast.success(t('cashier.addedToCart', { name: item.name }));
  }, [t]);

  const updateQuantity = useCallback((itemId, change) => {
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item).filter(item => item.quantity > 0));
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success(t('cashier.removedFromCart'));
  }, [t]);

  const calculateTotal = useCallback(() => cart.reduce((total, item) => total + (item.price * item.quantity), 0), [cart]);

  const handleOrder = useCallback(async () => {
    if (!cart.length) return toast.error(t('cashier.cartEmpty'));
    setProcessing(true);
    try {
      const orderTotal = calculateTotal();
      const order = {
        items: cart,
        total: orderTotal,
        customerName: customerName || "Walk-in Customer",
        status: 'pending',
        orderNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), order);
      await addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount: orderTotal,
        description: `Order #${order.orderNumber}`,
        category: 'sales',
        createdAt: new Date().toISOString()
      });

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
  }, [cart, customerName, calculateTotal, t, fetchStats]);

  // User CRUD with shift times
  const handleAddUserSubmit = useCallback(async (e) => {
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
  }, [newUserData, user, fetchUsers]);

  const handleEditUserClick = useCallback((userToEdit) => {
    setSelectedUser(userToEdit);
    setEditUserData({
      name: userToEdit.name,
      role: userToEdit.role,
      shiftStart: formatShiftTime(userToEdit.shiftStart),
      shiftEnd: formatShiftTime(userToEdit.shiftEnd)
    });
    setShowEditUser(true);
  }, []);

  const handleUpdateUser = useCallback(async (e) => {
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
  }, [editUserData, selectedUser, fetchUsers]);

  const handleDeleteUser = useCallback(async (userId, userName) => {
    if (userId === user?.uid) return toast.error(t('admin.users.deleteSelfError'));
    if (window.confirm(`${t('admin.common.delete')} ${userName}?`)) {
      await deleteDoc(doc(db, 'users', userId));
      toast.success(t('admin.users.deleted', { name: userName }));
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // Report generation


  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center"><h1 className="text-white text-xl font-bold">{t('admin.dashboard')}</h1></div>
            <div className="flex items-center space-x-4">
              <ShiftTimer />
              <LanguageSwitcher />
              <span className="text-white hidden md:inline">{t('admin.overview.welcome')}, {user?.name}</span>
              <button onClick={handleLogout} className="bg-orange-700 text-white px-4 py-2 rounded-lg hover:bg-orange-800 transition-colors">{t('admin.logout')}</button>
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


      <div className="container mx-auto px-4 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            setActiveTab={setActiveTab}
            users={users}
            kitchenOrders={kitchenOrders}
            orderTimers={orderTimers}
            formatTime={formatTime}
            t={t}
            onSalesClick={() => setShowTodayItemsModal(true)}
            onOrdersClick={() => setShowTodayOrdersModal(true)}
          />
        )}

        {/* CASHIER TAB */}
        {activeTab === 'cashier' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {categories.map((cat) => {
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCashierActiveTab(cat.id)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${cashierActiveTab === cat.id ? (cat.color || 'bg-orange-500') + ' text-white' : 'bg-gray-200'}`}
                      >
                        {cat.name}
                        <span className="ml-1 text-xs">
                          ({menuItems[cat.id]?.filter(i => i.available).length || 0})
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
                      {t('cashier.noItems')} {user?.role === 'admin' && t('cashier.addFirstItem')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
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
          <MenuTab
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            menuItems={menuItems}
            availableOptions={availableOptions}
            handleAddItem={handleAddItem}
            handleEditItem={handleEditItem}
            handleDeleteItem={handleDeleteItem}
            toggleItemAvailability={toggleItemAvailability}
            setEditingCategory={setEditingCategory}
            setShowCategoryModal={setShowCategoryModal}
            setEditingOption={setEditingOption}
            setShowOptionModal={setShowOptionModal}
            deleteCategory={deleteCategory}
            deleteOption={deleteOption}
            addCategory={addCategory}
            toast={toast}
            t={t}
          />
        )}

        {/* Add / Edit Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editingCategory ? t('admin.common.edit') : t('cashier.add')}</h2>
                <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="text-gray-500 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const data = {
                    id: fd.get('id'),
                    name: fd.get('name'),
                    color: fd.get('color') || 'bg-blue-500',
                    order: parseInt(fd.get('order')) || 0
                  };
                  try {
                    if (editingCategory) {
                      await updateCategory(editingCategory.id, data);
                      toast.success('Category updated');
                    } else {
                      await addCategory(data);
                      toast.success('Category added');
                    }
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  } catch {
                    toast.error('Save failed');
                  }
                }}
              >
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-sm">Category ID (lowercase, e.g. grilled_chicken)</label>
                  <input name="id" required defaultValue={editingCategory?.id || ''} placeholder="grilled_chicken" readOnly={!!editingCategory}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100" />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-sm">Display Name</label>
                  <input name="name" required defaultValue={editingCategory?.name || ''} placeholder="Grilled Chicken"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-sm">Color (Tailwind class, e.g. bg-orange-500)</label>
                  <input name="color" defaultValue={editingCategory?.color || 'bg-blue-500'} placeholder="bg-orange-500"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="mb-6">
                  <label className="block font-semibold mb-1 text-sm">Display Order</label>
                  <input name="order" type="number" defaultValue={editingCategory?.order || 0}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
                    {editingCategory ? 'Update' : 'Add'}
                  </button>
                </div>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Delete category? Items in this category will become uncategorized.')) {
                        await deleteCategory(editingCategory.id);
                        setShowCategoryModal(false);
                        setEditingCategory(null);
                      }
                    }}
                    className="w-full mt-4 text-red-500 text-sm hover:underline"
                  >
                    Delete Category
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Add / Edit Option Modal */}
        {showOptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editingOption ? t('options.editOption') : t('options.addOption')}</h2>
                <button onClick={() => { setShowOptionModal(false); setEditingOption(null); }} className="text-gray-500 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const data = {
                    name: fd.get('name'),
                    icon: fd.get('icon') || '🛠️',
                  };
                  try {
                    if (editingOption) {
                      await updateOption(editingOption.id, data);
                      toast.success(t('options.updated'));
                    } else {
                      await addOption(data);
                      toast.success(t('options.added'));
                    }
                    setShowOptionModal(false);
                    setEditingOption(null);
                  } catch {
                    toast.error('Save failed');
                  }
                }}
              >
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-sm">{t('options.name')}</label>
                  <input name="name" required defaultValue={editingOption?.name || ''} placeholder={t('options.namePlaceholder')}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="mb-6">
                  <label className="block font-semibold mb-1 text-sm">{t('options.icon')}</label>
                  <input name="icon" defaultValue={editingOption?.icon || '🛠️'} placeholder="🛠️"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowOptionModal(false); setEditingOption(null); }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">{t('options.cancel')}</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
                    {editingOption ? t('options.update') : t('options.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* KITCHEN TAB */}
        {activeTab === 'kitchen' && (
          <KitchenTab
            kitchenOrders={kitchenOrders}
            orderTimers={orderTimers}
            startPreparation={startPreparation}
            updateOrderStatus={updateOrderStatus}
            formatTime={formatTime}
            getProgressPercentage={getProgressPercentage}
            t={t}
          />
        )}


        {/* INVENTORY / PURCHASES TAB */}
        {activeTab === 'purchases' && (
          <InventoryTab
            inventoryData={inventoryData}
            setSelectedInventoryItem={setSelectedInventoryItem}
            setShowAddPurchase={setShowAddPurchase}
            purchases={purchases}
            showPurchaseFilter={showPurchaseFilter}
            setShowPurchaseFilter={setShowPurchaseFilter}
            purchaseSearch={purchaseSearch}
            setPurchaseSearch={setPurchaseSearch}
            handleEditPurchase={handleEditPurchase}
            handleDeletePurchase={handleDeletePurchase}
            selectedInventoryItem={selectedInventoryItem}
            handleExportCSV={handleExportCSV}
            t={t}
          />
        )}


        {/* SALARIES TAB */}
        {activeTab === 'salaries' && (
          <SalariesTab
            salaries={salaries}
            salaryFilter={salaryFilter}
            setSalaryFilter={setSalaryFilter}
            months={months}
            years={years}
            clearSalaryFilters={() => setSalaryFilter({ employeeName: '', month: 'all', year: 'all' })}
            setShowAddSalary={setShowAddSalary}
            handleExportCSV={handleExportCSV}
            users={users}
            handleEditSalary={handleEditSalary}
            handleDeleteSalary={handleDeleteSalary}
            t={t}
          />
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <ReportsTab
            reportFilter={reportFilter}
            setReportFilter={setReportFilter}
            generateReport={generateReport}
            showReport={showReport}
            reportData={reportData}
            handleExportCSV={handleExportCSV}
            setSelectedReportOrder={setSelectedReportOrder}
            users={users}
            t={t}
          />
        )}

        {/* ACCOUNTING TAB */}
        {activeTab === 'accounting' && (
          <AccountingTab
            summary={summary}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            months={months}
            years={years}
            transactions={transactions}
            setShowAddTransaction={setShowAddTransaction}
            t={t}
            onOrderClick={async (description) => {
              const orderNum = description.split('#')[1]?.trim();
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
            }}
          />
        )}

        {/* USERS MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            setShowRegisterModal={setShowAddUser}
            handleEditUser={handleEditUserClick}
            handleDeleteUser={handleDeleteUser}
            t={t}
          />
        )}
      </div>

      {/* Modals */}
      {showAddUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.users.addNew')}</h2><form onSubmit={handleAddUserSubmit}><input type="text" placeholder={t('admin.users.fullName')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} required /><input type="email" placeholder={t('admin.users.email')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} required /><input type="password" placeholder={t('admin.users.password')} className="w-full border rounded px-3 py-2 mb-3" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} required /><select className="w-full border rounded px-3 py-2 mb-3" value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}><option value={USER_ROLES.ADMIN}>{t('admin.users.role_admin', { defaultValue: 'Admin' })}</option><option value={USER_ROLES.CASHIER}>{t('admin.users.role_cashier', { defaultValue: 'Cashier' })}</option><option value={USER_ROLES.CHEF}>{t('admin.users.role_chef', { defaultValue: 'Chef' })}</option></select><div className="grid grid-cols-2 gap-3 mb-3"><input type="time" placeholder={t('admin.users.shiftStart')} className="border rounded px-3 py-2" value={newUserData.shiftStart} onChange={e => setNewUserData({ ...newUserData, shiftStart: e.target.value })} /><input type="time" placeholder={t('admin.users.shiftEnd')} className="border rounded px-3 py-2" value={newUserData.shiftEnd} onChange={e => setNewUserData({ ...newUserData, shiftEnd: e.target.value })} /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-500 text-white rounded">{submitting ? t('admin.users.creating') : t('admin.users.createUser')}</button></div></form></div></div>)}

      {showEditUser && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{t('admin.users.edit')}</h2><form onSubmit={handleUpdateUser}><input type="text" placeholder={t('admin.users.fullName')} className="w-full border rounded px-3 py-2 mb-3" value={editUserData.name} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} required /><select className="w-full border rounded px-3 py-2 mb-3" value={editUserData.role} onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}><option value={USER_ROLES.ADMIN}>{t('admin.users.role_admin', { defaultValue: 'Admin' })}</option><option value={USER_ROLES.CASHIER}>{t('admin.users.role_cashier', { defaultValue: 'Cashier' })}</option><option value={USER_ROLES.CHEF}>{t('admin.users.role_chef', { defaultValue: 'Chef' })}</option></select><div className="grid grid-cols-2 gap-3 mb-3"><input type="time" className="border rounded px-3 py-2" value={editUserData.shiftStart} onChange={e => setEditUserData({ ...editUserData, shiftStart: e.target.value })} /><input type="time" className="border rounded px-3 py-2" value={editUserData.shiftEnd} onChange={e => setEditUserData({ ...editUserData, shiftEnd: e.target.value })} /></div><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowEditUser(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{t('admin.common.update')}</button></div></form></div></div>)}

      {showAddPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="text-orange-500" />
              {editingPurchase ? t('admin.common.edit') : t('admin.inventory.addPurchase')}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.inventory.itemName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Meat, Water Bottles"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  value={purchaseForm.itemName}
                  onChange={e => setPurchaseForm({ ...purchaseForm, itemName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.inventory.quantity')}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    value={purchaseForm.quantity}
                    onChange={e => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.inventory.unit')}</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all bg-white"
                    value={purchaseForm.unit}
                    onChange={e => setPurchaseForm({ ...purchaseForm, unit: e.target.value })}
                  >
                    <option value="kg">{t('units.kg')}</option>
                    <option value="bottle">{t('units.bottle')}</option>
                    <option value="piece">{t('units.piece')}</option>
                    <option value="liter">{t('units.liter')}</option>
                    <option value="pack">{t('units.pack')}</option>
                    <option value="box">{t('units.box')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.inventory.price')} ($)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    value={purchaseForm.price}
                    onChange={e => setPurchaseForm({ ...purchaseForm, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.inventory.supplier')}</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    value={purchaseForm.supplier}
                    onChange={e => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-800 font-medium">Total Cost:</span>
                  <span className="text-lg font-black text-orange-600">${(parseFloat(purchaseForm.quantity || 0) * parseFloat(purchaseForm.price || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddPurchase(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  onClick={savePurchase}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                >
                  {editingPurchase ? t('admin.common.update') : t('admin.inventory.addPurchase')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddSalary && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md w-full"><h2 className="text-2xl font-bold mb-4">{editingSalary ? 'Edit Salary' : t('admin.salaries.addSalary')}</h2><input type="text" placeholder={t('admin.salaries.employeeName')} className="w-full border rounded px-3 py-2 mb-3" value={salaryData.employeeName} onChange={e => setSalaryData({ ...salaryData, employeeName: e.target.value })} /><input type="number" placeholder={t('admin.salaries.amount')} className="w-full border rounded px-3 py-2 mb-3" value={salaryData.amount} onChange={e => setSalaryData({ ...salaryData, amount: e.target.value })} /><select className="w-full border rounded px-3 py-2 mb-3" value={salaryData.month} onChange={e => setSalaryData({ ...salaryData, month: parseInt(e.target.value) })}>{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select><select className="w-full border rounded px-3 py-2 mb-4" value={salaryData.year} onChange={e => setSalaryData({ ...salaryData, year: parseInt(e.target.value) })}>{years.map(y => <option key={y}>{y}</option>)}</select><div className="flex justify-end gap-3"><button onClick={() => setShowAddSalary(false)} className="px-4 py-2 border rounded">{t('admin.common.cancel')}</button><button onClick={saveSalary} className="px-4 py-2 bg-green-500 text-white rounded">{t('admin.common.save')}</button></div></div></div>)}

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
                onChange={e => setEditForm({ ...editForm, weight: e.target.value })}
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

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">{t('menu_edit.emoji_fallback', { defaultValue: 'Emoji Fallback (Optional)' })}</label>
                <input
                  type="text"
                  placeholder="e.g. 🍔"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.image}
                  onChange={e => setEditForm({ ...editForm, image: e.target.value })}
                />
              </div>

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
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={editForm.available} onChange={e => setEditForm({ ...editForm, available: e.target.checked })} />
                <span>{t('menu_edit.available_for_sale')}</span>
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded"
                  disabled={submitting}
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded font-bold disabled:bg-gray-400"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('admin.common.saving', { defaultValue: 'Saving...' })}
                    </span>
                  ) : (
                    editingItem ? t('admin.common.update') : t('admin.common.save')
                  )}
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

      {/* Today Orders Modal */}
      {showTodayOrdersModal && stats?.todayOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Today's Orders</h2>
              <button onClick={() => setShowTodayOrdersModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="px-6 py-3">{t('cashier.receipt.orderNumber')}</th><th className="px-6 py-3">{t('admin.inventory.date')}</th><th className="px-6 py-3">{t('admin.users.fullName')}</th><th className="px-6 py-3">{t('admin.tabs.menu')}</th><th className="px-6 py-3">{t('admin.inventory.total')}</th><th className="px-6 py-3">{t('admin.reports.status')}</th></tr>
              </thead>
              <tbody>
                {stats.todayOrders.map(order => (
                  <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedReportOrder(order)}>
                    <td className="px-6 py-4">#{order.orderNumber}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">{order.customerName}</td>
                    <td className="px-6 py-4">{order.items?.length} items</td>
                    <td className="px-6 py-4 font-bold">${Number(order.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.todayOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No orders today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Today Items Sold Modal */}
      {showTodayItemsModal && stats?.todayOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Items Sold Today</h2>
              <button onClick={() => setShowTodayItemsModal(false)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {(() => {
                const itemAggregates = {};
                stats.todayOrders.forEach(order => {
                  order.items?.forEach(item => {
                    if (!itemAggregates[item.name]) {
                      itemAggregates[item.name] = { quantity: 0, total: 0, price: item.price };
                    }
                    itemAggregates[item.name].quantity += item.quantity;
                    itemAggregates[item.name].total += (item.price * item.quantity);
                  });
                });

                const aggregatedArray = Object.entries(itemAggregates).map(([name, data]) => ({ name, ...data }));
                aggregatedArray.sort((a, b) => b.quantity - a.quantity);

                if (aggregatedArray.length === 0) {
                  return <p className="text-gray-500 text-center py-8">No items sold today</p>;
                }

                return aggregatedArray.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 shadow-sm p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm font-bold">{item.quantity}x</span>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">@ ${Number(item.price).toFixed(2)} each</p>
                      </div>
                    </div>
                    <span className="font-bold text-xl text-green-600">${Number(item.total).toFixed(2)}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;



