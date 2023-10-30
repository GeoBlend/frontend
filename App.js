import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraType } from "expo-camera";
import { ScrollView } from "react-native";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";

import * as Location from "expo-location";

export default function App() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [cutomPois, setCustomPois] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      console.log("Getting location");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetch(
        `http://10.0.0.95:3000/api/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
        { method: "GET" }
      )
        .then((response) => response.json())
        .then((data) => {
          setPois(data);
          console.log(
            2,
            location.coords.latitude,
            location.coords.longitude,
            data[0]
          );
        })
        .catch((err) => {
          console.log(err.message);
        });
      fetch(
        `http://10.0.0.95:3000/api/get_custom_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
        { method: "GET" }
      )
        .then((response) => response.json())
        .then((data) => {
          setCustomPois(data);
          console.log(
            1,
            location.coords.latitude,
            location.coords.longitude,
            data[0]
          );
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }, [location]);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }

  const toggleDetails = () => {
    setIsDetailsVisible(!isDetailsVisible);
    Animated.timing(animatedValue, {
      toValue: isDetailsVisible ? 0 : 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const animatedStyle = {
    marginTop: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [750, 300],
    }),
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          // Add your code to open the side panel here
        }}
      >
        <Ionicons name="ios-menu" size={44} color="#EBECF1" />
      </TouchableOpacity>

      <View style={styles.textBox}>
        <Text style={styles.textBoxText}>Location:</Text>
      </View>

      <Camera style={styles.camera} type={type}>
        <Animated.View style={[styles.textArea, animatedStyle]}>
          <View style={styles.container}>
          {/* <View style={styles.container}> */}
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={toggleDetails}
            >
              <View style={styles.box}></View>
            </TouchableOpacity>
          {/* </View> */}
          <ScrollView style={styles}>
            <View>
              {pois.concat(cutomPois).map((poi) => (
                <View style={styles.card} key={poi.name}>
                  <Text style={styles.cardTitle}>{poi.name}</Text>
                  <Text style={styles.cardText}>{poi.address}</Text>
                  <Text style={styles.cardText}>Latitude: {poi.lat}</Text>
                  <Text style={styles.cardText}>Longitude: {poi.lon}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          </View>
        </Animated.View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EBECF1",
    borderRadius: 4,
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 4,
  },
  box: {
    backgroundColor: "#007AFF",

    alignItems: "center",
    borderRadius: 10,
    padding: 3,
    marginTop: 10,
    width: 150,
  },
  container: {
    //flexDirection: 'column',
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  textArea: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1B1C25",
    //marginTop: 750,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 36,
  },
  detailsToggle: {
    flex: 1,
    alignSelf: "flex-center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#EBECF1",
    marginTop: 10,
  },

  menuButton: {
    position: "absolute",
    top: 55,
    left: 15,
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#1F4068",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  textBox: {
    position: "absolute",
    top: 55,
    left: 105,
    width: 295,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#1B1C25",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  textBoxText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#EBECF1",
  },
});
