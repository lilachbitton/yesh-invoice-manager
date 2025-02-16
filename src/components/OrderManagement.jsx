import React, { useState, useEffect } from 'react';
import { Loader2, Filter, X, FileText, ClipboardList, Eye } from 'lucide-react';

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
            secret: "094409be-bb9c-4a51-b3b5-2d15dc2d2154",
            userkey: "CWKaRN8167zMA5niguEf"
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
            secret: "094409be-bb9c-4a51-b3b5-2d15dc2d2154",
            userkey: "CWKaRN8167zMA5niguEf"
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
      sunday: 'ראשון',
      monday: 'שני',
      tuesday: 'שלישי',
      wednesday: 'רביעי',
      thursday: 'חמישי'
    };
    return days[day];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול הזמנות</h1>
          <p className="text-gray-600">ניהול ומעקב אחר הזמנות פתוחות במערכת</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {orders.length}
                </div>
                <div className="text-gray-600">הזמנות פתוחות</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {Object.keys(deliveryDays).length}
                </div>
                <div className="text-gray-600">הזמנות משובצות</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {orders.length - Object.keys(deliveryDays).length}
                </div>
                <div className="text-gray-600">הזמנות ממתינות</div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">רשימת הזמנות</h2>
                  <div className="flex gap-4">
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter className="w-4 h-4" />
                      סינון
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        מספר הזמנה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        תאריך
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        שם לקוח
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        סה"כ פריטים
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        יום חלוקה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map(order => (
                      <tr key={order.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.DocumentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.Date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.CustomerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {calculateTotalItems(order.items)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={deliveryDays[order.ID] || ''}
                            onChange={(e) => assignDeliveryDay(order.ID, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="">בחר יום</option>
                            <option value="sunday">ראשון</option>
                            <option value="monday">שני</option>
                            <option value="tuesday">שלישי</option>
                            <option value="wednesday">רביעי</option>
                            <option value="thursday">חמישי</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => setSelectedOrderDetails({
                              type: 'single',
                              order: order
                            })}
                            className="inline-flex items-center gap-2 px-3 py-1 text-sm text-primary-700 hover:text-primary-900"
                          >
                            <Eye className="w-4 h-4" />
                            פרטים
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reports Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">הפקת דוחות</h2>
              </div>
              <div className="p-6">
                <div className="flex gap-4 items-center">
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="">בחר יום</option>
                    <option value="sunday">ראשון</option>
                    <option value="monday">שני</option>
                    <option value="tuesday">שלישי</option>
                    <option value="wednesday">רביעי</option>
                    <option value="thursday">חמישי</option>
                  </select>
                  
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    disabled={!selectedDay}
                    onClick={generateSummaryReport}
                  >
                    <FileText className="w-4 h-4" />
                    דוח מרוכז
                  </button>
                  
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    disabled={!selectedDay}
                    onClick={generateDetailedReport}
                  >
                    <ClipboardList className="w-4 h-4" />
                    דוח מפורט
                  </button>
                </div>
              </div>
            </div>

            {/* Modal for Order Details */}
            {selectedOrderDetails?.type === 'single' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">
                        פרטי הזמנה {selectedOrderDetails.order.DocumentNumber}
                      </h3>
                      <button 
                        onClick={() => setSelectedOrderDetails(null)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-sm text-gray-500">לקוח</p>
                      <p className="text-lg font-medium text-gray-900">{selectedOrderDetails.order.CustomerName}</p>
                    </div>
                    
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">שם מוצר</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">כמות</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">מחיר ליחידה</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrderDetails.order.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {productsMap[item.sku] || `מוצר ${item.sku}`}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Report Section */}
            {selectedOrderDetails?.type === 'summary' && (
              <div className="mt-8 bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    דוח מרוכז - יום {getDayName(selectedOrderDetails.day)}
                  </h3>
                </div>
                <div className="p-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">כמות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrderDetails.products.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{product.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Report Section */}
            {selectedOrderDetails?.type === 'detailed' && (
              <div className="mt-8 bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    דוח מפורט - יום {getDayName(selectedOrderDetails.day)}
                  </h3>
                </div>
                <div className="p-6">
                  {selectedOrderDetails.orders.map((order, orderIndex) => (
                    <div key={orderIndex} className="mb-8 last:mb-0">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        הזמנה {order.DocumentNumber} - {order.CustomerName}
                      </h4>
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">כמות</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {order.items?.map((item, itemIndex) => (
                            <tr key={itemIndex} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {productsMap[item.sku] || `מוצר ${item.sku}`}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
