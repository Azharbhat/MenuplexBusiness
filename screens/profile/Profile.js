import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput, ScrollView, Switch } from 'react-native';
import { getAuth, signOut } from '@firebase/auth';
import { ref, set, get } from 'firebase/database';
import { database } from '../../Firebase/FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/FontAwesome';
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


const Profile = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUserData, setEditedUserData] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [latitude, setLatitude] = useState(null);
const [longitude, setLongitude] = useState(null);

  const [userDataKey, setUserDataKey] = useState(null); // State to store the key of user data

  const [isLoading, setIsLoading] = useState(true);

  const reloadUserData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('LetsEatBusinessToken');
      if (userToken) {
        const decodedToken = decodeJwtToken(userToken);
        const userId = decodedToken.sub;
        const databaseRef = ref(database, 'Restaurants');
        const snapshot = await get(databaseRef);
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const userkey=childSnapshot.key;
            if (user.id === userId) {
              setUserDataKey(userkey)
              setUserData(user);
              setEditedUserData(user) // Corrected setUser to setUserData
              // setEditedUser(user); // Assuming this is commented intentionally
              // setUserKey(childSnapshot.key); // Assuming this is commented intentionally
            }
          });
        } else {
          console.warn('No data available in the database');
        }
      }
    } catch (error) {
      console.warn('Error checking user login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadUserData();
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
      await AsyncStorage.removeItem('LetsEatBusinessToken');
    } catch (error) {
      console.error('Error signing out:', error.message);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleEdit = async () => {
    try {
      const userRef = ref(database, `Restaurants/${userDataKey}`);
      await set(userRef, editedUserData);
      setUserData(editedUserData);
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
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        setEditedUserData({
          ...editedUserData,
          geoLocation: {
            coords: {
              accuracy: "",
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            },
            timestamp: ''
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
        {userData && (
          <>
            {isEditing ? (
              <>
              <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between',width:'100%'}}>
              <TouchableOpacity onPress={handleChooseImage}>
                  <Icon name="plus" size={20} color="black" style={styles.icon} />
                </TouchableOpacity>
              <TouchableOpacity onPress={()=>{setIsEditing(false)}}>
              <Icon name="times" size={20} color="black" style={styles.icon} />

                </TouchableOpacity>  
              
              </View>
              
                <Image source={{ uri: imageUri || editedUserData.image }} style={styles.profileImage} />
                <View style={styles.inputRow}>
                  <Icon name="user" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.name}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, name: text })}
                    placeholder="Name"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Icon name="cutlery" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.restaurantName}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, restaurantName: text })}
                    placeholder="Restaurant Name"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Icon name="phone" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.phoneNumber}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, phoneNumber: text })}
                    placeholder="Phone Number"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Icon name="map-marker" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.address}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, address: text })}
                    placeholder="Address"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Icon name="info" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.status}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, status: text })}
                    placeholder="Status"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Icon name="clock-o" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.openingTime}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, openingTime: text })}
                    placeholder="Opening Time"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Icon name="clock-o" size={20} color="black" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={editedUserData.closingTime}
                    onChangeText={(text) => setEditedUserData({ ...editedUserData, closingTime: text })}
                    placeholder="Closing Time"
                  />
                </View>
                <View style={styles.inputRow}>
  <Icon name="truck" size={20} color="black" style={styles.icon} />
  <Text style={styles.label}>Home Delivery:</Text>
  <Switch
    trackColor={{ false: "#767577", true: "#81b0ff" }}
    thumbColor={editedUserData.homeDelivery ? "#f5dd4b" : "#f4f3f4"}
    ios_backgroundColor="#3e3e3e"
    onValueChange={(value) => setEditedUserData({ ...editedUserData, homeDelivery: value })}
    value={editedUserData.homeDelivery}
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
                
                <TouchableOpacity style={styles.button} onPress={fetchNewCoordinates}>
                  <Text style={styles.buttonText}>Fetch New Coordinates</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleEdit}>
                  <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
              <View style={styles.profileView}>
              <View style={{display:'flex',flexDirection:'row'}}>
                  <Image source={{ uri: userData.image }} style={styles.profileImage} />
                  <View style={{display:'flex',justifyContent:'space-between',width:'55%'}}>
                    <TouchableOpacity  onPress={() => setIsEditing(true)}>
                      <Icon name="edit" size={30} color="black" style={{textAlign:'right'}} />
                    </TouchableOpacity>
                    <Text style={styles.userName}>{userData.name}</Text>
                  </View>
                </View>
               
                <View style={styles.eachList}>
                <Icon name="cutlery" size={30} color="black" style={styles.icon} />
                <Text style={styles.userEmail}> {userData.restaurantName}</Text>
                </View>
                <View style={styles.eachList}>
                <Icon name="phone" size={30} color="black" style={styles.icon} />
                <Text style={styles.userInfo}>Phone Number: {userData.phoneNumber}</Text>
                </View>
                <View style={styles.eachList}>
                <Icon name="map-marker" size={30} color="black" style={styles.icon} />
                <Text style={styles.userInfo}>Address: {userData.address}</Text>
                </View>
                <View style={styles.eachList}>
                <Icon name="info" size={30} color="black" style={styles.icon} />
                <Text style={styles.userInfo}>Status: {userData.status}</Text>
                </View>
                <View style={styles.eachList}>
                <Icon name="clock-o" size={30} color="black" style={styles.icon} />
                <Text style={styles.userInfo}>Opening Time: {userData.openingTime}</Text>
                </View>
                <View style={styles.eachList}>
                <Icon name="clock-o" size={30} color="black" style={styles.icon} />
                <Text style={styles.userInfo}>Closing Time: {userData.closingTime}</Text>
                </View>
                <View style={styles.eachList}>
                <Icon name="truck" size={30} color="black" style={styles.icon} />
                <Text style={styles.userInfo}>Home Delivery: {userData.homeDelivery}</Text>
                </View>   
                <View  style={{display:'flex',flexDirection:'row',justifyContent:'space-between',bottom:0}}>
                <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={handleLogout}>
                <Icon name="sign-out" size={20} color="black" style={styles.icon} />
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('GenerateQr',{ id: userData.id, name:userData.restaurantName, userData: userData})}>
                <Text style={{fontSize:10}}>GenerateQrCodes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('GenerateQr',{ id: userData.id, name:userData.restaurantName, userData: userData})}>
                <Text style={styles.buttonText}>SavedQr</Text>
              </TouchableOpacity>
             
                </View>
               
              </View>
                
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:20,
    paddingTop:10,
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
    backgroundColor:'tomato',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  icon: {
    marginRight: 5,
  },
  profileView:{
    display:'flex',
    justifyContent:'space-between',
    width:'100%',
    height:'auto'
  },
  eachList:{
    display:'flex',
    flexDirection:'row',
    paddingVertical:15
  }
});

export default Profile;
