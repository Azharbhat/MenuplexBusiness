import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export default function Chart({ orderData, selectedPeriod }) {
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });

  useEffect(() => {
    setLoading(true); // Set loading to true when changing selected period

    // Filter and format data based on the selected period
    const filterAndFormatData = () => {
      if (!orderData || orderData.length === 0) return;

      let labels = [];
      let prices = [];

      switch (selectedPeriod) {
        case 'today':
          // Calculate total prices for each hour
          for (let i = 0; i < 24; i++) {
            const totalPrice = orderData
              .filter(order => new Date(order.timestamp).getHours() === i)
              .reduce((sum, order) => sum + order.totalPrice, 0);
        
            // Format the hour in 12-hour format with AM/PM
            const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
            const ampm = i < 12 ? 'AM' : 'PM';
        
            labels.push(`${hour} ${ampm}`);
            prices.push(totalPrice);
          }
          break;
        
        case 'week':
          // Calculate total prices for each day of the week
          const weekStart = new Date();
          weekStart.setHours(0, 0, 0, 0);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get the start of the current week (Sunday)
          for (let i = 0; i < 7; i++) {
            const totalPrice = orderData
              .filter(order => {
                const orderDate = new Date(order.timestamp);
                return orderDate >= weekStart && orderDate < new Date(weekStart).setDate(weekStart.getDate() + 1);
              })
              .reduce((sum, order) => sum + order.totalPrice, 0);
            labels.push(new Date(weekStart).toLocaleDateString());
            prices.push(totalPrice);
            weekStart.setDate(weekStart.getDate() + 1);
          }
          break;
        case 'month':
          // Calculate total prices for each month
          for (let i = 0; i < 12; i++) {
            const totalPrice = orderData
              .filter(order => new Date(order.timestamp).getMonth() === i)
              .reduce((sum, order) => sum + order.totalPrice, 0);
            labels.push(getMonthName(i));
            prices.push(totalPrice);
          }
          break;
        case 'year':
          // Calculate total prices for each year of the last 4 years and the current year
          const currentYear = new Date().getFullYear();
          for (let i = currentYear - 4; i <= currentYear; i++) {
            const totalPrice = orderData
              .filter(order => new Date(order.timestamp).getFullYear() === i)
              .reduce((sum, order) => sum + order.totalPrice, 0);
            labels.push(i.toString());
            prices.push(totalPrice);
          }
          break;
        default:
          break;
      }

      setChartData({ labels, datasets: [{ data: prices }] });
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
        <LineChart
          data={chartData}
          width={365}
          height={200}
          yAxisLabel="Rs"
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
            propsForDots: {
              r: '1',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          bezier
          style={{
            marginVertical: 0,
            borderRadius: 16,
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
