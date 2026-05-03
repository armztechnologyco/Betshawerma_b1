import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2,
  Coffee, Beef, Sandwich, Salad,
  Droplet, X, Edit2, Trash2 as TrashIcon,
  Scale, DollarSign, Lock, Unlock, Upload, Image as ImageIcon
} from 'lucide-react';
import { db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { subscribeToMenu, addMenuItem, updateMenuItem, deleteMenuItem, subscribeToCategories, subscribeToOptions } from '../../services/menuService';
import i18n from '../../i18n';
import ShiftTimer from '../Common/ShiftTimer';
import LanguageSwitcher from '../Common/LanguageSwitcher';

function CashierDashboard({ user }) {
  const { t } = useTranslation();
  const [cart, setCart] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState('takeaway');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [activeTab, setActiveTab] = useState('shawarma');
  const [amountReceived, setAmountReceived] = useState('');
  const [customerType, setCustomerType] = useState('egyptian'); // 'egyptian' | 'foreigner'
  const [menuItems, setMenuItems] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizations, setCustomizations] = useState({
    options: [],
    notes: '',
    quantity: 1
  });
  const [availableOptions, setAvailableOptions] = useState([]);

  // Admin states for menu management
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);



  // Check if user is admin (has edit permissions)
  const isAdmin = user?.role === 'admin';

  /**
   * Phase 1 — Image Optimization
   * Returns the best available image source for a menu item.
   * Strictly prefers Firebase Storage URLs (https://). Base64 strings
   * are intentionally NOT rendered — they bloat Firestore reads.
   * Falls back to null so the placeholder emoji is shown instead.
   */
  const getImageSrc = (item) => {
    if (item.imageUrl?.startsWith('https://')) return item.imageUrl;
    if (item.image?.startsWith('https://')) return item.image;
    return null;
  };

  // Tab configuration
  // Tab configuration derived from categories
  const tabs = useMemo(() => categories.map(cat => ({
    id: cat.id,
    name: t(`cashier.categories.${cat.id}`, { defaultValue: cat.name }),
    icon: cat.icon === 'Sandwich' ? Sandwich : (cat.icon === 'Salad' ? Salad : (cat.icon === 'Beef' ? Beef : (cat.icon === 'Coffee' ? Coffee : (cat.icon === 'Droplet' ? Droplet : Beef)))),
    color: cat.color || 'bg-red-500'
  })), [categories, t]);

  // Available extras - loaded live from Firestore
  // (state declared above)

  // Subscriptions
  useEffect(() => {
    const unsubscribeMenu = subscribeToMenu((data) => {
      setMenuItems(data);
      setLoading(false);
    });



    const unsubscribeCats = subscribeToCategories((data) => {
      setCategories(data);
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].id);
      }
    });

    // Subscribe to options from Firestore
    const unsubscribeOptions = subscribeToOptions((data) => {
      setAvailableOptions(data);
    });

    return () => {
      unsubscribeMenu();

      unsubscribeCats();
      unsubscribeOptions();
    };
  }, [activeTab]);

  // Image upload function
  const uploadImage = async (itemId, imageFile) => {
    try {
      const imageRef = ref(storage, `menu-items/${itemId}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const downloadURL = await getDownloadURL(imageRef);
      return { success: true, url: downloadURL, path: imageRef.fullPath };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete image function
  const deleteImage = async (imagePath) => {
    if (!imagePath) return;
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }
  };

  // Returns the correct price for the current customer type
  const getItemPrice = (item) => {
    if (customerType === 'foreigner' && item.foreignerPrice) {
      return parseFloat(item.foreignerPrice);
    }
    return parseFloat(item.price || item.basePrice || 0);
  };

  const addToCart = useCallback((item) => {
    if (!item.available) {
      toast.error(t('cashier.unavailable', { name: item.name }));
      return;
    }

    const activePrice = getItemPrice(item);

    if (item.category === 'shawarma' || item.category === 'plates' || item.category === 'sandwiches') {
      setSelectedItem({ ...item, basePrice: activePrice });
      setCustomizations({ options: [], notes: '', quantity: 1 });
      setShowCustomizeModal(true);
    } else {
      const cartItem = {
        ...item,
        price: activePrice,
        basePrice: activePrice,
        quantity: 1,
        totalPrice: activePrice,
        customizations: {}
      };
      setCart(prev => [...prev, cartItem]);
      toast.success(t('cashier.addedToCart', { name: item.name }));
    }
  }, [customerType]);

  const addCustomizedToCart = () => {
    if (!selectedItem) return;

    const optionsTotal = (customizations.options || []).reduce((sum, opt) => sum + (parseFloat(opt.price) || 0), 0);
    const itemTotal = (selectedItem.basePrice + optionsTotal) * customizations.quantity;

    const cartItem = {
      ...selectedItem,
      price: selectedItem.basePrice,
      quantity: customizations.quantity,
      options: customizations.options || [],
      notes: customizations.notes,
      totalPrice: itemTotal,
      basePrice: selectedItem.basePrice,
      optionsTotal: optionsTotal
    };

    setCart([...cart, cartItem]);
    toast.success(`${customizations.quantity}x ${selectedItem.name} added to cart`);
    setShowCustomizeModal(false);
    setSelectedItem(null);
  };

  const updateQuantity = useCallback((itemId, change) => {
    setCart(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success(t('cashier.removedFromCart'));
  }, [t]);



  const toggleOption = (option) => {
    setCustomizations(prev => {
      const exists = prev.options.find(o => o.id === option.id);
      if (exists) {
        return { ...prev, options: prev.options.filter(o => o.id !== option.id) };
      } else {
        return { ...prev, options: [...prev.options, option] };
      }
    });
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((total, item) => total + (item.totalPrice || item.price * item.quantity), 0);
    const vat = subtotal * 0.14;
    const service = orderType === 'dinein' ? subtotal * 0.12 : 0;
    const total = subtotal + vat + service;
    return { subtotal, vat, service, total };
  }, [cart, orderType]);



  const printReceipt = (order) => {
    setReceiptData(order);
    setTimeout(() => {
      window.print();
      setTimeout(() => setReceiptData(null), 1000);
    }, 300);
  };

  const handleSubmitOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast.error(t('cashier.cartEmpty'));
      return;
    }

    setIsProcessing(true);
    const orderNumber = Math.floor(Math.random() * 9000 + 1000).toString();

    const newOrder = {
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price || item.basePrice,
        total: item.totalPrice || item.price * item.quantity,
        notes: item.notes || ''
      })),
      total: totals.total,
      totals,
      orderType,
      paymentMethod,
      cashierName: user?.name || t('cashier.receipt.cashier'),
      customerName: customerName || t('admin.overview.walkIn'),
      customerType,
      status: 'pending',
      orderNumber,
      createdAt: new Date().toISOString(),
      amountReceived: paymentMethod === 'cash' ? (parseFloat(amountReceived) || totals.total) : totals.total,
      change: paymentMethod === 'cash' ? Math.max(0, (parseFloat(amountReceived) || 0) - totals.total) : 0
    };

    try {
      // Phase 1: Optimistic UI updates. 
      // We don't 'await' these writes because we want the POS to stay fast even when offline.
      // Firestore will queue these locally and sync them automatically when the connection returns.
      addDoc(collection(db, 'orders'), newOrder).catch(err => {
        console.error("Offline order sync error:", err);
        toast.error(t('cashier.failedToCreate'));
      });

      addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount: totals.total,
        description: `${t('cashier.receipt.orderNumber')}${orderNumber}`,
        category: 'sales',
        createdAt: new Date().toISOString()
      }).catch(err => console.error("Offline transaction sync error:", err));

      // Success UI proceeds immediately
      toast.success(t('cashier.orderCreated', { number: orderNumber }));
      printReceipt(newOrder);
      setCart([]);
      setCustomerName('');
      setAmountReceived('');
    } catch (error) {
      toast.error(t('cashier.failedToCreate'));
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, totals, orderType, paymentMethod, customerName, customerType, amountReceived, t]);
  // Admin functions
  const handleAddOrUpdateItem = async (formData, imageFile) => {
    let imageUrl = formData.imageUrl || formData.image;
    let imagePath = formData.imagePath;

    if (imageFile) {
      setUploading(true);
      const uploadResult = await uploadImage(formData.id || Date.now(), imageFile);
      if (uploadResult.success) {
        imageUrl = uploadResult.url;
        imagePath = uploadResult.path;
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to upload image');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const updatedItem = {
      ...formData,
      image: imageUrl || formData.image,
      imageUrl: imageUrl || formData.imageUrl,
      imagePath: imagePath || formData.imagePath
    };

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, updatedItem);
        toast.success('Item updated successfully!');
      } else {
        await addMenuItem(updatedItem);
        toast.success('Item added successfully!');
      }

      setShowMenuModal(false);
      setEditingItem(null);
      setImagePreview(null);
    } catch (error) {
      toast.error(t('admin.common.failed'));
      console.error(error);
    }
  };

  const handleDeleteItem = async (category, itemId, imagePath) => {
    if (window.confirm(t('admin.common.confirmDelete'))) {
      if (imagePath) {
        await deleteImage(imagePath);
      }

      try {
        await deleteMenuItem(itemId);
        toast.success(t('admin.common.success'));
      } catch (error) {
        toast.error(t('admin.common.failed'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-xl">{t('cashier.loadingMenu')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Role Badge */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <ShiftTimer />
          <div className="flex items-center gap-4">
          <LanguageSwitcher variant="dark" />
          <div>
            <h1 className="text-3xl font-bold">💰 {t('cashier.dashboard')}</h1>
            <div className="flex items-center gap-2 mt-2">
              {isAdmin ? (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Unlock size={14} />
                  {t('cashier.adminMode')}
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Lock size={14} />
                  {t('cashier.cashierMode')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Admin Menu Management Section */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Edit2 size={24} />
              {t('cashier.menuManagement')}
            </h2>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowMenuModal(true);
                setImagePreview(null);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Plus size={18} />
              {t('cashier.addNewItem')}
            </button>
          </div>

          {/* Display all menu items grouped by category for admin */}
          {Object.entries(menuItems).map(([category, items]) => (
            <div key={category} className="mb-8">
              <h3 className="text-xl font-semibold mb-4 capitalize">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Image Display — Phase 1: Storage URLs only */}
                        {getImageSrc(item) ? (
                          <img
                            src={getImageSrc(item)}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <ImageIcon size={32} className="text-gray-400" />
                          </div>
                        )}

                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <p className="text-gray-600">₪{item.price}</p>
                        <p className="text-sm text-gray-500">{item.weight}</p>
                        {item.includes && (
                          <p className="text-xs text-green-600 mt-1">{item.includes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowMenuModal(true);
                            setImagePreview(item.imageUrl || item.image);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(category, item.id, item.imagePath)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Section */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="bg-white rounded-t-lg shadow-lg">
            <div className="flex border-b overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${activeTab === tab.id
                    ? `${tab.color} text-white`
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <tab.icon size={18} />
                  {tab.name}
                  <span className="text-xs ml-1">
                    ({menuItems[tab.id]?.filter(item => item.available !== false).length || 0})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="bg-white rounded-b-lg shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {menuItems[activeTab] && menuItems[activeTab].length > 0 ? (
                menuItems[activeTab]
                  .filter(item => item.available !== false)
                  .map(item => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => addToCart(item)}
                    >
                      {/* Image Display — Phase 1: Storage URLs only */}
                      {getImageSrc(item) ? (
                        <img
                          src={getImageSrc(item)}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <span className="text-4xl">{item.image?.startsWith('http') || item.image?.startsWith('data:') ? '🍽️' : (item.image || '🍽️')}</span>
                        </div>
                      )}

                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Scale size={14} />
                        <span>{item.weight}</span>
                      </div>
                      {/* Dual Pricing Display */}
                      <div className="mt-1">
                        {item.foreignerPrice ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm px-1.5 py-0.5 rounded ${customerType === 'egyptian' ? 'bg-red-100 text-red-700' : 'text-gray-400 line-through'
                              }`}>🇪🇬 ₪{item.price}</span>
                            <span className={`font-bold text-sm px-1.5 py-0.5 rounded ${customerType === 'foreigner' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 line-through'
                              }`}>🌍 ₪{item.foreignerPrice}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <DollarSign size={14} />
                            <span>₪{item.price}</span>
                          </div>
                        )}
                      </div>
                      {item.includes && (
                        <p className="text-xs text-green-600 mt-2">{item.includes}</p>
                      )}
                      <button className={`mt-3 text-white px-3 py-1 rounded w-full text-sm ${customerType === 'foreigner' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                        }`}>
                        {t('cashier.addToOrder')} — ₪{getItemPrice(item)}
                      </button>
                    </div>
                  ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  {t('cashier.noItems')}
                  {isAdmin && ` ${t('cashier.addFirstItem')}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shopping Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
            <div className="flex items-center mb-4">
              <ShoppingCart className="mr-2" />
              <h2 className="text-2xl font-bold">{t('cashier.currentOrder')}</h2>
            </div>

            {/* Customer Type Toggle */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{t('cashier.customerType')}</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => { setCustomerType('egyptian'); setCart([]); }}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${customerType === 'egyptian'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {t('cashier.egyptian')}
                </button>
                <button
                  onClick={() => { setCustomerType('foreigner'); setCart([]); }}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${customerType === 'foreigner'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {t('cashier.foreigner')}
                </button>
              </div>
              {cart.length > 0 && (
                <p className="text-xs text-orange-500 mt-1">{t('cashier.clearCartWarning')}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">{t('cashier.customerName')}</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder={t('cashier.enterCustomerName')}
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('cashier.orderType')}</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="orderType" checked={orderType === 'takeaway'} onChange={() => setOrderType('takeaway')} className="w-4 h-4 text-orange-500" /> {t('cashier.takeaway')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="orderType" checked={orderType === 'dinein'} onChange={() => setOrderType('dinein')} className="w-4 h-4 text-orange-500" /> {t('cashier.dineIn')}
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('cashier.paymentMethod')}</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="paymentMethod" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="w-4 h-4 text-orange-500" /> {t('cashier.cash')}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="paymentMethod" checked={paymentMethod === 'visa'} onChange={() => setPaymentMethod('visa')} className="w-4 h-4 text-orange-500" /> {t('cashier.visa')}
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-b py-4 mb-4 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center">{t('cashier.cartEmpty')}</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="mb-4 pb-3 border-b">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">₪{item.price || item.basePrice} each</p>

                        {item.notes && (
                          <p className="text-xs text-orange-600 mt-1">{t('cashier.note')}: {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right font-semibold mt-1">
                      ₪{item.totalPrice || (item.price * item.quantity)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>{t('cashier.subtotal')}:</span>
                <span>₪{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-1">
                <span>{t('cashier.vat')}:</span>
                <span>₪{totals.vat.toFixed(2)}</span>
              </div>
              {orderType === 'dinein' && (
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>{t('cashier.service')}:</span>
                  <span>₪{totals.service.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                <span>{t('cashier.total')}:</span>
                <span>₪{totals.total.toFixed(2)}</span>
              </div>
            </div>

            {paymentMethod === 'cash' && cart.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">{t('cashier.amountReceived')}</label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-32 border rounded-md px-2 py-1 text-right font-semibold"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold text-orange-600 border-t pt-2 mt-2">
                  <span>{t('cashier.change')}:</span>
                  <span>₪{Math.max(0, (parseFloat(amountReceived) || 0) - totals.total).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={isProcessing || cart.length === 0}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isProcessing ? t('cashier.processing') : t('cashier.completeOrder')}
            </button>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomizeModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{t('cashier.customize')} {selectedItem.name}</h2>
              <button onClick={() => setShowCustomizeModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">{t('cashier.basePrice')}: ₪{selectedItem.basePrice}</p>
              <p className="text-sm text-gray-600">{t('cashier.weight')}: {selectedItem.weight}</p>
            </div>



            <div className="mb-4">
              <h3 className="font-semibold mb-3">{t('options.title')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center gap-2 p-2 border rounded-lg transition-colors ${
                      customizations.options?.some(o => o.id === option.id)
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="text-sm font-medium">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">{t('cashier.specialInstructions')}</label>
              <textarea
                value={customizations.notes}
                onChange={(e) => setCustomizations({ ...customizations, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows="2"
                placeholder={t('cashier.specialInstructionsPlaceholder')}
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">{t('cashier.quantity')}</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCustomizations({ ...customizations, quantity: Math.max(1, customizations.quantity - 1) })}
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-12 text-center">{customizations.quantity}</span>
                <button
                  onClick={() => setCustomizations({ ...customizations, quantity: customizations.quantity + 1 })}
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between mb-2 font-bold text-lg">
                <span>{t('cashier.totalFor')} {customizations.quantity}:</span>
                <span className="text-green-600">
                  ₪{((selectedItem.basePrice + (customizations.options || []).reduce((sum, opt) => sum + (parseFloat(opt.price) || 0), 0)) * customizations.quantity).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                {t('cashier.cancel')}
              </button>
              <button
                onClick={addCustomizedToCart}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {t('cashier.addToCart')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Menu Management Modal */}
      {showMenuModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingItem ? t('cashier.editItem') : t('cashier.addNewItem')}</h2>
              <button onClick={() => {
                setShowMenuModal(false);
                setEditingItem(null);
                setImagePreview(null);
              }} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const foreignerPriceRaw = formData.get('foreignerPrice');
              const itemData = {
                id: editingItem?.id,
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                foreignerPrice: foreignerPriceRaw ? parseFloat(foreignerPriceRaw) : null,
                weight: formData.get('weight'),
                category: formData.get('category'),
                includes: formData.get('includes') || '',
                available: formData.get('available') === 'on',
                basePrice: parseFloat(formData.get('price')),
                image: editingItem?.image || '',
                imageUrl: editingItem?.imageUrl || '',
                imagePath: editingItem?.imagePath || '',
                weightInKg: parseFloat(formData.get('weightInKg')) || 0
              };
              const imageFile = formData.get('imageFile');
              handleAddOrUpdateItem(itemData, imageFile);
            }}>
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.itemImage')}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {(imagePreview || editingItem?.imageUrl || editingItem?.image) && (
                    <div className="mb-3">
                      <img
                        src={imagePreview || editingItem?.imageUrl || editingItem?.image}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
                    <Upload size={18} />
                    <span>{uploading ? t('cashier.uploading') : t('cashier.chooseImage')}</span>
                    <input
                      type="file"
                      name="imageFile"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImagePreview(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">{t('cashier.imageDesc')}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.itemName')}</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingItem?.name || ''}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.egyPrice')}</label>
                <input
                  type="number"
                  name="price"
                  required
                  step="0.01"
                  defaultValue={editingItem?.price || ''}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder={t('cashier.pricePlaceholder')}
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.forPrice')} <span className="text-xs font-normal text-gray-400">{t('cashier.forPriceDesc')}</span></label>
                <input
                  type="number"
                  name="foreignerPrice"
                  step="0.01"
                  defaultValue={editingItem?.foreignerPrice || ''}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder={t('cashier.pricePlaceholder')}
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.weight')}</label>
                <input
                  type="text"
                  name="weight"
                  required
                  defaultValue={editingItem?.weight || ''}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 250g"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.weightInKg')}</label>
                <input
                  type="number"
                  name="weightInKg"
                  step="0.01"
                  defaultValue={editingItem?.weightInKg || ''}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 0.25"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.category')}</label>
                <select
                  name="category"
                  defaultValue={editingItem?.category || tabs[0]?.id}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {tabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">{t('cashier.includesOptional')}</label>
                <input
                  type="text"
                  name="includes"
                  defaultValue={editingItem?.includes || ''}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder={t('menu_edit.includes')}
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="available"
                    defaultChecked={editingItem?.available !== false}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold">{t('cashier.itemAvailable')}</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false);
                    setEditingItem(null);
                    setImagePreview(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {t('cashier.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {uploading ? t('cashier.uploading') : (editingItem ? t('cashier.update') : t('cashier.add'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Receipt - only visible when printing */}
      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            font-family: 'Courier New', monospace;
            direction: rtl;
            padding: 20px;
          }
        }
        `}
      </style>

      {receiptData && (
        <div id="receipt-print-area" dir="rtl">
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
              <path d="M7 2v20"></path>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
            </svg>
            <h2 style={{ margin: '5px 0' }}>Betshawerma</h2>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>{t('cashier.receipt.hotline', { lng: 'ar' })}: 19300</p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>{t('cashier.receipt.commercialReg', { lng: 'ar' })}: 55689</p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>{t('cashier.receipt.taxCard', { lng: 'ar' })}: 5-967-522</p>
            <p style={{ fontSize: '12px', margin: '5px 0 2px' }}>
              {new Date(receiptData.createdAt).toLocaleString('ar-EG')}
            </p>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '12px' }}>
            <div><strong>{t('cashier.receipt.cashier', { lng: 'ar' })}:</strong> {receiptData.cashierName}</div>
            <div><strong>{t('cashier.receipt.orderNumber', { lng: 'ar' })}:</strong> #{receiptData.orderNumber}</div>
            <div><strong>{t('cashier.orderType', { lng: 'ar' })}:</strong> {receiptData.orderType === 'dinein' ? t('cashier.dineIn', { lng: 'ar' }) : t('cashier.takeaway', { lng: 'ar' })}</div>
            <div><strong>{t('cashier.paymentMethod', { lng: 'ar' })}:</strong> {receiptData.paymentMethod === 'cash' ? t('cashier.cash', { lng: 'ar' }) : t('cashier.visa', { lng: 'ar' })}</div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />

          <div>
            {receiptData.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>₪{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                {item.options && item.options.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', paddingRight: '15px' }}>
                    {item.options.map((opt, oIdx) => (
                      <div key={oIdx}>+ {opt.name}</div>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#666', marginTop: '2px', paddingRight: '15px' }}>
                    * {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>{t('cashier.subtotal', { lng: 'ar' })}:</span>
              <span>₪{receiptData.totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>{t('cashier.vat', { lng: 'ar' })}:</span>
              <span>₪{receiptData.totals.vat.toFixed(2)}</span>
            </div>
            {receiptData.orderType === 'dinein' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>{t('cashier.service', { lng: 'ar' })}:</span>
                <span>₪{receiptData.totals.service.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginTop: '5px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
              <span>{t('cashier.total', { lng: 'ar' })}:</span>
              <span>₪{receiptData.totals.total.toFixed(2)}</span>
            </div>
            {receiptData.paymentMethod === 'cash' && (
              <div style={{ marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>{t('cashier.amountReceived', { lng: 'ar' })}:</span>
                  <span>₪{receiptData.amountReceived.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                  <span>{t('cashier.change', { lng: 'ar' })}:</span>
                  <span>₪{receiptData.change.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', fontSize: '12px', textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <p style={{ fontWeight: 'bold' }}>{t('cashier.receipt.thanks', { lng: 'ar' })}</p>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0 0 5px' }}>{t('cashier.receipt.scanMenu', { lng: 'ar' })}</p>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Fbetshawerma.com%2Fmenu"
                alt="Menu QR Code"
                style={{ width: '120px', height: '120px', display: 'block', margin: '5px auto' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierDashboard;