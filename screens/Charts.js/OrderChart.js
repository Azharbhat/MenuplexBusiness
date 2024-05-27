import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function OrderChart({ orderData, selectedPeriod }) {
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });

  useEffect(() => {
    setLoading(true); // Set loading to true when changing selected period

    // Filter and format data based on the selected period
    const filterAndFormatData = () => {
      if (!orderData || orderData.length === 0) return;

      let labels = [];
      let orderCounts = []; // Array to store the number of orders

      switch (selectedPeriod) {
       case 'today':
  // Calculate number of orders for each hour
  for (let i = 0; i < 24; i++) {
    const orderCount = orderData.filter(order => new Date(order.timestamp).getHours() === i).length;

    // Format the hour in 12-hour format with AM/PM
    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const ampm = i < 12 ? 'AM' : 'PM';

    labels.push(`${hour} ${ampm}`);
    orderCounts.push(orderCount);
  }
  break;

        case 'week':
          // Calculate number of orders for each day of the week
          const weekStart = new Date();
          weekStart.setHours(0, 0, 0, 0);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get the start of the current week (Sunday)
          for (let i = 0; i < 7; i++) {
            const orderCount = orderData.filter(order => {
              const orderDate = new Date(order.timestamp);
              return orderDate >= weekStart && orderDate < new Date(weekStart).setDate(weekStart.getDate() + 1);
            }).length;
            labels.push(new Date(weekStart).toLocaleDateString());
            orderCounts.push(orderCount);
            weekStart.setDate(weekStart.getDate() + 1);
          }
          break;
        case 'month':
          // Calculate number of orders for each month
          for (let i = 0; i < 12; i++) {
            const orderCount = orderData.filter(order => new Date(order.timestamp).getMonth() === i).length;
            labels.push(getMonthName(i));
            orderCounts.push(orderCount);
          }
          break;
        case 'year':
          // Calculate number of orders for each year of the last 4 years and the current year
          const currentYear = new Date().getFullYear();
          for (let i = currentYear - 4; i <= currentYear; i++) {
            const orderCount = orderData.filter(order => new Date(order.timestamp).getFullYear() === i).length;
            labels.push(i.toString());
            orderCounts.push(orderCount);
          }
          break;
        default:
          break;
      }

      setChartData({ labels, datasets: [{ data: orderCounts }] });
      setLoading(false);
    };

    filterAndFormatData();
  }, [orderData, selectedPeriod]);

  const screenWidth = Dimensions.get('window').width;

  // Function to get month name from month number
  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  };

  return (
    <View>
      {/* Loading indicator */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        // Chart component
        <BarChart
          data={chartData}
          width={365}
          height={200}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={{
            marginVertical: 0,
            borderRadius: 16,
            fontSize:10
          }}
          yAxisInterval={1}
          yAxisSuffix=""
          fromZero
          withVerticalLabels
          verticalLabelRotation={-90} // Rotate labels vertically
        />
      )}
    </View>
  );
}
