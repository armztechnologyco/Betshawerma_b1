import React, { useState, useEffect } from 'react';
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

function CashierDashboard({ userRole }) {

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('shawarma');
  const [loading, setLoading] = useState(true);

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const isAdmin = userRole === 'admin';

  const tabs = [
    { id: 'shawarma', name: 'Shawarma', icon: Beef },
    { id: 'plates', name: 'Plates', icon: Salad },
    { id: 'sandwiches', name: 'Sandwiches', icon: Sandwich },
    { id: 'sides', name: 'Sides', icon: Coffee },
    { id: 'drinks', name: 'Drinks', icon: Droplet }
  ];

  const [menu, setMenu] = useState({
    shawarma: [],
    plates: [],
    sandwiches: [],
    sides: [],
    drinks: []
  });

  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('menuItems');
    if (saved) setMenu(JSON.parse(saved));
    
    const savedPurchases = localStorage.getItem('purchases');
    if (savedPurchases) {
      const purchases = JSON.parse(savedPurchases);
      const uniqueItems = Array.from(new Set(purchases.map(p => p.itemName)));
      setInventoryItems(uniqueItems);
    }
    
    setLoading(false);
  }, []);

  const saveMenu = (data) => {
    setMenu(data);
    localStorage.setItem('menuItems', JSON.stringify(data));
  };

  // ✅ Upload Image
  const uploadImage = async (id, file) => {
    try {
      const imageRef = ref(storage, `menu/${id}_${Date.now()}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);

      return { success: true, url, path: imageRef.fullPath };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  // ✅ Delete Image
  const deleteImage = async (path) => {
    if (!path) return;
    try {
      await deleteObject(ref(storage, path));
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ Add / Update Item
  const handleSaveItem = async (data, file) => {
    let imageUrl = editingItem?.imageUrl || null;
    let imagePath = editingItem?.imagePath || null;

    if (file) {
      setUploading(true);

      const res = await uploadImage(data.id || Date.now(), file);

      if (!res.success) {
        toast.error('Upload failed');
        setUploading(false);
        return;
      }

      imageUrl = res.url;
      imagePath = res.path;
      setUploading(false);
    }

    const item = {
      id: editingItem ? data.id : Date.now(),
      name: data.name,
      price: data.price,
      weight: data.weight,
      weightInKg: data.weightInKg || 0,
      linkedInventoryItem: data.linkedInventoryItem || '',
      category: data.category,
      includes: data.includes || '',
      available: data.available,
      basePrice: data.price,

      // ✅ ONLY real URL
      imageUrl,
      imagePath,

      // emoji fallback
      image: data.image && !data.image.startsWith('data:')
        ? data.image
        : '🍽️'
    };

    let updated;

    if (editingItem) {
      updated = {
        ...menu,
        [data.category]: menu[data.category].map(i =>
          i.id === data.id ? item : i
        )
      };
    } else {
      updated = {
        ...menu,
        [data.category]: [...menu[data.category], item]
      };
    }

    saveMenu(updated);

    toast.success(editingItem ? 'Updated' : 'Added');

    setShowMenuModal(false);
    setEditingItem(null);
    setImagePreview(null);
  };

  // ✅ Delete
  const handleDelete = async (cat, id, path) => {
    if (!window.confirm('Delete item?')) return;

    await deleteImage(path);

    const updated = {
      ...menu,
      [cat]: menu[cat].filter(i => i.id !== id)
    };

    saveMenu(updated);
    toast.success('Deleted');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">

      {/* ADMIN */}
      {isAdmin && (
        <div className="mb-8">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowMenuModal(true);
            }}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Item
          </button>

          {Object.entries(menu).map(([cat, items]) => (
            <div key={cat} className="mt-6">
              <h2 className="font-bold text-xl mb-3">{cat}</h2>

              <div className="grid grid-cols-3 gap-4">
                {items.map(item => (
                  <div key={item.id} className="border p-3 rounded">

                    {/* ✅ IMAGE FIX */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-32 object-cover mb-2 rounded"
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-4xl">
                        {item.image || '🍽️'}
                      </div>
                    )}

                    <h3>{item.name}</h3>
                    <p>${item.price}</p>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowMenuModal(true);
                          setImagePreview(item.imageUrl);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(cat, item.id, item.imagePath)}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">

          <div className="bg-white p-6 rounded w-96">

            <form onSubmit={(e) => {
              e.preventDefault();

              const fd = new FormData(e.target);

              const file = fd.get('imageFile');
              const validFile = file && file.size > 0 ? file : null;

              handleSaveItem({
                id: editingItem?.id,
                name: fd.get('name'),
                price: parseFloat(fd.get('price')),
                weight: fd.get('weight'),
                weightInKg: parseFloat(fd.get('weightInKg')) || 0,
                linkedInventoryItem: fd.get('linkedInventoryItem'),
                category: fd.get('category'),
                includes: fd.get('includes'),
                available: fd.get('available') === 'on'
              }, validFile);

            }}>

              {/* PREVIEW */}
              {imagePreview && (
                <img src={imagePreview} className="h-32 mb-3 w-full object-cover" />
              )}

              <input type="file" name="imageFile"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result);
                  reader.readAsDataURL(file);
                }}
              />

              <input name="name" defaultValue={editingItem?.name} placeholder="Name" required />
              <input name="price" type="number" defaultValue={editingItem?.price} required />
              <input name="weight" defaultValue={editingItem?.weight} placeholder="Weight description (e.g. 150g)" onChange={(e) => {
                const val = e.target.value;
                const numMatch = val.match(/[\d.]+/);
                if (numMatch) {
                  const num = parseFloat(numMatch[0]);
                  if (!isNaN(num)) {
                    const kgValue = val.toLowerCase().includes('kg') ? num : num / 1000;
                    const kgInput = e.target.form.elements['weightInKg'];
                    if (kgInput) kgInput.value = kgValue;
                  }
                } else if (val === '') {
                  const kgInput = e.target.form.elements['weightInKg'];
                  if (kgInput) kgInput.value = '';
                }
              }} required />

              <input name="weightInKg" type="number" step="0.01" defaultValue={editingItem?.weightInKg} placeholder="Weight in KG (for inventory)" />
              <select name="linkedInventoryItem" defaultValue={editingItem?.linkedInventoryItem || ""}>
                <option value="">-- No Inventory Link --</option>
                {inventoryItems.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <select name="category" defaultValue={editingItem?.category}>
                {tabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save'}
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierDashboard;