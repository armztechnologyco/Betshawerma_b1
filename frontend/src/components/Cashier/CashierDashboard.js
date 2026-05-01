// // import React, { useState, useEffect } from 'react';
// // import toast from 'react-hot-toast';
// // import { 
// //   ShoppingCart, Plus, Minus, Trash2, 
// //   Coffee, Beef, Sandwich, Salad, 
// //   Flame, Droplet, X, Edit2, Trash2 as TrashIcon,
// //   Scale, DollarSign, Lock, Unlock, Upload, Image as ImageIcon
// // } from 'lucide-react';
// // import { createOrder, addTransaction } from '../../services/firebaseService';
// // import { db, storage } from '../../firebase';
// // import { collection, addDoc } from 'firebase/firestore';
// // import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// // function CashierDashboard({ userRole }) {
// //   const [cart, setCart] = useState([]);
// //   const [customerName, setCustomerName] = useState('');
// //   const [isProcessing, setIsProcessing] = useState(false);
// //   const [activeTab, setActiveTab] = useState('shawarma');
// //   const [menuItems, setMenuItems] = useState({});
// //   const [loading, setLoading] = useState(true);
// //   const [selectedItem, setSelectedItem] = useState(null);
// //   const [showCustomizeModal, setShowCustomizeModal] = useState(false);
// //   const [customizations, setCustomizations] = useState({
// //     extras: [],
// //     notes: '',
// //     quantity: 1
// //   });

// //   // Admin states for menu management
// //   const [showMenuModal, setShowMenuModal] = useState(false);
// //   const [editingItem, setEditingItem] = useState(null);
// //   const [uploading, setUploading] = useState(false);
// //   const [imagePreview, setImagePreview] = useState(null);

// //   // Check if user is admin (has edit permissions)
// //   const isAdmin = userRole === 'admin';
// //   const isCashier = userRole === 'cashier';

// //   // Tab configuration
// //   const tabs = [
// //     { id: 'shawarma', name: 'Shawarma', icon: Beef, color: 'bg-red-500' },
// //     { id: 'plates', name: 'Plates', icon: Salad, color: 'bg-green-500' },
// //     { id: 'sandwiches', name: 'Sandwiches', icon: Sandwich, color: 'bg-orange-500' },
// //     { id: 'sides', name: 'Sides', icon: Coffee, color: 'bg-purple-500' },
// //     { id: 'drinks', name: 'Drinks', icon: Droplet, color: 'bg-blue-500' }
// //   ];

// //   // Sample menu data
// //   const [sampleMenu, setSampleMenu] = useState({
// //     shawarma: [
// //       { id: 1, name: 'Chicken Shawarma', price: 25, weight: '250g', image: '🍗', imageUrl: null, category: 'shawarma', basePrice: 25, available: true },
// //       { id: 2, name: 'Beef Shawarma', price: 30, weight: '250g', image: '🥩', imageUrl: null, category: 'shawarma', basePrice: 30, available: true },
// //       { id: 3, name: 'Mixed Shawarma', price: 35, weight: '300g', image: '🍖', imageUrl: null, category: 'shawarma', basePrice: 35, available: true },
// //       { id: 4, name: 'Chicken Shawarma Meal', price: 45, weight: '450g', image: '🍗🍟', imageUrl: null, category: 'shawarma', basePrice: 45, includes: 'Fries + Drink', available: true }
// //     ],
// //     plates: [
// //       { id: 5, name: 'Chicken Shawarma Plate', price: 45, weight: '500g', image: '🍽️', imageUrl: null, category: 'plates', basePrice: 45, includes: 'Rice + Salad + Garlic Sauce', available: true },
// //       { id: 6, name: 'Beef Shawarma Plate', price: 50, weight: '500g', image: '🍽️', imageUrl: null, category: 'plates', basePrice: 50, includes: 'Rice + Salad + Tahini Sauce', available: true },
// //       { id: 7, name: 'Mixed Grill Plate', price: 65, weight: '650g', image: '🔥', imageUrl: null, category: 'plates', basePrice: 65, includes: 'Chicken + Beef + Kofta', available: true }
// //     ],
// //     sandwiches: [
// //       { id: 8, name: 'Chicken Sandwich', price: 18, weight: '200g', image: '🥙', imageUrl: null, category: 'sandwiches', basePrice: 18, available: true },
// //       { id: 9, name: 'Beef Sandwich', price: 22, weight: '200g', image: '🥙', imageUrl: null, category: 'sandwiches', basePrice: 22, available: true },
// //       { id: 10, name: 'Falafel Sandwich', price: 12, weight: '180g', image: '🧆', imageUrl: null, category: 'sandwiches', basePrice: 12, available: true }
// //     ],
// //     sides: [
// //       { id: 11, name: 'French Fries', price: 10, weight: '150g', image: '🍟', imageUrl: null, category: 'sides', basePrice: 10, available: true },
// //       { id: 12, name: 'Onion Rings', price: 12, weight: '120g', image: '🧅', imageUrl: null, category: 'sides', basePrice: 12, available: true },
// //       { id: 13, name: 'Hummus', price: 8, weight: '100g', image: '🫘', imageUrl: null, category: 'sides', basePrice: 8, available: true },
// //       { id: 14, name: 'Tabbouleh', price: 10, weight: '150g', image: '🥗', imageUrl: null, category: 'sides', basePrice: 10, available: true }
// //     ],
// //     drinks: [
// //       { id: 15, name: 'Coca Cola', price: 5, weight: '330ml', image: '🥤', imageUrl: null, category: 'drinks', basePrice: 5, available: true },
// //       { id: 16, name: 'Sprite', price: 5, weight: '330ml', image: '🥤', imageUrl: null, category: 'drinks', basePrice: 5, available: true },
// //       { id: 17, name: 'Fanta', price: 5, weight: '330ml', image: '🥤', imageUrl: null, category: 'drinks', basePrice: 5, available: true },
// //       { id: 18, name: 'Water', price: 3, weight: '500ml', image: '💧', imageUrl: null, category: 'drinks', basePrice: 3, available: true }
// //     ]
// //   });

