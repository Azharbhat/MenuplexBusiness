import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode, encode } from 'base-64';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, onValue, get, update, push } from 'firebase/database';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

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

export default function CartScreen() {
  const [userData, setUserData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [userDataKey, setUserDataKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('today');
  const [customDate, setCustomDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [sizeValue, setSizeValue] = useState('');

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
            setUserData(filteredUserData[1]);
            setUserDataKey(filteredUserData[0]);
          } else {
            console.log("User data not found.");
          }
        } else {
          console.log("No user is currently authenticated.");
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);
      } finally {
        setLoading(false); // Set loading to false after data fetching completes
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userDataKey) {
      const categoriesRef = ref(database, `Restaurants/${userDataKey}/orders`);
      onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoriesList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCategories(categoriesList.reverse()); // Reverse the order of categories
        }
      });
    }
  }, [userDataKey]);
  

  const handleConfirmOrder = (orderId) => {
    // Update order status in the database
    update(ref(database, `Restaurants/${userDataKey}/orders/${orderId}`), { orderStatus: 'confirmed' });
  };

  const handleCancelOrder = (orderId) => {
    // Update order status in the database
    update(ref(database, `Restaurants/${userDataKey}/orders/${orderId}`), { orderStatus: 'cancelled' });
  };

  const renderItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: item.orderStatus ? (item.orderStatus === 'confirmed' ? '#3CB371' : '#FF6347') : '#ccc' }]}>
   
      <Text>Order Status: {item.orderStatus ? (item.orderStatus === 'confirmed' ? 'Confirmed' : 'Cancelled') : 'Pending'}</Text>
      <Text>Total Price: {item.totalPrice}</Text>
      <Text style={styles.timestampText}>Date/Time: {new Date(item.timestamp).toLocaleString()}</Text>
      
      {item.foods && item.foods.map((food) => (
        <View key={food.key} style={{ marginLeft: 10 }}>
        <Text style={{fontSize:15,fontWeight:'600'}}>Name: {food.username}</Text>
        <Text style={{fontSize:15,fontWeight:'600'}}>Number: {food.phone}</Text>
        <Text style={{fontSize:15,fontWeight:'600'}}>Address: {food.address}</Text>
        <Text style={{ fontSize: 15, fontWeight: '600' }}>
        {food.TableNumber ? `Table Number: ${food.TableNumber}` : 'Home Delivery'}
      </Text>
      
        <Text style={{ fontWeight: 'bold' }}>Items:</Text>
        <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}> 
      
        <Text>Name: {food.name}</Text>
          <Text>Price: {food.price}</Text>
          </View>
          <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}> 
          <Text>Quantity: {food.quantity}</Text>
          <Text>Size: {food.size}</Text>
          </View>
          
         
        </View>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: item.orderStatus ? '#ccc' : '#3CB371' }]}
          onPress={() => handleConfirmOrder(item.id)}
          disabled={item.orderStatus === 'confirmed'} // Update disabled prop
        >
          <Text style={styles.buttonText}>Confirm Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: item.orderStatus ? '#ccc' : '#FF6347' }]}
          onPress={() => handleCancelOrder(item.id)}
          disabled={item.orderStatus === 'cancelled'} // Update disabled prop
        >
          <Text style={styles.buttonText}>Cancel Order</Text>
        </TouchableOpacity>

      </View>
    </View>
  );

  const filterOrders = (timestamp) => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const orderDate = new Date(timestamp);

    switch (selectedFilter) {
      case 'today':
        return orderDate.getDate() === todayDate && orderDate.getMonth() === todayMonth && orderDate.getFullYear() === todayYear;
      case 'thisWeek':
        // Add logic to check if orderDate falls within the current week
        break;
      case 'thisMonth':
        return orderDate.getMonth() === todayMonth && orderDate.getFullYear() === todayYear;
      case 'thisYear':
        return orderDate.getFullYear() === todayYear;
      case 'custom':
        // Check if orderDate matches the selected custom date
        return orderDate.toDateString() === customDate.toDateString();
      default:
        return true;
    }
  };

  const addCustomOrder = () => {
    // Calculate total price
    const totalPrice = parseFloat(quantity) * parseFloat(price);

    // Add logic to handle adding a custom order
    const newOrder = {
      key: new Date().getTime().toString(), // Generate unique ID for the order
      orderStatus: 'pending', // Initially set to 'pending'
      timestamp: new Date().toISOString(), // Timestamp of the order
      totalPrice: totalPrice.toFixed(2), // Total price rounded to 2 decimal places
      foods: [
        {
          name: itemName,
          quantity: parseInt(quantity),
          price: parseFloat(price).toFixed(2), // Price rounded to 2 decimal places
          size: sizeValue, // Use the value of sizeValue entered by the user
        },
      ],
    };

    // Push the new order to the database
    push(ref(database, `Restaurants/${userDataKey}/orders`), newOrder);

    // Clear the input fields
    setItemName('');
    setQuantity('');
    setPrice('');
    setSizeValue('');

    // Close the modal
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Picker
          selectedValue={selectedFilter}
          style={{ height: 50, width: 150 }}
          onValueChange={(itemValue) => setSelectedFilter(itemValue)}
        >
          <Picker.Item label="Today" value="today" />
          <Picker.Item label="This Week" value="thisWeek" />
          <Picker.Item label="This Month" value="thisMonth" />
          <Picker.Item label="This Year" value="thisYear" />
          <Picker.Item label="Custom Date" value="custom" />
        </Picker>
        {selectedFilter === 'custom' && (
          <TouchableOpacity onPress={() => setShowDatePicker(true)} >
            <Text style={{ marginVertical: 10, backgroundColor: 'green', padding: 5, color: 'white', borderRadius: 5 }}>Select Date</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={customDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              const currentDate = selectedDate || customDate;
              setCustomDate(currentDate);
            }}
          />
        )}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.buttonText}>Add Custom Order</Text>
        </TouchableOpacity>

      </View>

      <FlatList
        data={categories.filter((item) => filterOrders(item.timestamp))}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.timestamp}`} // Assuming orderId and timestamp uniquely identify each order

      />
      {/* Modal for adding custom order */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Order</Text>
            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={itemName}
              onChangeText={(text) => setItemName(text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={quantity}
              onChangeText={(text) => setQuantity(text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={(text) => setPrice(text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Size"
              value={sizeValue}
              onChangeText={(text) => setSizeValue(text)}
            />
            <TouchableOpacity style={styles.modalButton} onPress={addCustomOrder}>
              <Text style={styles.modalButtonText}>Add Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    // Shadow properties for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Shadow properties for Android
    elevation: 5,
  },
  
  title: {
    fontSize: 16,
  },
  button: {
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#3CB371',
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width:'70%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#3CB371',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
