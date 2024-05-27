import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { getAuth, signOut } from '@firebase/auth';
import { DataContext } from '../../DataContex/DataContex';
import { update, ref,set } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import { ScrollView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; // Import Location from Expo
import Icon from 'react-native-vector-icons/FontAwesome'; // Assuming you're using FontAwesome icons
import { Geolocation } from 'react-native';

const Profile = ({ navigation }) => {
  const { userData, setUserData } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserData, setEditedUserData] = useState({ ...userData });
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null); // State to hold the user's location
  const [latitude, setLatitude] = useState(userData.geoLocation.coords.latitude || null);
  const [longitude, setLongitude] = useState(userData.geoLocation.coords.longitude|| null);
 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = ref(database, 'users');
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          const filteredUserData = Object.values(userData).filter(user => user.id === currentUser.uid);

          if (filteredUserData.length > 0) {
            setUserData(filteredUserData[0]);
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
  }, []); /
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error.message);
      Alert.alert('Error', 'Failed to sign out');
    }
  };
  const handleEdit = async () => {
    try {
      const userRef = ref(database, `users/${userData.id}`);
      // Update editedUserData with the changes made by the user
      const updatedUserData = { ...userData, ...editedUserData };
      await set(userRef, updatedUserData); // Using set method to update user data
      setUserData(updatedUserData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error.message);
      Alert.alert('Error', 'Failed to update profile');
    }
  };
  
  

  const handleChooseImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      console.log('Error: Permission to access camera roll is required!');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync();

    if (pickerResult.cancelled === true) {
      console.log('Image selection cancelled');
      return;
    }

    // Update editedUserData with new image URI
    setImageUri(pickerResult.assets[0].uri);
    setEditedUserData({ ...editedUserData, image: pickerResult.assets[0].uri });
  };

  const fetchNewCoordinates = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      if (location) {
        console.log('New coordinates:', location.coords.latitude, location.coords.longitude);
        // Update latitude and longitude state variables
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        // Update editedUserData with new coordinates
        setEditedUserData({
          ...editedUserData,
          geoLocation: {
            coords: {accuracy :"",
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            },
            timestamp:'',
          }
        });
      } else {
        console.error('Failed to get new coordinates');
      }
    } catch (error) {
      console.error('Error fetching new coordinates:', error);
    }
  };
  
  

  return (
    <ScrollView>
      <View style={styles.container}>
        {isEditing ? (
          <>
            <TouchableOpacity onPress={handleChooseImage}>
              <Icon name="plus" size={20} color="black" style={styles.icon} />
            </TouchableOpacity>
            <Image source={{ uri: imageUri || editedUserData.image }} style={styles.profileImage} />
            <View style={styles.inputRow}>
              <Text style={styles.label}>Name:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.name}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, name: text })}
                placeholder="Name"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Restaurant Name:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.restaurantName}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, restaurantName: text })}
                placeholder="Restaurant Name"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Phone Number:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.phoneNumber}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, phoneNumber: text })}
                placeholder="Phone Number"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Address:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.address}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, address: text })}
                placeholder="Address"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Status:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.status}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, status: text })}
                placeholder="Status"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Opening Time:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.openingTime}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, openingTime: text })}
                placeholder="Opening Time"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Closing Time:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.closingTime}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, closingTime: text })}
                placeholder="Closing Time"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Home Delivery:</Text>
              <TextInput
                style={styles.input}
                value={editedUserData.homeDelivery}
                onChangeText={(text) => setEditedUserData({ ...editedUserData, homeDelivery: text })}
                placeholder="Home Delivery"
              />
            </View>
            {latitude !== null && longitude !== null && (
              <View style={styles.inputRow}>
                <Text style={styles.label}>Latitude:</Text>
                <Text style={styles.input}>{latitude}</Text>
                <Text style={styles.label}>Longitude:</Text>
                <Text style={styles.input}>{longitude}</Text>
              </View>
            )}
            
            <TouchableOpacity  style={styles.button} onPress={fetchNewCoordinates}>
              <Text style={styles.buttonText}>Fetch New Coordinates</Text>
            </TouchableOpacity>
           
            <TouchableOpacity style={styles.button} onPress={handleEdit}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Image source={{ uri: userData.image }} style={styles.profileImage} />
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>Restaurant Name: {userData.restaurantName}</Text>
            <Text style={styles.userInfo}>Phone Number: {userData.phoneNumber}</Text>
            <Text style={styles.userInfo}>Address: {userData.address}</Text>
            <Text style={styles.userInfo}>Status: {userData.status}</Text>
            <Text style={styles.userInfo}>Opening Time: {userData.openingTime}</Text>
            <Text style={styles.userInfo}>Closing Time: {userData.closingTime}</Text>
            <Text style={styles.userInfo}>Home Delivery: {userData.homeDelivery}</Text>
            {location && (
              <Text style={styles.userInfo}>Latitude: {userData.geoLocation.coords.latitude}, Longitude: {userData.geoLocation.coords.longitude}</Text>
            )}
            <TouchableOpacity style={styles.button} onPress={() => setIsEditing(true)}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('GenerateQr',{ id: userData.id, name:userData.restaurantName, userData: userData})}>
              <Text style={styles.buttonText}>Generate Qr Codes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 10,
  },
  inputRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
  },
  button: {
    backgroundColor: 'blue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;