// //   // Available extras
// //   const availableExtras = [
// //     { id: 'cheese', name: 'Extra Cheese', price: 3, icon: '🧀' },
// //     { id: 'spicy', name: 'Spicy Sauce', price: 2, icon: '🌶️' },
// //     { id: 'bbq', name: 'BBQ Sauce', price: 2, icon: '🍖' },
// //     { id: 'garlic', name: 'Garlic Sauce', price: 2, icon: '🧄' },
// //     { id: 'tahini', name: 'Tahini Sauce', price: 2, icon: '🥜' },
// //     { id: 'extra_meat', name: 'Extra Meat', price: 8, icon: '🥩' },
// //     { id: 'extra_veggies', name: 'Extra Veggies', price: 3, icon: '🥬' },
// //     { id: 'pickles', name: 'Extra Pickles', price: 1, icon: '🥒' }
// //   ];

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const loadData = async () => {
// //     try {
// //       setLoading(true);
// //       const savedMenu = localStorage.getItem('menuItems');
// //       if (savedMenu) {
// //         setSampleMenu(JSON.parse(savedMenu));
// //       }
// //     } catch (error) {
// //       console.error('Error loading menu:', error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Image upload function
// //   const uploadImage = async (itemId, imageFile) => {
// //     try {
// //       const imageRef = ref(storage, `menu-items/${itemId}/${Date.now()}_${imageFile.name}`);
// //       await uploadBytes(imageRef, imageFile);
// //       const downloadURL = await getDownloadURL(imageRef);
// //       return { success: true, url: downloadURL, path: imageRef.fullPath };
// //     } catch (error) {
// //       console.error('Error uploading image:', error);
// //       return { success: false, error: error.message };
// //     }
// //   };

// //   // Delete image function
// //   const deleteImage = async (imagePath) => {
// //     if (!imagePath) return;
// //     try {
// //       const imageRef = ref(storage, imagePath);
// //       await deleteObject(imageRef);
// //       return { success: true };
// //     } catch (error) {
// //       console.error('Error deleting image:', error);
// //       return { success: false, error: error.message };
// //     }
// //   };

// //   const addToCart = (item) => {
// //     if (!item.available) {
// //       toast.error(`${item.name} is currently unavailable`);
// //       return;
// //     }

// //     if (item.category === 'shawarma' || item.category === 'plates' || item.category === 'sandwiches') {
// //       setSelectedItem(item);
// //       setCustomizations({ extras: [], notes: '', quantity: 1 });
// //       setShowCustomizeModal(true);
// //     } else {
// //       const cartItem = {
// //         ...item,
// //         quantity: 1,
// //         extras: [],
// //         totalPrice: item.price,
// //         customizations: {}
// //       };
// //       setCart([...cart, cartItem]);
// //       toast.success(`${item.name} added to cart`);
// //     }
// //   };

// //   const addCustomizedToCart = () => {
// //     if (!selectedItem) return;

// //     const extrasTotal = customizations.extras.reduce((sum, extra) => sum + extra.price, 0);
// //     const itemTotal = (selectedItem.basePrice + extrasTotal) * customizations.quantity;

// //     const cartItem = {
// //       ...selectedItem,
// //       quantity: customizations.quantity,
// //       extras: customizations.extras,
// //       notes: customizations.notes,
// //       totalPrice: itemTotal,
// //       basePrice: selectedItem.basePrice,
// //       extrasTotal: extrasTotal
// //     };

// //     setCart([...cart, cartItem]);
// //     toast.success(`${customizations.quantity}x ${selectedItem.name} added to cart`);
// //     setShowCustomizeModal(false);
// //     setSelectedItem(null);
// //   };

// //   const updateQuantity = (itemId, change) => {
// //     setCart(cart.map(item =>
// //       item.id === itemId
// //         ? { ...item, quantity: Math.max(0, item.quantity + change) }
// //         : item
// //     ).filter(item => item.quantity > 0));
// //   };

// //   const removeFromCart = (itemId) => {
// //     setCart(cart.filter(item => item.id !== itemId));
// //     toast.success('Item removed from cart');
// //   };

// //   const toggleExtra = (extra) => {
// //     setCustomizations(prev => {
// //       const exists = prev.extras.find(e => e.id === extra.id);
// //       if (exists) {
// //         return { ...prev, extras: prev.extras.filter(e => e.id !== extra.id) };
// //       } else {
// //         return { ...prev, extras: [...prev.extras, extra] };
// //       }
// //     });
// //   };

// //   const calculateTotal = () => {
// //     return cart.reduce((total, item) => total + (item.totalPrice || item.price * item.quantity), 0);
// //   };

// //   const handleSubmitOrder = async () => {
// //     if (cart.length === 0) {
// //       toast.error('Cart is empty');
// //       return;
// //     }

// //     setIsProcessing(true);
// //     const orderData = {
// //       items: cart.map(item => ({
// //         id: item.id,
// //         name: item.name,
// //         quantity: item.quantity,
// //         price: item.price || item.basePrice,
// //         total: item.totalPrice || item.price * item.quantity,
// //         extras: item.extras || [],
// //         notes: item.notes || ''
// //       })),
// //       total: calculateTotal(),
// //       customerName: customerName || 'Walk-in Customer',
// //       status: 'pending'
// //     };

// //     try {
// //       const ordersRef = collection(db, 'orders');
// //       const newOrder = {
// //         ...orderData,
// //         orderNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
// //         createdAt: new Date().toISOString()
// //       };
// //       await addDoc(ordersRef, newOrder);

// //       toast.success(`Order #${newOrder.orderNumber} created successfully!`);

// //       const transactionsRef = collection(db, 'transactions');
// //       await addDoc(transactionsRef, {
// //         type: 'income',
// //         amount: calculateTotal(),
// //         description: `Order #${newOrder.orderNumber}`,
// //         category: 'sales',
// //         createdAt: new Date().toISOString()
// //       });

// //       setCart([]);
// //       setCustomerName('');
// //     } catch (error) {
// //       toast.error('Failed to create order');
// //       console.error(error);
// //     } finally {
// //       setIsProcessing(false);
// //     }
// //   };

// //   // Admin functions
// //   const handleAddOrUpdateItem = async (formData, imageFile) => {
// //     let imageUrl = formData.imageUrl || formData.image;
// //     let imagePath = formData.imagePath;

// //     if (imageFile) {
// //       setUploading(true);
// //       const uploadResult = await uploadImage(formData.id || Date.now(), imageFile);
// //       if (uploadResult.success) {
// //         imageUrl = uploadResult.url;
// //         imagePath = uploadResult.path;
// //         toast.success('Image uploaded successfully!');
// //       } else {
// //         toast.error('Failed to upload image');
// //         setUploading(false);
// //         return;
// //       }
// //       setUploading(false);
// //     }

// //     const updatedItem = { 
// //       ...formData, 
// //       image: imageUrl || formData.image,
// //       imageUrl: imageUrl || formData.imageUrl,
// //       imagePath: imagePath || formData.imagePath
// //     };

// //     if (editingItem) {
// //       // Update existing item
// //       const category = formData.category;
// //       const updatedMenu = {
// //         ...sampleMenu,
// //         [category]: sampleMenu[category].map(item => 
// //           item.id === formData.id ? updatedItem : item
// //         )
// //       };
// //       setSampleMenu(updatedMenu);
// //       localStorage.setItem('menuItems', JSON.stringify(updatedMenu));
// //       toast.success('Item updated successfully!');
// //     } else {
// //       // Add new item
// //       const newId = Date.now();
// //       const newItem = { ...updatedItem, id: newId };
// //       const category = formData.category;
// //       const updatedMenu = {
// //         ...sampleMenu,
// //         [category]: [...sampleMenu[category], newItem]
// //       };
// //       setSampleMenu(updatedMenu);
// //       localStorage.setItem('menuItems', JSON.stringify(updatedMenu));
// //       toast.success('Item added successfully!');
// //     }

// //     setShowMenuModal(false);
// //     setEditingItem(null);
// //     setImagePreview(null);
// //   };

// //   const handleDeleteItem = async (category, itemId, imagePath) => {
// //     if (window.confirm('Are you sure you want to delete this item?')) {
// //       if (imagePath) {
// //         await deleteImage(imagePath);
// //       }

// //       const updatedMenu = {
// //         ...sampleMenu,
// //         [category]: sampleMenu[category].filter(item => item.id !== itemId)
// //       };
// //       setSampleMenu(updatedMenu);
// //       localStorage.setItem('menuItems', JSON.stringify(updatedMenu));
// //       toast.success('Item deleted successfully!');
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="flex justify-center items-center h-screen">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
// //           <div className="text-xl">Loading menu...</div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="container mx-auto px-4 py-8">
// //       {/* Header with Role Badge */}
// //       <div className="flex justify-between items-center mb-8">
// //         <div>
// //           <h1 className="text-3xl font-bold">🪙 Cashier Dashboard</h1>
// //           <div className="flex items-center gap-2 mt-2">
// //             {isAdmin ? (
// //               <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
// //                 <Unlock size={14} />
// //                 Admin Mode - Full Access
// //               </span>
// //             ) : (
// //               <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
// //                 <Lock size={14} />
// //                 Cashier Mode - View Only
// //               </span>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Admin Menu Management Section */}
// //       {isAdmin && (
// //         <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
// //           <div className="flex justify-between items-center mb-6">
// //             <h2 className="text-2xl font-bold flex items-center gap-2">
// //               <Edit2 size={24} />
// //               Menu Management (Admin Only)
// //             </h2>
// //             <button
// //               onClick={() => {
// //                 setEditingItem(null);
// //                 setShowMenuModal(true);
// //                 setImagePreview(null);
// //               }}
// //               className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
// //             >
// //               <Plus size={18} />
// //               Add New Item
// //             </button>
// //           </div>

// //           {/* Display all menu items grouped by category for admin */}
// //           {Object.entries(sampleMenu).map(([category, items]) => (
// //             <div key={category} className="mb-8">
// //               <h3 className="text-xl font-semibold mb-4 capitalize">{category}</h3>
// //               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //                 {items.map(item => (
// //                   <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition">
// //                     <div className="flex justify-between items-start">
// //                       <div className="flex-1">
// //                         {/* Image Display */}
// //                         {item.imageUrl ? (
// //                           <img 
// //                             src={item.imageUrl} 
// //                             alt={item.name}
// //                             className="w-full h-32 object-cover rounded-lg mb-3"
// //                           />
// //                         ) : item.image && !item.image.startsWith('http') ? (
// //                           <div className="text-5xl mb-3 text-center">{item.image}</div>
// //                         ) : (
// //                           <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
// //                             <ImageIcon size={32} className="text-gray-400" />
// //                           </div>
// //                         )}

// //                         <h4 className="font-semibold text-lg">{item.name}</h4>
// //                         <p className="text-gray-600">₪{item.price}</p>
// //                         <p className="text-sm text-gray-500">{item.weight}</p>
// //                         {item.includes && (
// //                           <p className="text-xs text-green-600 mt-1">{item.includes}</p>
// //                         )}
// //                       </div>
// //                       <div className="flex gap-2 ml-2">
// //                         <button
// //                           onClick={() => {
// //                             setEditingItem(item);
// //                             setShowMenuModal(true);
// //                             setImagePreview(item.imageUrl);
// //                           }}
// //                           className="text-blue-500 hover:text-blue-700"
// //                         >
// //                           <Edit2 size={18} />
// //                         </button>
// //                         <button
// //                           onClick={() => handleDeleteItem(category, item.id, item.imagePath)}
// //                           className="text-red-500 hover:text-red-700"
// //                         >
// //                           <TrashIcon size={18} />
// //                         </button>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //         {/* Menu Section */}
// //         <div className="lg:col-span-2">
// //           {/* Tab Navigation */}
// //           <div className="bg-white rounded-t-lg shadow-lg">
// //             <div className="flex border-b overflow-x-auto">
// //               {tabs.map(tab => (
// //                 <button
// //                   key={tab.id}
// //                   onClick={() => setActiveTab(tab.id)}
// //                   className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
// //                     activeTab === tab.id
// //                       ? `${tab.color} text-white`
// //                       : 'text-gray-600 hover:bg-gray-100'
// //                   }`}
// //                 >
// //                   <tab.icon size={18} />
// //                   {tab.name}
// //                 </button>
// //               ))}
// //             </div>
// //           </div>

// //           {/* Menu Items Grid */}
// //           <div className="bg-white rounded-b-lg shadow-lg p-6">
// //             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
// //               {sampleMenu[activeTab]?.filter(item => item.available).map(item => (
// //                 <div 
// //                   key={item.id} 
// //                   className="border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer" 
// //                   onClick={() => addToCart(item)}
// //                 >
// //                   {/* Image Display with fallback */}
// //                   {item.imageUrl ? (
// //                     <img 
// //                       src={item.imageUrl} 
// //                       alt={item.name}
// //                       className="w-full h-32 object-cover rounded-lg mb-3"
// //                     />
// //                   ) : item.image && !item.image.startsWith('http') ? (
// //                     <div className="text-4xl mb-2 text-center">{item.image}</div>
// //                   ) : (
// //                     <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
// //                       <ImageIcon size={32} className="text-gray-400" />
// //                     </div>
// //                   )}

// //                   <h3 className="font-semibold text-lg">{item.name}</h3>
// //                   <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
// //                     <Scale size={14} />
// //                     <span>{item.weight}</span>
// //                   </div>
// //                   <div className="flex items-center gap-2 text-sm text-gray-500">
// //                     <DollarSign size={14} />
// //                     <span>₪{item.price}</span>
// //                   </div>
// //                   {item.includes && (
// //                     <p className="text-xs text-green-600 mt-2">{item.includes}</p>
// //                   )}
// //                   <button className="mt-3 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full text-sm">
// //                     Add to Order
// //                   </button>
// //                 </div>
// //               ))}
// //             </div>
// //             {sampleMenu[activeTab]?.filter(item => item.available).length === 0 && (
// //               <div className="text-center py-8 text-gray-500">
// //                 No items available in this category.
// //               </div>
// //             )}
// //           </div>
// //         </div>

// //         {/* Shopping Cart */}
// //         <div className="lg:col-span-1">
// //           <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
// //             <div className="flex items-center mb-4">
// //               <ShoppingCart className="mr-2" />
// //               <h2 className="text-2xl font-bold">Current Order</h2>
// //             </div>

// //             <div className="mb-4">
// //               <label className="block text-sm font-medium mb-2">Customer Name</label>
// //               <input
// //                 type="text"
// //                 value={customerName}
// //                 onChange={(e) => setCustomerName(e.target.value)}
// //                 className="w-full border rounded-lg px-3 py-2"
// //                 placeholder="Enter customer name"
// //               />
// //             </div>

// //             <div className="border-t border-b py-4 mb-4 max-h-96 overflow-y-auto">
// //               {cart.length === 0 ? (
// //                 <p className="text-gray-500 text-center">Cart is empty</p>
// //               ) : (
// //                 cart.map(item => (
// //                   <div key={item.id} className="mb-4 pb-3 border-b">
// //                     <div className="flex justify-between items-start">
// //                       <div className="flex-1">
// //                         <p className="font-semibold">{item.name}</p>
// //                         <p className="text-sm text-gray-600">₪{item.price || item.basePrice} each</p>
// //                         {item.extras && item.extras.length > 0 && (
// //                           <div className="text-xs text-gray-500 mt-1">
// //                             {item.extras.map(e => e.name).join(', ')}
// //                           </div>
// //                         )}
// //                         {item.notes && (
// //                           <p className="text-xs text-orange-600 mt-1">Note: {item.notes}</p>
// //                         )}
// //                       </div>
// //                       <div className="flex items-center gap-2">
// //                         <button
// //                           onClick={() => updateQuantity(item.id, -1)}
// //                           className="bg-gray-200 p-1 rounded hover:bg-gray-300"
// //                         >
// //                           <Minus size={16} />
// //                         </button>
// //                         <span className="w-8 text-center">{item.quantity}</span>
// //                         <button
// //                           onClick={() => updateQuantity(item.id, 1)}
// //                           className="bg-gray-200 p-1 rounded hover:bg-gray-300"
// //                         >
// //                           <Plus size={16} />
// //                         </button>
// //                         <button
// //                           onClick={() => removeFromCart(item.id)}
// //                           className="text-red-500 hover:text-red-700 ml-2"
// //                         >
// //                           <Trash2 size={16} />
// //                         </button>
// //                       </div>
// //                     </div>
// //                     <div className="text-right font-semibold mt-1">
// //                       ₪{item.totalPrice || (item.price * item.quantity)}
// //                     </div>
// //                   </div>
// //                 ))
// //               )}
// //             </div>

// //             <div className="mb-4">
// //               <div className="flex justify-between text-xl font-bold">
// //                 <span>Total:</span>
// //                 <span>₪{calculateTotal()}</span>
// //               </div>
// //             </div>

// //             <button
// //               onClick={handleSubmitOrder}
// //               disabled={isProcessing || cart.length === 0}
// //               className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400"
// //             >
// //               {isProcessing ? 'Processing...' : 'Complete Order'}
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Customization Modal */}
// //       {showCustomizeModal && selectedItem && (
// //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
// //             <div className="flex justify-between items-center mb-4">
// //               <h2 className="text-2xl font-bold">Customize {selectedItem.name}</h2>
// //               <button onClick={() => setShowCustomizeModal(false)} className="text-gray-500 hover:text-gray-700">
// //                 <X size={24} />
// //               </button>
// //             </div>

