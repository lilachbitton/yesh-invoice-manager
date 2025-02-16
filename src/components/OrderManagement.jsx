import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');
  const [deliveryDays, setDeliveryDays] = useState({});
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [productsMap, setProductsMap] = useState({});

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
          PageSize: 1000,
          PageNumber: 1
        })
      });
      
      const data = await response.json();
      if (data.Success && data.ReturnValue) {
        const mapping = {};
        data.ReturnValue.forEach(product => {
          mapping[product.sku] = product.name;
        });
        setProductsMap(mapping);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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
          docTypeID: 2,
          from: "2024-01-01",
          to: "2025-12-31"
        })
      });
      
      const data = await response.json();
      if (data.Success && data.ReturnValue) {
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
      await fetchProducts();
      await fetchOrders();
    };
    loadData();
  }, []);

  const assignDeliveryDay = (orderId, day) => {
    setDeliveryDays(prev => ({
      ...prev,
      [orderId]: day
    }));
  };

  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const calculateTotalItems = (items) => {
    return items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  };

  const generateSummaryReport = () => {
    if (!selectedDay) return;

    const ordersForDay = orders.filter(order => deliveryDays[order.ID] === selectedDay);
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

    setSelectedOrderDetails({
      type: 'summary',
      day: selectedDay,
      products: Object.entries(productTotals).map(([name, quantity]) => ({
        name,
        quantity
      }))
    });
  };

  const generateDetailedReport = () => {
    if (!selectedDay) return;
    const ordersForDay = orders.filter(order => deliveryDays[order.ID] === selectedDay);
    setSelectedOrderDetails({
      type: 'detailed',
      day: selectedDay,
      orders: ordersForDay
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="main-container">
      <h1 className="section-title">הזמנות פתוחות</h1>
      <table className="main-table">
        <thead>
          <tr>
            <th>מספר הזמנה</th>
            <th>תאריך</th>
            <th>שם לקוח</th>
            <th>סה"כ פריטים</th>
            <th>יום חלוקה</th>
            <th>פרטים</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.ID}>
              <td>{order.DocumentNumber}</td>
              <td>{formatDate(order.Date)}</td>
              <td>{order.CustomerName}</td>
              <td>{calculateTotalItems(order.items)}</td>
              <td>
                <div className="flex gap-2">
                  <select
                    value={deliveryDays[order.ID] || ''}
                    onChange={(e) => assignDeliveryDay(order.ID, e.target.value)}
                    className="select-box"
                  >
                    <option value="">בחר יום</option>
                    <option value="sunday">ראשון</option>
                    <option value="monday">שני</option>
                    <option value="tuesday">שלישי</option>
                    <option value="wednesday">רביעי</option>
                    <option value="thursday">חמישי</option>
                  </select>
                </div>
              </td>
              <td>
                <button 
                  className="action-button"
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

      <div className="reports-section">
        <h2 className="section-title">דוחות</h2>
        <div className="flex gap-2 items-center">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="select-box"
          >
            <option value="">בחר יום</option>
            <option value="sunday">ראשון</option>
            <option value="monday">שני</option>
            <option value="tuesday">שלישי</option>
            <option value="wednesday">רביעי</option>
            <option value="thursday">חמישי</option>
          </select>
          <button
            className="report-button"
            disabled={!selectedDay}
            onClick={generateSummaryReport}
          >
            הפק דוח מרוכז
          </button>
          <button
            className="report-button"
            disabled={!selectedDay}
            onClick={generateDetailedReport}
          >
            הפק דוח מפורט
          </button>
        </div>
      </div>

      {selectedOrderDetails?.type === 'single' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              פרטי הזמנה {selectedOrderDetails.order.DocumentNumber}
            </h3>
            <p className="mb-2">לקוח: {selectedOrderDetails.order.CustomerName}</p>
            <table className="report-table">
              <thead>
                <tr>
                  <th>שם מוצר</th>
                  <th>כמות</th>
                  <th>מחיר ליחידה</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderDetails.order.items?.map((item, index) => (
                  <tr key={index}>
                    <td>{productsMap[item.sku] || `מוצר ${item.sku}`}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              className="action-button mt-4"
              onClick={() => setSelectedOrderDetails(null)}
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {selectedOrderDetails?.type === 'summary' && (
        <div className="mt-6">
          <h3 className="report-title">דוח מרוכז - יום {getDayName(selectedOrderDetails.day)}</h3>
          <table className="report-table">
            <tbody>
              {selectedOrderDetails.products.map((product, index) => (
                <tr key={index}>
                  <td>{product.name}</td>
                  <td className="report-total">{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrderDetails?.type === 'detailed' && (
        <div className="mt-6">
          <h3 className="report-title">דוח מפורט - יום {getDayName(selectedOrderDetails.day)}</h3>
          {selectedOrderDetails.orders.map((order, orderIndex) => (
            <div key={orderIndex} className="mb-6">
              <h4 className="font-bold mb-2">
                הזמנה {order.DocumentNumber} - {order.CustomerName}
              </h4>
              <table className="report-table">
                <tbody>
                  {order.items?.map((item, itemIndex) => (
                    <tr key={itemIndex}>
                      <td>{productsMap[item.sku] || `מוצר ${item.sku}`}</td>
                      <td className="report-total">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;