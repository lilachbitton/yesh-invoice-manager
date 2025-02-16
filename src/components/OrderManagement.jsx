import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Product {
  sku: string;
  name: string;
}

interface OrderItem {
  sku: string;
  quantity: number;
  price: number;
  Name?: string;
  Quantity?: number;
}

interface Order {
  ID: string;
  DocumentNumber: string;
  Date: string;
  CustomerName: string;
  items: OrderItem[];
}

interface DeliveryDays {
  [key: string]: string;
}

interface ProductsMap {
  [key: string]: string;
}

interface OrderDetails {
  type: 'single' | 'summary' | 'detailed';
  day?: string;
  order?: Order;
  products?: Array<{ name: string; quantity: number }>;
  orders?: Array<{ documentNumber: string; customerName: string; items: OrderItem[] }>;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');
  const [deliveryDays, setDeliveryDays] = useState<DeliveryDays>({});
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [productsMap, setProductsMap] = useState<ProductsMap>({});

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://api.yeshinvoice.co.il/api/v1/getAllProducts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify({
            secret: process.env.NEXT_PUBLIC_API_SECRET,
            userkey: process.env.NEXT_PUBLIC_API_USERKEY,
          }),
        },
        body: JSON.stringify({
          PageSize: 1000,
          PageNumber: 1,
        }),
      });

      const data = await response.json();

      if (data.Success && data.ReturnValue) {
        const mapping: ProductsMap = {};
        data.ReturnValue.forEach((product: Product) => {
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
            secret: process.env.NEXT_PUBLIC_API_SECRET,
            userkey: process.env.NEXT_PUBLIC_API_USERKEY,
          }),
        },
        body: JSON.stringify({
          CustomerID: -1,
          PageSize: 100,
          PageNumber: 1,
          docTypeID: 2,
          from: '2024-01-01',
          to: '2025-12-31',
        }),
      });

      const data = await response.json();

      if (data.Success && data.ReturnValue?.length > 0) {
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

  const assignDeliveryDay = (orderId: string, day: string) => {
    setDeliveryDays((prev) => ({
      ...prev,
      [orderId]: day,
    }));
  };

  const formatDate = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const calculateTotalItems = (items?: OrderItem[]): number => {
    return items?.reduce((sum, item) => sum + (item.Quantity || item.quantity || 0), 0) || 0;
  };

  const generateSummaryReport = () => {
    if (!selectedDay) return;

    const ordersForDay = orders.filter((order) => deliveryDays[order.ID] === selectedDay);

    const productTotals: { [key: string]: number } = {};

    ordersForDay.forEach((order) => {
      order.items?.forEach((item) => {
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
        quantity,
      })),
    });
  };

  const generateDetailedReport = () => {
    if (!selectedDay) return;

    const ordersForDay = orders.filter((order) => deliveryDays[order.ID] === selectedDay);

    setSelectedOrderDetails({
      type: 'detailed',
      day: selectedDay,
      orders: ordersForDay.map((order) => ({
        documentNumber: order.DocumentNumber,
        customerName: order.CustomerName,
        items: order.items,
      })),
    });
  };

  const getDayName = (day: string): string => {
    const days: { [key: string]: string } = {
      sunday: 'ראשון',
      monday: 'שני',
      tuesday: 'שלישי',
      wednesday: 'רביעי',
      thursday: 'חמישי',
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
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>הזמנות פתוחות</CardTitle>
        </CardHeader>
        <CardContent>
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
                {orders.map((order) => (
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
                        onClick={() =>
                          setSelectedOrderDetails({
                            type: 'single',
                            order: order,
                          })
                        }
                      >
                        הצג מוצרים
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>דוחות</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <CardContent>
              {selectedOrderDetails.type === 'single' && selectedOrderDetails.order && (
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
                          <td className="px-4 py-2">
                            {productsMap[item.sku] || `מוצר ${item.sku}`}
                          </td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">{item.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {selectedOrderDetails.type === 'summary' && selectedOrderDetails.products && (
                <>
                  <h3 className="text-xl font-bold mb-4">
                    דוח מרוכז - יום {getDayName(selectedOrderDetails.day || '')}
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

              {selectedOrderDetails.type === 'detailed' && selectedOrderDetails.orders && (
                <>
                  <h3 className="text-xl font-bold mb-4">
                    דוח מפורט - יום {getDayName(selectedOrderDetails.day || '')}
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
                              <td className="px-4 py-2">
                                {productsMap[item.sku] || `מוצר ${item.sku}`}
                              </td>
                              <td className="px-4 py-2">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </>
              )}

              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => setSelectedOrderDetails(null)}
              >
                סגור
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