// //             <div className="bg-gray-50 p-4 rounded-lg mb-4">
// //               <p className="text-sm text-gray-600">Base Price: ₪{selectedItem.basePrice}</p>
// //               <p className="text-sm text-gray-600">Weight: {selectedItem.weight}</p>
// //             </div>

// //             <div className="mb-4">
// //               <h3 className="font-semibold mb-3">Add Extras</h3>
// //               <div className="space-y-2">
// //                 {availableExtras.map(extra => (
// //                   <label key={extra.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
// //                     <div className="flex items-center gap-3">
// //                       <span className="text-2xl">{extra.icon}</span>
// //                       <div>
// //                         <p className="font-medium">{extra.name}</p>
// //                         <p className="text-sm text-gray-500">+₪{extra.price}</p>
// //                       </div>
// //                     </div>
// //                     <input
// //                       type="checkbox"
// //                       checked={customizations.extras.some(e => e.id === extra.id)}
// //                       onChange={() => toggleExtra(extra)}
// //                       className="w-5 h-5 text-orange-500 rounded"
// //                     />
// //                   </label>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="mb-4">
// //               <label className="block font-semibold mb-2">Special Instructions</label>
// //               <textarea
// //                 value={customizations.notes}
// //                 onChange={(e) => setCustomizations({...customizations, notes: e.target.value})}
// //                 className="w-full border rounded-lg px-3 py-2"
// //                 rows="2"
// //                 placeholder="e.g., extra spicy, no onions, etc."
// //               />
// //             </div>

