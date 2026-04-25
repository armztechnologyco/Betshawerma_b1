import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, CookingPot } from 'lucide-react';
import { getKitchenOrders, updateOrderStatus } from '../../services/firebaseService';

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const ordersData = await getKitchenOrders();
      setOrders(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 border-yellow-500';
      case 'preparing': return 'bg-blue-100 border-blue-500';
      case 'ready': return 'bg-green-100 border-green-500';
      default: return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">👨‍🍳 Kitchen Display</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-xl">No pending orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className={`border-l-4 rounded-lg shadow-lg p-6 ${getStatusColor(order.status)}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
                  <p className="text-gray-600 text-sm">
                    <Clock className="inline-block mr-1" size={14} />
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-white rounded-full text-sm font-semibold">
                  {order.status}
                </span>
              </div>

              <div className="border-t border-b py-4 mb-4">
                <p className="font-semibold mb-2">Customer: {order.customerName}</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-semibold">₪{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="font-bold text-lg">
                  Total: ₪{order.total}
                </div>
                <div className="space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      <CookingPot className="inline mr-1" size={16} />
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      <CheckCircle className="inline mr-1" size={16} />
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KitchenDisplay;