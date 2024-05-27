import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode, encode } from 'base-64';
import { database } from '../../Firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

export default function GenerateQr() {
  const [numQRCodes, setNumQRCodes] = useState('');
  const [qrCodes, setQRCodes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userDataKey, setUserDataKey] = useState(null);

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
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    handleGenerateQRCodes(); // Trigger QR code generation once userData and userDataKey are fetched
  }, [userData, userDataKey]); // Re-run effect when userData or userDataKey change

  const handleGenerateQRCodes = () => {
    

    const codes = [];
    const numberOfQRCodes = parseInt(numQRCodes);
    for (let i = 1; i <= numberOfQRCodes; i++) {
      const qrCodeData = `Table: ${i}\nRestaurant: ${userData.restaurantName}\nKey: ${userDataKey}`;
      codes.push({ id: i, data: qrCodeData });
    }
    setQRCodes(codes);
  };

  const handleDownloadQRCodes = async () => {
    try {
      if (qrCodes.length === 0) {
        Alert.alert('No QR codes', 'There are no QR codes to download.');
        return;
      }

      const downloadDir = FileSystem.documentDirectory + 'QR Codes/';
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

      const paths = [];
      for (let i = 0; i < qrCodes.length; i++) {
        const path = downloadDir + `QRCode_${i + 1}.jpg`;
        const qrCodeSvg = (
          <QRCode value={qrCodes[i].data} size={150} />
        );
        const svgData = await qrCodeSvg.toDataURL();
        await FileSystem.writeAsStringAsync(path, svgData, { encoding: FileSystem.EncodingType.Base64 });
        paths.push(path);
      }

      // Prompt user to choose the location to save the files
      await Sharing.shareAsync(paths, { dialogTitle: 'Save QR Codes' });

      Alert.alert('Download Complete', `Downloaded ${numQRCodes} QR code(s) to ${downloadDir}`);
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      Alert.alert('Download Failed', 'Failed to download QR codes. Please try again.');
    }
  };

  const renderQRCodeItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          Alert.alert('QR Code', `Selected QR code: ${item.data}`);
        }}
        style={{ margin: 10 }}
      >
        <QRCode value={item.data} size={150} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={qrCodes}
        renderItem={renderQRCodeItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
      />

      <View style={styles.bottomContainer}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Number of QR codes"
          value={numQRCodes}
          onChangeText={(text) => setNumQRCodes(text)}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateQRCodes}
        >
          <Text style={styles.buttonText}>Generate QR Codes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleDownloadQRCodes}
        >
          <Text style={styles.buttonText}>Download QR Codes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    flex: 1,
    height: 40,
    marginRight: 10,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
  },
  button: {
    backgroundColor: 'tomato',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 10,
  },
});