// //             <div className="mb-4">
// //               <label className="block font-semibold mb-2">Quantity</label>
// //               <div className="flex items-center gap-3">
// //                 <button
// //                   onClick={() => setCustomizations({...customizations, quantity: Math.max(1, customizations.quantity - 1)})}
// //                   className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
// //                 >
// //                   -
// //                 </button>
// //                 <span className="text-xl font-semibold w-12 text-center">{customizations.quantity}</span>
// //                 <button
// //                   onClick={() => setCustomizations({...customizations, quantity: customizations.quantity + 1})}
// //                   className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
// //                 >
// //                   +
// //                 </button>
// //               </div>
// //             </div>

// //             <div className="bg-orange-50 p-4 rounded-lg mb-4">
// //               <div className="flex justify-between mb-2">
// //                 <span>Base Price:</span>
// //                 <span>₪{selectedItem.basePrice}</span>
// //               </div>
// //               {customizations.extras.length > 0 && (
// //                 <div className="flex justify-between mb-2">
// //                   <span>Extras:</span>
// //                   <span>+₪{customizations.extras.reduce((sum, e) => sum + e.price, 0)}</span>
// //                 </div>
// //               )}
// //               <div className="border-t pt-2 mt-2">
// //                 <div className="flex justify-between font-bold">
// //                   <span>Total per item:</span>
// //                   <span>₪{selectedItem.basePrice + customizations.extras.reduce((sum, e) => sum + e.price, 0)}</span>
// //                 </div>
// //                 <div className="flex justify-between font-bold text-lg mt-1">
// //                   <span>Total for {customizations.quantity}:</span>
// //                   <span className="text-green-600">₪{(selectedItem.basePrice + customizations.extras.reduce((sum, e) => sum + e.price, 0)) * customizations.quantity}</span>
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="flex gap-3">
// //               <button
// //                 onClick={() => setShowCustomizeModal(false)}
// //                 className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={addCustomizedToCart}
// //                 className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
// //               >
// //                 Add to Cart
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Admin Menu Management Modal */}
// //       {showMenuModal && isAdmin && (
// //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
// //             <div className="flex justify-between items-center mb-4">
// //               <h2 className="text-2xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
// //               <button onClick={() => {
// //                 setShowMenuModal(false);
// //                 setEditingItem(null);
// //                 setImagePreview(null);
// //               }} className="text-gray-500 hover:text-gray-700">
// //                 <X size={24} />
// //               </button>
// //             </div>

// //             <form onSubmit={(e) => {
// //               e.preventDefault();
// //               const formData = new FormData(e.target);
// //               const itemData = {
// //                 id: editingItem?.id,
// //                 name: formData.get('name'),
// //                 price: parseFloat(formData.get('price')),
// //                 weight: formData.get('weight'),
// //                 category: formData.get('category'),
// //                 includes: formData.get('includes') || '',
// //                 available: formData.get('available') === 'on',
// //                 basePrice: parseFloat(formData.get('price')),
// //                 image: editingItem?.image || '',
// //                 imageUrl: editingItem?.imageUrl || '',
// //                 imagePath: editingItem?.imagePath || ''
// //               };
// //               const imageFile = formData.get('imageFile');
// //               handleAddOrUpdateItem(itemData, imageFile);
// //             }}>
// //               {/* Image Upload */}
// //               <div className="mb-4">
// //                 <label className="block font-semibold mb-2">Item Image</label>
// //                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
// //                   {(imagePreview || editingItem?.imageUrl) && (
// //                     <div className="mb-3">
// //                       <img 
// //                         src={imagePreview || editingItem?.imageUrl} 
// //                         alt="Preview" 
// //                         className="w-full h-40 object-cover rounded-lg"
// //                       />
// //                     </div>
// //                   )}
// //                   <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
// //                     <Upload size={18} />
// //                     <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
// //                     <input
// //                       type="file"
// //                       name="imageFile"
// //                       accept="image/*"
// //                       onChange={(e) => {
// //                         const file = e.target.files[0];
// //                         if (file) {
// //                           const reader = new FileReader();
// //                           reader.onloadend = () => {
// //                             setImagePreview(reader.result);
// //                           };
// //                           reader.readAsDataURL(file);
// //                         }
// //                       }}
// //                       className="hidden"
// //                       disabled={uploading}
// //                     />
// //                   </label>
// //                   <p className="text-xs text-gray-500 mt-2">Recommended: 300x300px, Max 2MB</p>
// //                 </div>
// //               </div>

