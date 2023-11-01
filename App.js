import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraType } from "expo-camera";
import {
  Animated,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import MapView from "react-native-maps";

export default function App() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [location, setLocation] = useState({
    coords: {
      accuracy: 8.128427262711782,
      altitude: 7.480909824371338,
      altitudeAccuracy: 7.935099124908447,
      heading: -1,
      latitude: 30.15473707408311,
      longitude: -81.54763335917352,
      speed: -1,
    },
    timestamp: 1698709091514.799,
  });
  const [pois, setPois] = useState([]);
  const [cutomPois, setCustomPois] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [showmap, setMap] = useState(false);
  const [prefEntered, setPref] = useState(false);

  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [text, onChangeText] = React.useState("");

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
      console.log(location);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      //console.log(`http://localhost:3000/api/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`)
      //TODO: Remove this
      setPois([
        {
          name: "St. Johns County, Florida",
          wikipedia_url:
            "http://en.wikipedia.org/wiki/St._Johns_County,_Florida",
          lat: 29.93781345,
          lon: -81.45145655,
          address: "676 Natureland Cir, St. Augustine, FL 32092, USA",
          custom: false,
          details: "asdasdasdsad",
          imageUrl:
            "https://lh5.googleusercontent.com/p/AF1QipNtVj045Rr-MPs2YeH8APuK3_sjzs_3VAYN9iXd=w408-h413-k-no",
        },
        {
            name: "Kingsley Plantation",
            wikipedia_url:
              "https://en.wikipedia.org/wiki/Kingsley_Plantation",
            lat: 30.438333,
            lon: -81.438056,
            address: "676 Natureland Cir, St. Augustine, FL 32092, USA",
            custom: false,
            details: "asdasdasdsad",
            imageUrl:
              "https://lh5.googleusercontent.com/p/AF1QipNtVj045Rr-MPs2YeH8APuK3_sjzs_3VAYN9iXd=w408-h413-k-no",
          },
      ]);
      fetch(
        `http://localhost:3000/api/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
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
        `http://localhost:3000/api/get_custom_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
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
        <Text
          style={{
            textAlign: "center",
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
          }}
        >
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
      outputRange: [300, 750],
    }),
  };
  if (!prefEntered) {
    return (
      <View style={styles.textBox} >
        <Text style={styles.textBoxText}>
          Enter what you are most interesting in seeing and learning about:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
          placeholder="I LOVE gardens. I want to know more about this city's history."
          keyboardType="default"
        />
        <Button
          onPress={setPref}
          style={styles.textBoxText3}
          title="Submit My Preferences"
        />
      </View>
    );
  }

  if (showmap) {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.00922,
            longitudeDelta: 0.00421,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          mapType={"satellite"}
        />
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            setMap(!showmap);
          }}
        >
          <Ionicons name="ios-menu" size={44} color="#EBECF1" />
        </TouchableOpacity>

        <View style={styles.textBox}>
          <Text style={styles.textBoxText}>Location:</Text>
          <Text style={styles.textBoxText}>
            Latitude: {location.coords.latitude.toFixed(5)}
          </Text>
          <Text style={styles.textBoxText}>
            Longitude {location.coords.longitude.toFixed(5)}
          </Text>
        </View>

        <View style={styles.camera}>
          {/*<Camera style={styles.camera} type={type}>*/}
          <Animated.View style={[styles.textArea, animatedStyle]}>
            <View style={styles.container2}>
              <TouchableOpacity
                style={styles.detailsToggle}
                onPress={toggleDetails}
              >
                <View style={styles.box}></View>
              </TouchableOpacity>
              <View style={styles.constantSizeContainer}>
                <ScrollView style={styles.container2}>
                  {/*<View>*/}
                  {pois.concat(cutomPois).map((poi) => (
                    <TouchableOpacity>
                      <View style={styles.card} key={poi.name}>
                        <Text style={styles.cardTitle}>{poi.name}</Text>
                        <Text style={styles.cardText}>{poi.address}</Text>
                        <Text style={styles.cardText}>Latitude: {poi.lat}</Text>
                        <Text style={styles.cardText}>
                          Longitude: {poi.lon}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {/*</View>*/}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
          {/*</Camera>*/}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          setMap(!showmap);
        }}
      >
        <Ionicons name="ios-menu" size={44} color="#EBECF1" />
      </TouchableOpacity>

      <View style={styles.textBox}>
        <Text style={styles.textBoxText}>Location:</Text>
        <Text style={styles.textBoxText}>
          Latitude: {location.coords.latitude.toFixed(5)}
        </Text>
        <Text style={styles.textBoxText}>
          Longitude {location.coords.longitude.toFixed(5)}
        </Text>
      </View>

      {/*<View style={styles.camera}>*/}
      <Camera style={styles.camera} type={type}>
        <Animated.View style={[styles.textArea, animatedStyle]}>
          <View style={styles.container2}>
            <TouchableOpacity
              style={styles.detailsToggle}
              onPress={toggleDetails}
            >
              <View style={styles.box}></View>
            </TouchableOpacity>
            <View style={styles.constantSizeContainer}>
              <ScrollView style={styles.container2} 
    contentContainerStyle={{ flexGrow: 1 }}>
                <View style={{height:1000}}>
                {pois.concat(cutomPois).map((poi) => (
                  <TouchableOpacity>
                    <View style={styles.card} key={poi.name}>
                      <Image
                        style={{
                          width: "140%",
                          height: 300,
                          alignSelf: "center",
                          marginBottom: 10,
                        }}
                        source={{
                          uri: poi.imageUrl, // Assuming 'imageUrl' is a property in your POI objects
                        }}
                      />
                      <Text style={styles.cardTitle}>{poi.name}</Text>
                      <Text style={styles.cardText}>{poi.address}</Text>

                      <Text style={styles.cardText}>{poi.details}</Text>
                      <Text style={styles.cardText}>Latitude: {poi.lat}</Text>
                      <Text style={styles.cardText}>Longitude: {poi.lon}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      </Camera>
      {/*</View>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 36,
    margin: 5,
    padding: 40,
    paddingBottom: 10,
    paddingTop: 0,
    backgroundColor: "#02030a",
    overflow: "hidden",
  },
  input: {
    height: 40,
    marginTop: 200,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "#EBECF1",
    color: "#007AFF",
  },
  submit: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#EBECF1",
  },
  cardText: {
    fontSize: 16,
    marginBottom: 4,
    color: "#EBECF1",
  },
  box: {
    backgroundColor: "#007AFF",
    alignItems: "top",
    borderRadius: 10,
    padding: 5,
    marginTop: 15,
    width: 150,
  },
  container: {
    //flexDirection: 'column',
    flex: 1,
  },
  container2: {
    //flexDirection: 'column',
    flex: 1,
    //zIndex:1,

    //overflow: "hidden",
    height: 1000,
  },

  map: {
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  constantSizeContainer: {
    position: "absolute",
    marginTop: 40,
    marginRight: 0,
    height: 1000, // Set your desired height
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
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
    marginBottom: -30,
    borderRadius: 36,
    zIndex: 2,
  },
  detailsToggle: {
    flex: 1,
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
    flexDirection: "column", // <-- Add this line
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
    padding: 8,
  },
  locationIcon: {
    marginHorizontal: 10, // Add some margin to move it away from the edges
  },
  textBoxText: {
    flex: 1, // <-- Add this line to make text take available space
    alignSelf: "flex-start",
    textAlign: "right", // <-- Add this line to align text to the
    marginRight: 15,
    marginLeft: 30,
    fontSize: 16,
    fontWeight: "bold",
    color: "#EBECF1",
  },
  textBoxText2: {
    flex: 1, // <-- Add this line to make text take available space
    alignSelf: "flex-end",
    textAlign: "right", // <-- Add this line to align text to the
    marginRight: 30,
    fontSize: 16,
    fontWeight: "bold",
    color: "#EBECF1",
  },
  textBoxText3: {
    flex: 1, // <-- Add this line to make text take available space
    alignSelf: "flex-end",
    textAlign: "right", // <-- Add this line to align text to the
    marginRight: 30,
    fontSize: 16,
    fontWeight: "bold",
    color: "#EBECF1",
  },
});
