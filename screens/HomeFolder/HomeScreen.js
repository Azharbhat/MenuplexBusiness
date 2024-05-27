import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, ref, onValue, update } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import Chart from '../Charts.js/Chart';
import OrderChart from '../Charts.js/OrderChart';
import { decode, encode } from 'base-64';

// Polyfill for base64 encoding/decoding
if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

// Function to decode JWT token
const decodeJwtToken = (token) => {
  try {
    if (!token) {
      console.error('Token is null or empty');
      return null;
    }

    const payload = token.split('.')[1];
    const decodedPayload = decodeURIComponent(atob(payload));
    const decodedToken = JSON.parse(decodedPayload);

    if (!decodedToken || !decodedToken.sub) {
      console.error('Decoded token is null or missing "sub" property');
      return null;
    }

    return decodedToken;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

const HomeScreen = ({ navigation }) => {
  // State variables
  const [homeData, setHomeData] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userDataKey, setUserDataKey] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // State for selected period
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for selected date
  const [showDatePicker, setShowDatePicker] = useState(false); // State to show/hide date picker
  const [loading, setLoading] = useState(true); // State for loading
  const [graphLoading, setGraphLoading] = useState(true); // State for graph loading

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userToken = await AsyncStorage.getItem('LetsEatBusinessToken');

        if (userToken) {
          const decodedToken = decodeJwtToken(userToken);
          const userId = decodedToken.sub;
          const userRef = ref(database, 'Restaurants');
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          const filteredUserData = Object.entries(userData).find(([key, user]) => user.id === userId);

          if (filteredUserData) {
            setUserDataKey(filteredUserData[0]); // Set the key of user data
            setUserData(filteredUserData[1]); // Set the user data
          } else {
            console.log("User data not found.");
          }
        } else {
          console.log("No user is currently authenticated.");
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchHomeData = () => {
      try {
        const homeDataRef = ref(database, `Restaurants/${userDataKey}/orders`);
        onValue(homeDataRef, (snapshot) => {
          const homeData = snapshot.val();
          if (homeData) {
            const homeDataArray = Object.entries(homeData).map(([parentKey, data]) => ({
              ...data,
              parentKey: parentKey
            }));
            setHomeData(homeDataArray);
            setLoading(false); // Once data is loaded, set loading to false
          }
        });
      } catch (error) {
        console.error('Error fetching HomeData:', error.message);
      }
    };

    if (userDataKey) {
      fetchHomeData();
    }
  }, [userDataKey]);

  const fetchTotalPrice = () => {
    let totalPrice = 0;
  
    // Get the current date
    const currentDate = new Date();
  
    // Filter orders based on selectedPeriod
    const filteredOrders = homeData.filter(order => {
      const orderDate = new Date(order.timestamp); // Assuming there's a 'timestamp' field in each order
      switch (selectedPeriod) {
        case 'today':
          return orderDate.getDate() === currentDate.getDate() &&
                 orderDate.getMonth() === currentDate.getMonth() &&
                 orderDate.getFullYear() === currentDate.getFullYear();
        case 'week':
          // Logic to filter for the current week
          const currentWeekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
          const currentWeekEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()));
          return orderDate >= currentWeekStart && orderDate <= currentWeekEnd;
        case 'month':
          // Logic to filter for the current month
          return orderDate.getMonth() === currentDate.getMonth() && orderDate.getFullYear() === currentDate.getFullYear();
        case 'year':
          // Logic to filter for the current year
          return orderDate.getFullYear() === currentDate.getFullYear();
        default:
          return false;
      }
    });
  
    // Calculate total price from filtered orders
    totalPrice = filteredOrders.reduce((total, order) => {
      // Parse totalPrice to ensure it's a number
      const orderTotalPrice = parseFloat(order.totalPrice);
      // Check if orderTotalPrice is a valid number
      if (!isNaN(orderTotalPrice)) {
        return total + orderTotalPrice;
      } else {
        // Log an error if totalPrice is invalid
        console.error('Invalid order total price:', order.totalPrice);
        return total;
      }
    }, 0);
  
    return totalPrice;
  };

  // Inside the HomeScreen component
  const fetchTotalOrders = () => {
    let totalOrders = 0;
  
    // Get the current date
    const currentDate = new Date();
  
    // Filter orders based on selectedPeriod
    const filteredOrders = homeData.filter(order => {
      const orderDate = new Date(order.timestamp); // Assuming there's a 'timestamp' field in each order
      switch (selectedPeriod) {
        case 'today':
          return orderDate.getDate() === currentDate.getDate() &&
                 orderDate.getMonth() === currentDate.getMonth() &&
                 orderDate.getFullYear() === currentDate.getFullYear();
        case 'week':
          // Logic to filter for the current week
          const currentWeekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
          const currentWeekEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()));
          return orderDate >= currentWeekStart && orderDate <= currentWeekEnd;
        case 'month':
          // Logic to filter for the current month
          return orderDate.getMonth() === currentDate.getMonth() && orderDate.getFullYear() === currentDate.getFullYear();
        case 'year':
          // Logic to filter for the current year
          return orderDate.getFullYear() === currentDate.getFullYear();
        default:
          return false;
      }
    });
  
    // Count total orders from filtered orders
    totalOrders = filteredOrders.length;
  
    return totalOrders;
  };

  const filteredOrderData = homeData.filter(order => {
    const orderDate = new Date(order.timestamp); // Assuming there's a 'timestamp' field in each order
    const currentDate = new Date();
  
    switch (selectedPeriod) {
      case 'today':
        return orderDate.getDate() === currentDate.getDate() &&
               orderDate.getMonth() === currentDate.getMonth() &&
               orderDate.getFullYear() === currentDate.getFullYear();
      case 'week':
        // Logic to filter for the current week
        const currentWeekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const currentWeekEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()));
        return orderDate >= currentWeekStart && orderDate <= currentWeekEnd;
      case 'month':
        // Logic to filter for the current month
        return orderDate.getMonth() === currentDate.getMonth() && orderDate.getFullYear() === currentDate.getFullYear();
      case 'year':
        // Logic to filter for the current year
        return orderDate.getFullYear() === currentDate.getFullYear();
      default:
        return false;
    }
  });

  // Filtered data for total orders chart
  const filteredOrderDataForTotalOrders = homeData.filter(order => {
    const orderDate = new Date(order.timestamp);
    const currentDate = new Date();
  
    switch (selectedPeriod) {
      case 'today':
        return orderDate.getDate() === currentDate.getDate() &&
               orderDate.getMonth() === currentDate.getMonth() &&
               orderDate.getFullYear() === currentDate.getFullYear();
      case 'week':
        const currentWeekStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const currentWeekEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + (6 - currentDate.getDay()));
        return orderDate >= currentWeekStart && orderDate <= currentWeekEnd;
      case 'month':
        return orderDate.getMonth() === currentDate.getMonth() && orderDate.getFullYear() === currentDate.getFullYear();
      case 'year':
        return orderDate.getFullYear() === currentDate.getFullYear();
      default:
        return false;
    }
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Let's Eat</Text>
        <Text style={styles.headerText}>{userData?.restaurantName}</Text>
      </View>

      {/* Dropdowns */}
      <View style={styles.dropdownContainer}>
        {/* Time Period dropdown */}
        <Picker
          style={{ height: 50, width: 200 }}
          selectedValue={selectedPeriod}
          onValueChange={(itemValue, itemIndex) => setSelectedPeriod(itemValue)}>
          <Picker.Item label="Today" value="today" />
          <Picker.Item label="Week" value="week" />
          <Picker.Item label="Month" value="month" />
          <Picker.Item label="Year" value="year" />
        </Picker>
      </View>

      {/* Graphs */}
      {/* Price Chart */}
      <View style={styles.graphContainer}>
        <Text>Price Chart</Text>
        <Chart orderData={filteredOrderData} selectedPeriod={selectedPeriod} />
      </View>

      {/* Total Orders Chart */}
      <View style={styles.graphContainer}>
        <Text>Total Orders Chart</Text>
        <OrderChart orderData={filteredOrderDataForTotalOrders} selectedPeriod={selectedPeriod} />
      </View>

      {/* Total Amount and Total Orders */}
      <View style={styles.totalContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Detailed', { name: 'Total' })} style={styles.totalItem}>
          <Text style={styles.totalItemText}>Total Amount</Text>
          <Text style={styles.totalItemTextt}>{fetchTotalPrice()}Rs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Detailed', { name: 'Total' })} style={styles.totalItem}>
          <Text style={styles.totalItemText}>Total Orders</Text>
          <Text style={styles.totalItemTextt}>{fetchTotalOrders()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChartLoadingIndicator = ({ loading }) => {
  return (
    loading && (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  headerText: {
    fontSize: 24,
  },
  dropdownContainer: {
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalContainer: {
    
    flexDirection: 'row',
    marginTop: 20,
  },
  totalItem: {
    backgroundColor:'tomato',
    flex: 1,
    borderRadius: 5,
    borderWidth: 2,
    margin: 5,
    padding: 10,
  },
  totalItemText:{
fontSize:15,
textAlign:'center'

  },
  totalItemTextt:{
    fontSize:20,
    textAlign:'center',
    color:'white',
    fontWeight:'600'
    
      },
  graphContainer: {
    borderWidth: 2,
    borderRadius: 5,
    margin:10
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white background
  },
});

export default HomeScreen;
