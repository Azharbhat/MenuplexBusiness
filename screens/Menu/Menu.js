import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, onValue, get, set } from 'firebase/database';
import AddFood from './AddFood';
import { getAuth } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage import
import { decode, encode } from 'base-64';
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


const FoodScreen = () => {
  const [userData, setUserData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAddFoodMode, setAddFoodMode] = useState(false);
  const [foods, setFoods] = useState([]);
  const [userDataKey, setUserDataKey] = useState(null); // State to store the key of user data

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
            setUserDataKey(filteredUserData[0]); // Set the key of user data
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
    if (userDataKey) {
      const categoriesRef = ref(database, `Restaurants/${userDataKey}/categories`);
      onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoriesList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCategories(categoriesList);
        }
      });
    }
  }, [userDataKey]);

  useEffect(() => {
    if (selectedCategory && userDataKey) {
      const foodsRef = ref(database, `Restaurants/${userDataKey}/categories/${selectedCategory.id}/foods`);
      onValue(foodsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const foodList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setFoods(foodList);
        }
      });
    }
  }, [selectedCategory, userDataKey]);

  const handleCategorySelection = (category) => {
    setSelectedCategory(category);
  };

  const handleItemClick = (item) => {
    if (!userDataKey || !selectedCategory) return;

    // Update the availability of the item
    const updatedFoods = foods.map(food => {
      if (food.id === item.id) {
        return {
          ...food,
          availability: !food.availability // Toggle availability
        };
      }
      return food;
    });

    setFoods(updatedFoods);

    // Check if any item in the sublist is available
    // Check if any item in the sublist is available
const anyAvailable = updatedFoods.some(food => food.availability);

// Update the category availability based on sublist availability
const updatedCategories = categories.map(category => {
  if (category.name === selectedCategory.name) {
    return {
      ...category,
      availability: anyAvailable
    };
  }
  return category;
});

// Update the local state of categories
setCategories(updatedCategories);

// Update categories in the database individually
updatedCategories.forEach(updatedCategory => {
  const catRef = ref(database, `Restaurants/${userDataKey}/categories/${updatedCategory.id}`);
  set(catRef, updatedCategory)
    .then(() => console.log('Category updated successfully'))
    .catch(error => console.error('Error updating category:', error));
});
    // Update the item in the database
    const itemRef = ref(database, `Restaurants/${userDataKey}/categories/${selectedCategory.id}/foods/${item.id}`);
    set(itemRef, { ...item, availability: !item.availability })
      .then(() => console.log('Item updated successfully'))
      .catch(error => console.error('Error updating item:', error));
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{userData?.restaurantName}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isAddFoodMode ? styles.selectedButton : null]}
          onPress={() => setAddFoodMode(true)}>
          <Text style={styles.buttonText}>Add Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !isAddFoodMode ? styles.selectedButton : null]}
          onPress={() => setAddFoodMode(false)}>
          <Text style={styles.buttonText}>Update Food</Text>
        </TouchableOpacity>
      </View>

      {!isAddFoodMode ? (
        <View style={styles.flatListContainer}>
        <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
             
              !item.availability ? styles.notAvailableCategory :  styles.AvailableCategory,
              selectedCategory === item ? styles.selectedCategory : null, // Apply not available style if the category is not available
            ]}
            onPress={() => handleCategorySelection(item)}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.availability}>
            {item.availability ? 'Available' : 'Not Available'}
            </Text>
          </TouchableOpacity>
        )}
      />
      

          {selectedCategory && (
            <FlatList
              data={foods}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    item.availability ? styles.available : styles.notAvailable,
                  ]}
                  onPress={() => handleItemClick(item)}>
                  <Text style={styles.itemText}>{item.name}</Text>
                  <Text style={styles.availability}>
                    {item.availability ? 'Available' : 'Not Available'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <AddFood data={userData} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:20,
    paddingTop:10,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  selectedButton: {
    backgroundColor: 'tomato',
  },
  flatListContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    margin: 10,
    borderRadius: 5,
    width: '90%',
    borderWidth: 1,
    borderColor: 'tomato',
    elevation: 5,
  },
  itemText: {
    fontSize: 15,
    textAlign: 'center',
  },
  selectedCategory: {
    backgroundColor: 'tomato',
  },
  available: {
    backgroundColor: 'lightgreen',
  },
  notAvailable: {
    backgroundColor: 'lightcoral',
  },
  Available: {
    backgroundColor: 'green',
  },
  notAvailableCategory: {
    backgroundColor: 'gray', // You can choose the color for not available categories
  },
  AvailableCategory: {
    backgroundColor: 'lightgreen', // You can choose the color for not available categories
  },
  availability: {
    marginTop: 5,
    textAlign: 'center',
  },
});

export default FoodScreen;
