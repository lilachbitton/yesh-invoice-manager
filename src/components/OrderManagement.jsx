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
          PageSize: 1000,
          PageNumber: 1
        })
      });
      
      const data = await response.json();
      console.log('Products response:', data);
      
      if (data.Success && data.ReturnValue) {
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
      console.log('API Response:', data);
      
      if (data.Success && data.ReturnValue && data.ReturnValue.length > 0) {
        console.log('First Order Full Details:', JSON.stringify(data.ReturnValue[0], null, 2));
        console.log('First Order Items:', data.ReturnValue[0].items);
        
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
      await fetchProducts();
      await fetchOrders();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="table-container mb-6">
        <h2 className="text-2xl font-bold">הזמנות פתוחות</h2>
        <div className="table-wrapper">
          <table className="data-table">
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
                    <select
                      value={deliveryDays[order.ID] || ''}
                      onChange={(e) => assignDeliveryDay(order.ID, e.target.value)}
                      className="select-input"
                    >
                      <option value="">בחר יום</option>
                      <option value="sunday">ראשון</option>
                      <option value="monday">שני</option>
                      <option value="tuesday">שלישי</option>
                      <option value="wednesday">רביעי</option>
                      <option value="thursday">חמישי</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary"
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

      <div className="table-container">
        <h2 className="text-2xl font-bold mb-4">דוחות</h2>
        <div className="flex gap-4 items-center">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="select-input"
          >
            <option value="">בחר יום</option>
            <option value="sunday">ראשון</option>
            <option value="monday">שני</option>
            <option value="tuesday">שלישי</option>
            <option value="wednesday">רביעי</option>
            <option value="thursday">חמישי</option>
          </select>
          <button
            className="btn btn-success"
            disabled={!selectedDay}
            onClick={generateSummaryReport}
          >
            הפק דוח מרוכז
          </button>
          <button
            className="btn btn-primary"
            disabled={!selectedDay}
            onClick={generateDetailedReport}
          >
            הפק דוח מפורט
          </button>
        </div>
      </div>

      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="table-container max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            {selectedOrderDetails.type === 'single' && (
              <>
                <h3 className="text-xl font-bold mb-4">
                  פרטי הזמנה {selectedOrderDetails.order.DocumentNumber}
                </h3>
                <p className="mb-2">לקוח: {selectedOrderDetails.order.CustomerName}</p>
                <table className="data-table">
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
              </>
            )}

            {selectedOrderDetails.type === 'summary' && (
              <>
                <h3 className="text-xl font-bold mb-4">
                  דוח מרוכז - יום {getDayName(selectedOrderDetails.day)}
                </h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>שם מוצר</th>
                      <th>כמות כוללת</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderDetails.products.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.quantity}</td>
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
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>שם מוצר</th>
                          <th>כמות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((item, itemIndex) => (
                          <tr key={itemIndex}>
                            <td>{productsMap[item.sku] || `מוצר ${item.sku}`}</td>
                            <td>{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            )}

            <button 
              className="btn btn-primary mt-4"
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