// //               <div className="mb-4">
// //                 <label className="block font-semibold mb-2">Item Name</label>
// //                 <input
// //                   type="text"
// //                   name="name"
// //                   required
// //                   defaultValue={editingItem?.name || ''}
// //                   className="w-full border rounded-lg px-3 py-2"
// //                 />
// //               </div>

// //               <div className="mb-4">
// //                 <label className="block font-semibold mb-2">Price (₪)</label>
// //                 <input
// //                   type="number"
// //                   name="price"
// //                   required
// //                   step="0.01"
// //                   defaultValue={editingItem?.price || ''}
// //                   className="w-full border rounded-lg px-3 py-2"
// //                 />
// //               </div>

// //               <div className="mb-4">
// //                 <label className="block font-semibold mb-2">Weight</label>
// //                 <input
// //                   type="text"
// //                   name="weight"
// //                   required
// //                   defaultValue={editingItem?.weight || ''}
// //                   className="w-full border rounded-lg px-3 py-2"
// //                   placeholder="e.g., 250g"
// //                 />
// //               </div>

// //               <div className="mb-4">
// //                 <label className="block font-semibold mb-2">Category</label>
// //                 <select
// //                   name="category"
// //                   defaultValue={editingItem?.category || tabs[0].id}
// //                   className="w-full border rounded-lg px-3 py-2"
// //                 >
// //                   {tabs.map(tab => (
// //                     <option key={tab.id} value={tab.id}>{tab.name}</option>
// //                   ))}
// //                 </select>
// //               </div>

// //               <div className="mb-4">
// //                 <label className="block font-semibold mb-2">Includes (Optional)</label>
// //                 <input
// //                   type="text"
// //                   name="includes"
// //                   defaultValue={editingItem?.includes || ''}
// //                   className="w-full border rounded-lg px-3 py-2"
// //                   placeholder="e.g., Fries + Drink"
// //                 />
// //               </div>

// //               <div className="mb-4">
// //                 <label className="flex items-center gap-2">
// //                   <input
// //                     type="checkbox"
// //                     name="available"
// //                     defaultChecked={editingItem?.available !== false}
// //                     className="w-4 h-4"
// //                   />
// //                   <span className="font-semibold">Item Available</span>
// //                 </label>
// //               </div>

// //               <div className="flex gap-3 mt-6">
// //                 <button
// //                   type="button"
// //                   onClick={() => {
// //                     setShowMenuModal(false);
// //                     setEditingItem(null);
// //                     setImagePreview(null);
// //                   }}
// //                   className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   type="submit"
// //                   disabled={uploading}
// //                   className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
// //                 >
// //                   {uploading ? 'Uploading...' : (editingItem ? 'Update' : 'Add')}
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default CashierDashboard;

// import React, { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import { ShoppingCart, Plus, Minus, Trash2, Edit2, Upload, X } from 'lucide-react';
// import { db, storage } from '../../firebase';
// import { collection, addDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// function CashierDashboard({ userRole }) {
//   const [cart, setCart] = useState([]);
//   const [customerName, setCustomerName] = useState('');
//   const [sampleMenu, setSampleMenu] = useState({});
//   const [activeTab, setActiveTab] = useState('shawarma');

//   const [showMenuModal, setShowMenuModal] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   const isAdmin = userRole === 'admin';

//   const tabs = [
//     { id: 'shawarma', name: 'Shawarma' },
//     { id: 'plates', name: 'Plates' },
//     { id: 'sandwiches', name: 'Sandwiches' },
//     { id: 'sides', name: 'Sides' },
//     { id: 'drinks', name: 'Drinks' }
//   ];

//   // useEffect(() => {
//   //   const saved = localStorage.getItem('menuItems');
//   //   if (saved) {
//   //     setSampleMenu(JSON.parse(saved));
//   //   } else {
//   //     setSampleMenu({
//   //       shawarma: [],
//   //       plates: [],
//   //       sandwiches: [],
//   //       sides: [],
//   //       drinks: []
//   //     });
//   //   }
//   // }, []);

//   // ✅ UPLOAD IMAGE
//  useEffect(() => {
//   loadMenuData();

//   const handleStorageChange = () => {
//     loadMenuData();
//   };

//   window.addEventListener('storage', handleStorageChange);

//   return () => {
//     window.removeEventListener('storage', handleStorageChange);
//   };
// }, []);


//   const uploadImage = async (id, file) => {
//     try {
//       const imageRef = ref(storage, `menu/${id}_${Date.now()}_${file.name}`);
//       await uploadBytes(imageRef, file);
//       const url = await getDownloadURL(imageRef);
//       return url;
//     } catch (e) {
//       console.error(e);
//       return null;
//     }
//   };

//   // ✅ ADD / UPDATE ITEM
//   const handleSubmitItem = async (e) => {
//     e.preventDefault();

//     const file = e.target.imageFile.files[0];

//     const formData = {
//       id: editingItem?.id || Date.now(),
//       name: e.target.name.value,
//       price: parseFloat(e.target.price.value),
//       weight: e.target.weight.value,
//       category: e.target.category.value,
//       available: e.target.available.checked,
//       imageUrl: editingItem?.imageUrl || ''
//     };

//     if (file) {
//       setUploading(true);
//       const url = await uploadImage(formData.id, file);
//       if (!url) {
//         toast.error('Upload failed');
//         setUploading(false);
//         return;
//       }
//       formData.imageUrl = url;
//       setUploading(false);
//     }

//     let updatedMenu = { ...sampleMenu };

//     if (editingItem) {
//       updatedMenu[formData.category] = updatedMenu[formData.category].map(i =>
//         i.id === formData.id ? formData : i
//       );
//     } else {
//       updatedMenu[formData.category].push(formData);
//     }

//     setSampleMenu(updatedMenu);
//     localStorage.setItem('menuItems', JSON.stringify(updatedMenu));

//     toast.success(editingItem ? 'Updated' : 'Added');

//     setShowMenuModal(false);
//     setEditingItem(null);
//     setImagePreview(null);
//   };

//   // ✅ ADD TO CART
//   const addToCart = (item) => {
//     setCart([...cart, { ...item, quantity: 1 }]);
//   };

//   // ✅ ORDER
//   const handleOrder = async () => {
//     if (cart.length === 0) return;

//     await addDoc(collection(db, 'orders'), {
//       items: cart,
//       total: cart.reduce((t, i) => t + i.price * i.quantity, 0),
//       customerName: customerName || 'Walk-in',
//       createdAt: new Date().toISOString()
//     });

//     toast.success('Order created');
//     setCart([]);
//   };

//   return (
//     <div className="p-6">

