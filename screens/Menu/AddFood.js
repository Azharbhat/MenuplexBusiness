import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, onValue, push, set, get } from 'firebase/database';
import { getAuth } from '@firebase/auth';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
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




export default function AddFood() {
  const [userData, setUserData] = useState(null);
  const [userDataKey, setUserDataKey] = useState(null); // State to store the key of user data
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [newFoodImage, setNewFoodImage] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  

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
      const userRef = ref(database, `Restaurants/${userDataKey}/categories`);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoryList = Object.keys(data).map((key) => ({
            id: key,
            name: data[key].name,
            image: data[key].image,
            foods: data[key].foods || [],
          }));
          setCategories(categoryList);
        }
      });
      
      return () => unsubscribe();
    }
  }, [userDataKey]);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  const handleAddCategory = () => {
    if (!newCategoryName || !newCategoryImage) {
      console.log('Error: Please enter a category name and upload an image.');
      return;
    }

    const newCategory = {
      name: newCategoryName,
      image: newCategoryImage,
      availability: 'true',
      foods: [],
    };

    const userRef = ref(database, `Restaurants/${userDataKey}/categories`);
    const newCategoryRef = push(userRef);
    set(newCategoryRef, newCategory);

    setCategories([...categories, { id: newCategoryRef.key, ...newCategory }]);
    setNewCategoryName('');
    setNewCategoryImage(null);
    setShowAddCategory(false);
  };

  const handleImageUpload = async () => {
    try {
      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        console.log('Permission to access camera roll is required!');
        return;
      }
  
      let pickerResult = await ImagePicker.launchImageLibraryAsync();
      if (pickerResult.cancelled === true) {
        console.log('Image selection cancelled');
        return;
      }
  
      // Get the file URI
      const fileUri = pickerResult.assets[0].uri;
  
      // Read the file contents as a base64 string
      const base64String = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  
      // Set the base64 string as the image data
      setNewCategoryImage(`data:image/jpeg;base64,${base64String}`);
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleFoodImageUpload = async () => {
    try {
      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        console.log('Permission to access camera roll is required!');
        return;
      }
  
      let pickerResult = await ImagePicker.launchImageLibraryAsync();
      if (pickerResult.cancelled === true) {
        console.log('Image selection cancelled');
        return;
      }
  
      // Get the file URI
      const fileUri = pickerResult.assets[0].uri;
  
      // Read the file contents as a base64 string
      const base64String = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  
      // Set the base64 string as the image data
      setNewFoodImage(`data:image/jpeg;base64,${base64String}`);
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory) {
      console.log('Error: Please select a category.');
      return;
    }
  
    if (!foodName || !price || !size || !newFoodImage) {
      console.log('Error: Please fill out all fields.');
      return;
    }
  
    const foodItem = {
      name: foodName,
      price: price,
      size: size,
      image: newFoodImage,
      availability: true,
      categoryName: selectedCategory.name, // Add the selected category ID here
    };
    
    const categoryRef = ref(database, `Restaurants/${userDataKey}/categories/${selectedCategory.id}/foods`);
    const newFoodRef = push(categoryRef);
    set(newFoodRef, foodItem);

    setFoodName('');
    setPrice('');
    setSize('');
    setNewFoodImage(null);
  };

  const renderCategories = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleSelectCategory(item)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddCategory(!showAddCategory)}>
        <Text>{showAddCategory ? "- Hide Add Category" : "+ Add Category"}</Text>
      </TouchableOpacity>

      {showAddCategory && (
        <View style={styles.newCategoryContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Category Name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />

          <TouchableOpacity style={styles.button} onPress={handleImageUpload}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </TouchableOpacity>
          
          {newCategoryImage && (
            <Image source={{ uri: newCategoryImage }} style={styles.imagePreview} />
          )}
          <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
            <Text>Add Category</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={categories}
        renderItem={renderCategories}
        keyExtractor={(item) => item.id.toString()}
      />

      {selectedCategory && (
        <View style={styles.formContainer}>
          <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Food Name"
            onChangeText={setFoodName}
            value={foodName}
          />
          <TextInput
            style={styles.input}
            placeholder="Price:100,200,300"
            onChangeText={setPrice}
            value={price}
          />
          <TextInput
            style={styles.input}
            placeholder="Size:small,medium,large"
            onChangeText={setSize}
            value={size}
          />
          <TouchableOpacity style={styles.button} onPress={handleFoodImageUpload}>
            <Text style={styles.buttonText}>Upload Food Image</Text>
          </TouchableOpacity>
          {newFoodImage && (
            <Image source={{ uri: newFoodImage }} style={styles.imagePreview} />
          )}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  newCategoryContainer: {
    marginBottom: 20,
  },
  categoryItem: {
    padding: 10,
    margin: 5,
    backgroundColor: '#eeeeee',
    borderRadius: 5,
  },
  formContainer: {
    marginTop: 20,
  },
  selectedCategoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: 'tomato',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'tomato',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
