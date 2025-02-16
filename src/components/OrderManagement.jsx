import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');
  const [deliveryDays, setDeliveryDays] = useState({});
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [productsMap, setProductsMap] = useState({});  // מיפוי SKU -> שם מוצר
  
  // טעינת כל המוצרים
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://api.yeshinvoice.co.il/api/v1/getAllProducts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify({
            "secret": "094409be-bb9c-4a51-b3b5-2d15dc2d2154",
            "userkey": "CWKaRN8167zMA5niguEf"
          })
        },
        body: JSON.stringify({
          PageSize: 1000,  // מספר גדול כדי לקבל את כל המוצרים
          PageNumber: 1
        })
      });
      
      const data = await response.json();
      console.log('Products response:', data);
      
      if (data.Success && data.ReturnValue) {
        // יצירת מיפוי SKU -> שם מוצר
        const mapping = {};
        data.ReturnValue.forEach(product => {
          mapping[product.sku] = product.name;
        });
        setProductsMap(mapping);
        console.log('Products mapping:', mapping);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  
  // Fetch open orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('https://api.yeshinvoice.co.il/api/v1/getOpenInvoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify({
            "secret": "094409be-bb9c-4a51-b3b5-2d15dc2d2154",
            "userkey": "CWKaRN8167zMA5niguEf"
          })
        },
        body: JSON.stringify({
          CustomerID: -1,
          PageSize: 100,
          PageNumber: 1,
          docTypeID: 2,  // רק הזמנות
          from: "2024-01-01",
          to: "2025-12-31"
        })
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // לוג מפורט של ההזמנה הראשונה
      if (data.Success && data.ReturnValue && data.ReturnValue.length > 0) {
        console.log('First Order Full Details:', JSON.stringify(data.ReturnValue[0], null, 2));
        console.log('First Order Items:', data.ReturnValue[0].items);
        
        // בדיקה האם יש מאפיין items
        const hasItems = data.ReturnValue.some(order => order.items && order.items.length > 0);
        console.log('Any order has items?', hasItems);
        
        setOrders(data.ReturnValue);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProducts();  // קודם טוען את המוצרים
      await fetchOrders();    // אז את ההזמנות
      setLoading(false);
    };
    loadData();
  }, []);

  const assignDeliveryDay = (orderId, day) => {
    setDeliveryDays(prev => ({
      ...prev,
      [orderId]: day
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const calculateTotalItems = (items) => {
    return items?.reduce((sum, item) => sum + (item.Quantity || 0), 0) || 0;
  };

  // הפקת דוח מרוכז
  const generateSummaryReport = () => {
    if (!selectedDay) return;

    // מסנן הזמנות לפי יום נבחר
    const ordersForDay = orders.filter(order => deliveryDays[order.ID] === selectedDay);
    
    // מרכז כמויות לפי מוצרים
    const productTotals = {};
    
    ordersForDay.forEach(order => {
      order.items?.forEach(item => {
        const productName = productsMap[item.sku] || `מוצר ${item.sku}`;
        if (!productTotals[productName]) {
          productTotals[productName] = 0;
        }
        productTotals[productName] += item.quantity;
      });
    });

    // מציג את הדוח
    setSelectedOrderDetails({
      type: 'summary',
      day: selectedDay,
      products: Object.entries(productTotals).map(([name, quantity]) => ({
        name,
        quantity
      }))
    });
  };

  // הפקת דוח מפורט
  const generateDetailedReport = () => {
    if (!selectedDay) return;

    const ordersForDay = orders.filter(order => deliveryDays[order.ID] === selectedDay);
    
    setSelectedOrderDetails({
      type: 'detailed',
      day: selectedDay,
      orders: ordersForDay.map(order => ({
        documentNumber: order.DocumentNumber,
        customerName: order.CustomerName,
        items: order.items
      }))
    });
  };

  const getDayName = (day) => {
    const days = {
      'sunday': 'ראשון',
      'monday': 'שני',
      'tuesday': 'שלישי',
      'wednesday': 'רביעי',
      'thursday': 'חמישי'
    };
    return days[day];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">הזמנות פתוחות</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-right font-medium text-gray-900">מספר הזמנה</th>
                <th className="px-4 py-2 text-right font-medium text-gray-900">תאריך</th>
                <th className="px-4 py-2 text-right font-medium text-gray-900">שם לקוח</th>
                <th className="px-4 py-2 text-right font-medium text-gray-900">סה"כ פריטים</th>
                <th className="px-4 py-2 text-right font-medium text-gray-900">יום חלוקה</th>
                <th className="px-4 py-2 text-right font-medium text-gray-900">פרטים</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.ID} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{order.DocumentNumber}</td>
                  <td className="px-4 py-2 text-gray-900">{formatDate(order.Date)}</td>
                  <td className="px-4 py-2 text-gray-900">{order.CustomerName}</td>
                  <td className="px-4 py-2 text-gray-900">{calculateTotalItems(order.items)}</td>
                  <td className="px-4 py-2">
                    <select
                      value={deliveryDays[order.ID] || ''}
                      onChange={(e) => assignDeliveryDay(order.ID, e.target.value)}
                      className="w-full border rounded-md px-2 py-1"
                    >
                      <option value="">בחר יום</option>
                      <option value="sunday">ראשון</option>
                      <option value="monday">שני</option>
                      <option value="tuesday">שלישי</option>
                      <option value="wednesday">רביעי</option>
                      <option value="thursday">חמישי</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      onClick={() => setSelectedOrderDetails({
                        type: 'single',
                        order: order
                      })}
                    >
                      הצג מוצרים
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">דוחות</h2>
        <div className="flex gap-4 items-center">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="border rounded-md px-2 py-1"
          >
            <option value="">בחר יום</option>
            <option value="sunday">ראשון</option>
            <option value="monday">שני</option>
            <option value="tuesday">שלישי</option>
            <option value="wednesday">רביעי</option>
            <option value="thursday">חמישי</option>
          </select>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            disabled={!selectedDay}
            onClick={generateSummaryReport}
          >
            הפק דוח מרוכז
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!selectedDay}
            onClick={generateDetailedReport}
          >
            הפק דוח מפורט
          </button>
        </div>
      </div>

      {/* Modal for Order Details */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            {selectedOrderDetails.type === 'single' && (
              <>
                <h3 className="text-xl font-bold mb-4">
                  פרטי הזמנה {selectedOrderDetails.order.DocumentNumber}
                </h3>
                <p className="mb-2">לקוח: {selectedOrderDetails.order.CustomerName}</p>
                <table className="w-full mb-4">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right">שם מוצר</th>
                      <th className="px-4 py-2 text-right">כמות</th>
                      <th className="px-4 py-2 text-right">מחיר ליחידה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderDetails.order.items?.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{productsMap[item.sku] || `מוצר ${item.sku}`}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {selectedOrderDetails.type === 'summary' && (
              <>
                <h3 className="text-xl font-bold mb-4">
                  דוח מרוכז - יום {getDayName(selectedOrderDetails.day)}
                </h3>
                <table className="w-full mb-4">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right">שם מוצר</th>
                      <th className="px-4 py-2 text-right">כמות כוללת</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderDetails.products.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{product.name}</td>
                        <td className="px-4 py-2">{product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {selectedOrderDetails.type === 'detailed' && (
              <>
                <h3 className="text-xl font-bold mb-4">
                  דוח מפורט - יום {getDayName(selectedOrderDetails.day)}
                </h3>
                {selectedOrderDetails.orders.map((order, orderIndex) => (
                  <div key={orderIndex} className="mb-6 border-b pb-4">
                    <h4 className="font-bold mb-2">
                      הזמנה {order.documentNumber} - {order.customerName}
                    </h4>
                    <table className="w-full mb-4">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right">שם מוצר</th>
                          <th className="px-4 py-2 text-right">כמות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item, itemIndex) => (
                          <tr key={itemIndex} className="border-b">
                            <td className="px-4 py-2">{item.Name}</td>
                            <td className="px-4 py-2">{item.Quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            )}

            <button 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => setSelectedOrderDetails(null)}
            >
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;