//       {/* MENU */}
//       <div className="grid grid-cols-3 gap-6">

//         <div className="col-span-2">
//           {/* Tabs */}
//           <div className="flex gap-2 mb-4">
//             {tabs.map(t => (
//               <button
//                 key={t.id}
//                 onClick={() => setActiveTab(t.id)}
//                 className="px-4 py-2 bg-gray-200 rounded"
//               >
//                 {t.name}
//               </button>
//             ))}
//           </div>

//           {/* Items */}
//           <div className="grid grid-cols-3 gap-4">
//             {sampleMenu[activeTab]?.map(item => (
//               <div key={item.id} className="border p-3 rounded">

//                 {/* ✅ IMAGE FIX */}
//                 {item.imageUrl ? (
//                   <img
//                     src={item.imageUrl}
//                     alt={item.name}
//                     className="w-full h-32 object-cover rounded mb-2"
//                   />
//                 ) : (
//                   <div className="h-32 bg-gray-200 flex items-center justify-center">
//                     No Image
//                   </div>
//                 )}

//                 <h3>{item.name}</h3>
//                 <p>₪{item.price}</p>

//                 <button
//                   onClick={() => addToCart(item)}
//                   className="bg-green-500 text-white px-3 py-1 mt-2"
//                 >
//                   Add
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* CART */}
//         <div>
//           <h2 className="text-xl font-bold mb-2">Cart</h2>

//           {cart.map((item, i) => (
//             <div key={i} className="flex justify-between">
//               <span>{item.name}</span>
//               <span>{item.quantity}</span>
//             </div>
//           ))}

//           <button
//             onClick={handleOrder}
//             className="bg-blue-500 text-white w-full mt-4 py-2"
//           >
//             Complete Order
//           </button>
//         </div>
//       </div>

//       {/* ADMIN */}
//       {isAdmin && (
//         <button
//           onClick={() => setShowMenuModal(true)}
//           className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full"
//         >
//           +
//         </button>
//       )}

//       {/* MODAL */}
//       {showMenuModal && (
//         <div className="fixed inset-0 bg-black flex items-center justify-center">

//           <form onSubmit={handleSubmitItem} className="bg-white p-6 rounded w-96">

//             <h2 className="mb-4">{editingItem ? 'Edit' : 'Add'} Item</h2>

//             {/* PREVIEW */}
//             {imagePreview && (
//               <img src={imagePreview} className="h-32 w-full object-cover mb-3" />
//             )}

//             <input name="name" placeholder="Name" className="w-full mb-2" required />
//             <input name="price" type="number" placeholder="Price" className="w-full mb-2" required />
//             <input name="weight" placeholder="Weight" className="w-full mb-2" required />

//             <select name="category" className="w-full mb-2">
//               {tabs.map(t => <option key={t.id}>{t.id}</option>)}
//             </select>

//             <input type="checkbox" name="available" defaultChecked /> Available

//             {/* ✅ FILE INPUT FIX */}
//             <input
//               type="file"
//               name="imageFile"
//               accept="image/*"
//               onChange={(e) => {
//                 const file = e.target.files[0];
//                 if (file) setImagePreview(URL.createObjectURL(file));
//               }}
//               className="mt-2"
//             />

//             <button className="bg-blue-500 text-white w-full mt-4 py-2">
//               {uploading ? 'Uploading...' : 'Save'}
//             </button>

//           </form>
//         </div>
//       )}
//     </div>
//   );
// }

// export default CashierDashboard;


