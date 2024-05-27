import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode, encode } from 'base-64';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, onValue, get } from 'firebase/database';

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

export default function Liked() {
  const [userDataKey, setUserDataKey] = useState(null);
  const [categories, setCategories] = useState([]);

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
          const filteredUserData = Object.entries(userData).find(
            ([key, user]) => user.id === userId
          );

          if (filteredUserData) {
            setUserDataKey(filteredUserData[0]); // Set the key of user data
          } else {
            console.log('User data not found.');
          }
        } else {
          console.log('No user is currently authenticated.');
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
          // Filter out categories without any comments in their foods
          const filteredCategories = categoriesList.filter(category =>
            category.foods && Object.values(category.foods).some(food => food.comments)
          );
          setCategories(filteredCategories);
        }
      });
    }
  }, [userDataKey]);

  const renderItem = ({ item }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      {item.foods && (
        <FlatList
          data={Object.values(item.foods).filter(food => food.comments)} // Filter out foods without comments
          renderItem={({ item: food }) => (
            <View style={styles.foodContainer}>
              <Text style={styles.foodTitle}>{food.name}</Text>
              {food.comments && (
                <FlatList
                  data={Object.entries(food.comments).map(([key, comment]) => ({ id: key, ...comment }))}
                  renderItem={({ item: comment }) => (
                    <View key={comment.id} style={styles.commentContainer}>
                      <Text style={styles.commentAuthor}>{comment.username}</Text>
                      <Text style={styles.commentDate}>{new Date(parseInt(comment.id)).toLocaleString()}</Text>
                      <Text style={styles.commentText}>{comment.comment}</Text>
                    </View>
                  )}
                  keyExtractor={(comment) => comment.id}
                />
              )}
            </View>
          )}
          keyExtractor={(food, index) => food.id ? food.id.toString() : index.toString()} // Updated keyExtractor
        />
      )}
    </View>
  );
  

  return (
    <View style={styles.container}>
      <Text>Comments</Text>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(category) => category.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0', // Changed background color for better contrast
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: '#fff', // Added background color to category container
    padding: 10, // Added padding to category container
    borderRadius: 5, // Added border radius to category container
    elevation: 2, // Added elevation for shadow effect
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333', // Changed text color for better contrast
  },
  foodContainer: {
    marginBottom: 10,
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555', // Changed text color for better contrast
  },
  commentContainer: {
    backgroundColor: 'tomato',
    padding: 10,
    marginBottom: 5,
    borderRadius: 5, // Added border radius to comment container
    elevation: 1, // Added elevation for shadow effect
  },
  commentText: {
    fontSize: 14,
    color: '#333', // Changed text color for better contrast
  },
  commentAuthor: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#777', // Changed text color for better contrast
  },
  commentDate: {
    fontSize: 12,
    color: '#777', // Changed text color for better contrast
  },
});