import React, { useState, useEffect } from 'react';
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
import { subscribeToMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../../services/menuService';

function CashierDashboard({ userRole }) {
  const { t } = useTranslation();
  const [cart, setCart] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState('takeaway');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [activeTab, setActiveTab] = useState('shawarma');
  const [amountReceived, setAmountReceived] = useState('');
  const [menuItems, setMenuItems] = useState({
    shawarma: [],
    plates: [],
    sandwiches: [],
    sides: [],
    drinks: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizations, setCustomizations] = useState({
    extras: [],
    notes: '',
    quantity: 1
  });

  // Admin states for menu management
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Check if user is admin (has edit permissions)
  const isAdmin = userRole === 'admin';

  // Tab configuration
  const tabs = [
    { id: 'shawarma', name: t('cashier.categories.shawarma'), icon: Beef, color: 'bg-red-500' },
    { id: 'plates', name: t('cashier.categories.plates'), icon: Salad, color: 'bg-green-500' },
    { id: 'sandwiches', name: t('cashier.categories.sandwiches'), icon: Sandwich, color: 'bg-orange-500' },
    { id: 'sides', name: t('cashier.categories.sides'), icon: Coffee, color: 'bg-purple-500' },
    { id: 'drinks', name: t('cashier.categories.drinks'), icon: Droplet, color: 'bg-blue-500' }
  ];

  // Available extras
  const availableExtras = [
    { id: 'cheese', name: 'Extra Cheese', price: 3, icon: '🧀' },
    { id: 'spicy', name: 'Spicy Sauce', price: 2, icon: '🌶️' },
    { id: 'bbq', name: 'BBQ Sauce', price: 2, icon: '🍖' },
    { id: 'garlic', name: 'Garlic Sauce', price: 2, icon: '🧄' },
    { id: 'tahini', name: 'Tahini Sauce', price: 2, icon: '🥜' },
    { id: 'extra_meat', name: 'Extra Meat', price: 8, icon: '🥩' },
    { id: 'extra_veggies', name: 'Extra Veggies', price: 3, icon: '🥬' },
    { id: 'pickles', name: 'Extra Pickles', price: 1, icon: '🥒' }
  ];

  // Subscribe to menu from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToMenu((data) => {
      console.log('Menu data received:', data);
      setMenuItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const addToCart = (item) => {
    if (!item.available) {
      toast.error(`${item.name} is currently unavailable`);
      return;
    }

    if (item.category === 'shawarma' || item.category === 'plates' || item.category === 'sandwiches') {
      setSelectedItem(item);
      setCustomizations({ extras: [], notes: '', quantity: 1 });
      setShowCustomizeModal(true);
    } else {
      const cartItem = {
        ...item,
        quantity: 1,
        extras: [],
        totalPrice: item.price,
        customizations: {}
      };
      setCart([...cart, cartItem]);
      toast.success(`${item.name} added to cart`);
    }
  };

  const addCustomizedToCart = () => {
    if (!selectedItem) return;

    const extrasTotal = customizations.extras.reduce((sum, extra) => sum + extra.price, 0);
    const itemTotal = (selectedItem.basePrice + extrasTotal) * customizations.quantity;

    const cartItem = {
      ...selectedItem,
      quantity: customizations.quantity,
      extras: customizations.extras,
      notes: customizations.notes,
      totalPrice: itemTotal,
      basePrice: selectedItem.basePrice,
      extrasTotal: extrasTotal
    };

    setCart([...cart, cartItem]);
    toast.success(`${customizations.quantity}x ${selectedItem.name} added to cart`);
    setShowCustomizeModal(false);
    setSelectedItem(null);
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const toggleExtra = (extra) => {
    setCustomizations(prev => {
      const exists = prev.extras.find(e => e.id === extra.id);
      if (exists) {
        return { ...prev, extras: prev.extras.filter(e => e.id !== extra.id) };
      } else {
        return { ...prev, extras: [...prev.extras, extra] };
      }
    });
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => total + (item.totalPrice || item.price * item.quantity), 0);
    const vat = subtotal * 0.14;
    const service = orderType === 'dinein' ? subtotal * 0.12 : 0;
    const total = subtotal + vat + service;
    return { subtotal, vat, service, total };
  };

  // const printReceipt = (order) => {
  //   try {
  //     console.log('Attempting to print receipt for order:', order);
  //     const { subtotal, vat, service, total } = order.totals;

  //     const receiptWindow = window.open('', 'PRINT', 'height=800,width=400');

  //     if (!receiptWindow) {
  //       console.error('Failed to open receipt window. Pop-up blocker might be active.');
  //       toast.error('Please allow pop-ups to print receipts');
  //       return;
  //     }

  //     const html = `
  //     <html>
  //       <head>
  //         <style>
  //           body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; direction: rtl; }
  //           .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; }
  //           .logo { width: 50px; height: 50px; margin-bottom: 5px; }
  //           .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; text-align: right; }
  //           .info { text-align: right; margin-bottom: 10px; font-size: 12px; }
  //           .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
  //           .summary-item { display: flex; justify-content: space-between; margin-bottom: 3px; text-align: right; }
  //           .footer { margin-top: 20px; font-size: 12px; }
  //           .qr-code { width: 80px; height: 80px; margin-top: 10px; }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="header">
  //           <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  //             <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
  //             <path d="M7 2v20"></path>
  //             <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
  //           </svg>
  //           <h2 style="margin: 5px 0;">Betshawerma</h2>
  //           <p style="font-size:12px; margin:2px 0;">19300 :الخط الساخن</p>
  //           <p style="font-size:12px; margin:2px 0;">55689 :سجل تجاري</p>
  //           <p style="font-size:12px; margin:2px 0;">5-967-522 :بطاقة ضريبية</p>
  //           <p style="font-size:12px; margin:2px 0; margin-top:5px;">${new Date(order.createdAt).toLocaleString()}</p>
  //         </div>
  //         <div class="info">
  //           <div><strong>الكاشير:</strong> ${order.cashierName || 'Cashier'}</div>
  //           <div><strong>رقم الطلب:</strong> #${order.orderNumber}</div>
  //           <div><strong>نوع الطلب:</strong> ${order.orderType === 'dinein' ? 'Dine In' : 'Take Away'}</div>
  //           <div><strong>طريقة الدفع:</strong> ${order.paymentMethod}</div>
  //         </div>
  //         <div style="border-bottom: 1px dashed #000; margin-bottom: 10px;"></div>

  //         <div>${order.items.map(item => {
  //       return `<div class="item"><span>${item.quantity}x ${item.name}</span><span>₪${item.total.toFixed(2)}</span></div>`;
  //     }).join('')}</div>

  //         <div class="total">
  //           <div class="summary-item" style="font-weight:normal;"><span>المجموع الفرعي:</span><span>₪${subtotal.toFixed(2)}</span></div>
  //           <div class="summary-item" style="font-weight:normal;"><span>ضريبة القيمة المضافة (14%):</span><span>₪${vat.toFixed(2)}</span></div>
  //           ${order.orderType === 'dinein' ? `<div class="summary-item" style="font-weight:normal;"><span>الخدمة (12%):</span><span>₪${service.toFixed(2)}</span></div>` : ''}
  //           <div class="summary-item" style="font-size: 18px; margin-top: 5px;"><span>الإجمالي المستحق:</span><span>₪${total.toFixed(2)}</span></div>
  //         </div>

  //         <div class="footer">
  //           <p>شكرا لزيارتكم!</p>
  //           <p style="margin: 5px 0;">امسح الكود لرؤية المنيو:</p>
  //           <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://betshawerma.com/menu" alt="Menu QR Code" class="qr-code" />
  //         </div>
  //       </body>
  //     </html>
  //   `;
  //     receiptWindow.document.write(html);
  //     receiptWindow.document.close();
  //     receiptWindow.focus();

  //     setTimeout(() => {
  //       try {
  //         receiptWindow.print();
  //         receiptWindow.close();
  //         console.log('Print dialog triggered successfully');
  //       } catch (printError) {
  //         console.error('Error during printing:', printError);
  //         toast.error('Failed to trigger print dialog');
  //       }
  //     }, 500);
  //   } catch (err) {
  //     console.error('Critical error in printReceipt function:', err);
  //     toast.error('Error generating receipt');
  //   }
  // };

  // const handleSubmitOrder = async () => {
  //   if (cart.length === 0) {
  //     toast.error('Cart is empty');
  //     return;
  //   }

  //   setIsProcessing(true);
  //   const totals = calculateTotals();
  //   const orderData = {
  //     items: cart.map(item => ({
  //       id: item.id,
  //       name: item.name,
  //       quantity: item.quantity,
  //       price: item.price || item.basePrice,
  //       total: item.totalPrice || item.price * item.quantity,
  //       extras: item.extras || [],
  //       notes: item.notes || ''
  //     })),
  //     total: totals.total,
  //     totals: totals,
  //     orderType,
  //     paymentMethod,
  //     cashierName: 'Cashier',
  //     customerName: customerName || 'Walk-in Customer',
  //     status: 'pending'
  //   };

  //   try {
  //     const ordersRef = collection(db, 'orders');
  //     const newOrder = {
  //       ...orderData,
  //       orderNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
  //       createdAt: new Date().toISOString()
  //     };

  //     // Print the receipt immediately BEFORE hitting the database
  //     // This prevents the popup from being blocked and bypasses any Firebase connection hang-ups
  //     printReceipt(newOrder);

  //     await addDoc(ordersRef, newOrder);

  //     toast.success(`Order #${newOrder.orderNumber} created successfully!`);

  //     const transactionsRef = collection(db, 'transactions');
  //     await addDoc(transactionsRef, {
  //       type: 'income',
  //       amount: totals.total,
  //       description: `Order #${newOrder.orderNumber}`,
  //       category: 'sales',
  //       createdAt: new Date().toISOString()
  //     });

  //     setCart([]);
  //     setCustomerName('');
  //   } catch (error) {
  //     toast.error('Failed to create order');
  //     console.error(error);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const printReceipt = (order) => {
    setReceiptData(order);
    setTimeout(() => {
      window.print();
      setTimeout(() => setReceiptData(null), 1000);
    }, 300);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    const totals = calculateTotals();
    const orderNumber = Math.floor(Math.random() * 9000 + 1000).toString();

    const newOrder = {
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price || item.basePrice,
        total: item.totalPrice || item.price * item.quantity,
        extras: item.extras || [],
        notes: item.notes || ''
      })),
      total: totals.total,
      totals,
      orderType,
      paymentMethod,
      cashierName: 'Cashier',
      customerName: customerName || 'Walk-in Customer',
      status: 'pending',
      orderNumber,
      createdAt: new Date().toISOString(),
      amountReceived: paymentMethod === 'cash' ? (parseFloat(amountReceived) || totals.total) : totals.total,
      change: paymentMethod === 'cash' ? Math.max(0, (parseFloat(amountReceived) || 0) - totals.total) : 0
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);

      await addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount: totals.total,
        description: `Order #${orderNumber}`,
        category: 'sales',
        createdAt: new Date().toISOString()
      });

      toast.success(t('cashier.orderCreated', { number: orderNumber }));

      // ✅ This now works - no popup, uses window.print() instead
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
  };
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
      toast.error('Operation failed');
      console.error(error);
    }
  };

  const handleDeleteItem = async (category, itemId, imagePath) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      if (imagePath) {
        await deleteImage(imagePath);
      }

      try {
        await deleteMenuItem(itemId);
        toast.success('Item deleted successfully!');
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-xl">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Role Badge */}
      <div className="flex justify-between items-center mb-8">
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
                        {/* Image Display */}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        ) : item.image && (item.image.startsWith('data:image') || item.image.startsWith('http')) ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
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
                      {/* Image Display */}
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : item.image && (item.image.startsWith('data:image') || item.image.startsWith('http')) ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          <span className="text-4xl">{item.image || '🍽️'}</span>
                        </div>
                      )}

                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Scale size={14} />
                        <span>{item.weight}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <DollarSign size={14} />
                        <span>₪{item.price}</span>
                      </div>
                      {item.includes && (
                        <p className="text-xs text-green-600 mt-2">{item.includes}</p>
                      )}
                      <button className="mt-3 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full text-sm">
                        {t('cashier.addToOrder')}
                      </button>
                    </div>
                  ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No items available in this category.
                  {isAdmin && ' Click "Add New Item" to add menu items.'}
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
                        {item.extras && item.extras.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {item.extras.map((e, idx) => (
                              <div key={idx} className="flex justify-between max-w-[150px]">
                                <span>+ {e.name}</span>
                                <span>₪{e.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-orange-600 mt-1">Note: {item.notes}</p>
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
                <span>₪{calculateTotals().subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-1">
                <span>{t('cashier.vat')}:</span>
                <span>₪{calculateTotals().vat.toFixed(2)}</span>
              </div>
              {orderType === 'dinein' && (
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>{t('cashier.service')}:</span>
                  <span>₪{calculateTotals().service.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                <span>{t('cashier.total')}:</span>
                <span>₪{calculateTotals().total.toFixed(2)}</span>
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
                  <span>₪{Math.max(0, (parseFloat(amountReceived) || 0) - calculateTotals().total).toFixed(2)}</span>
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
              <p className="text-sm text-gray-600">Base Price: ₪{selectedItem.basePrice}</p>
              <p className="text-sm text-gray-600">Weight: {selectedItem.weight}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-3">Add Extras</h3>
              <div className="space-y-2">
                {availableExtras.map(extra => (
                  <label key={extra.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{extra.icon}</span>
                      <div>
                        <p className="font-medium">{extra.name}</p>
                        <p className="text-sm text-gray-500">+₪{extra.price}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={customizations.extras.some(e => e.id === extra.id)}
                      onChange={() => toggleExtra(extra)}
                      className="w-5 h-5 text-orange-500 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Special Instructions</label>
              <textarea
                value={customizations.notes}
                onChange={(e) => setCustomizations({ ...customizations, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows="2"
                placeholder="e.g., extra spicy, no onions, etc."
              />
            </div>

            <div className="mb-4">
              <label className="block font-semibold mb-2">Quantity</label>
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
              <div className="flex justify-between mb-2">
                <span>Base Price:</span>
                <span>₪{selectedItem.basePrice}</span>
              </div>
              {customizations.extras.length > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Extras:</span>
                  <span>+₪{customizations.extras.reduce((sum, e) => sum + e.price, 0)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total per item:</span>
                  <span>₪{selectedItem.basePrice + customizations.extras.reduce((sum, e) => sum + e.price, 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-1">
                  <span>Total for {customizations.quantity}:</span>
                  <span className="text-green-600">₪{(selectedItem.basePrice + customizations.extras.reduce((sum, e) => sum + e.price, 0)) * customizations.quantity}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addCustomizedToCart}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add to Cart
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
              <h2 className="text-2xl font-bold">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
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
              const itemData = {
                id: editingItem?.id,
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
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
                <label className="block font-semibold mb-2">Item Image</label>
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
                    <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
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
                  <p className="text-xs text-gray-500 mt-2">Recommended: 300x300px, Max 2MB</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">Item Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingItem?.name || ''}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">Price (₪)</label>
                <input
                  type="number"
                  name="price"
                  required
                  step="0.01"
                  defaultValue={editingItem?.price || ''}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">Weight</label>
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
                <label className="block font-semibold mb-2">Weight in kg (for inventory)</label>
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
                <label className="block font-semibold mb-2">Category</label>
                <select
                  name="category"
                  defaultValue={editingItem?.category || tabs[0].id}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {tabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-2">Includes (Optional)</label>
                <input
                  type="text"
                  name="includes"
                  defaultValue={editingItem?.includes || ''}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Fries + Drink"
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
                  <span className="font-semibold">Item Available</span>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : (editingItem ? 'Update' : 'Add')}
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
        <div id="receipt-print-area">
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
              <path d="M7 2v20"></path>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
            </svg>
            <h2 style={{ margin: '5px 0' }}>Betshawerma</h2>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>{t('cashier.receipt.hotline')}: 19300</p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>{t('cashier.receipt.commercialReg')}: 55689</p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>{t('cashier.receipt.taxCard')}: 5-967-522</p>
            <p style={{ fontSize: '12px', margin: '5px 0 2px' }}>
              {new Date(receiptData.createdAt).toLocaleString()}
            </p>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '12px' }}>
            <div><strong>{t('cashier.receipt.cashier')}:</strong> {receiptData.cashierName}</div>
            <div><strong>{t('cashier.receipt.orderNumber')}:</strong> #{receiptData.orderNumber}</div>
            <div><strong>{t('cashier.orderType')}:</strong> {receiptData.orderType === 'dinein' ? t('cashier.dineIn') : t('cashier.takeaway')}</div>
            <div><strong>{t('cashier.paymentMethod')}:</strong> {receiptData.paymentMethod === 'cash' ? t('cashier.cash') : t('cashier.visa')}</div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }} />

          <div>
            {receiptData.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>₪{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                {item.extras && item.extras.length > 0 && item.extras.map((extra, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', paddingRight: '15px' }}>
                    <span>+ {extra.name}</span>
                    <span>₪{(extra.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>{t('cashier.subtotal')}:</span>
              <span>₪{receiptData.totals.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>{t('cashier.vat')}:</span>
              <span>₪{receiptData.totals.vat.toFixed(2)}</span>
            </div>
            {receiptData.orderType === 'dinein' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>{t('cashier.service')}:</span>
                <span>₪{receiptData.totals.service.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginTop: '5px', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
              <span>{t('cashier.total')}:</span>
              <span>₪{receiptData.totals.total.toFixed(2)}</span>
            </div>
            {receiptData.paymentMethod === 'cash' && (
              <div style={{ marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>{t('cashier.amountReceived')}:</span>
                  <span>₪{receiptData.amountReceived.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold' }}>
                  <span>{t('cashier.change')}:</span>
                  <span>₪{receiptData.change.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', fontSize: '12px', textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <p style={{ fontWeight: 'bold' }}>{t('cashier.receipt.thanks')}</p>
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0 0 5px' }}>{t('cashier.receipt.scanMenu')}</p>
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