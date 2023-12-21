import {Ionicons} from "@expo/vector-icons";
import {Camera, CameraType} from "expo-camera";
import {
  Animated,
  Button,
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import * as Location from "expo-location";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import MapView, {Marker} from "react-native-maps";


export default function App() {
  const vh = Dimensions.get("window").height/100;
  const vw = Dimensions.get("window").width/100;
  // console.log(vh, vw);
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [location, setLocation] = useState(JSON.parse('{"coords":{"accuracy":5,"altitude":0,"altitudeAccuracy":-1,"heading":-1,"latitude":30.351810,"longitude":-81.672820,"speed":-1},"timestamp":1619620000000}'));
  const [pois, setPois] = useState([]);
  const [customPois, setCustomPois] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [showmap, setMap] = useState(false);
  const [prefEntered, setPref] = useState(false);

  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [description, setDescription] = useState("");
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [text, onChangeText] = React.useState("");
  const [uri, setURI] = React.useState("https://geoblendapi.deltaprojects.dev/api");

  const [sound, setSound] = React.useState();


  useEffect(() => {
    (async () => {
           
      console.log("Getting location");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Highest, maximumAge: 100000});
      if (loc.coords.latitude) {
        setLocation(loc);
      }
      console.log(location);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      console.log(`${uri}/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`);
      fetch(
          `${uri}/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
          {method: "GET"}
      )
          .then((response) => response.json())
          .then((poiData) => {
            console.log(poiData);
            setPois(poiData);
          })
          .catch((err) => {
            console.log("error" + err);
          });

      fetch(
          `${uri}/get_custom_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
          {method: "GET"}
      )
          .then((response) => response.json())
          .then((customPoiData) => {
            setCustomPois(customPoiData);
          })
          .catch((err) => {
            console.log("error" + err);
          });
    }
  }, [location]);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
    
  }, [sound]);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.containerCentered}>
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
      outputRange: [vh*25, vh*85],
    }),
  };
  if (!prefEntered) {
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.containerCentered} >
        <Text style={{textAlign:"center", fontSize:20}}>
          Enter what you are most interesting in seeing and learning about:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
          multiline = {true}
          numberOfLines = {4}
          placeholder="I LOVE gardens. I want to know more about this city's history."
          keyboardType="default"
        />
        <Button
          onPress={setPref}
          style={styles.textBoxText3}
          title="Submit My Preferences"
        />
      </View>
        </TouchableWithoutFeedback>
    );
  }

  function haversineDistanceInMiles(coords1, coords2) {
    const toRadians = angle => angle * Math.PI / 180;

    const earthRadiusMiles = 3958.8; // Earth's radius in miles
    const lat1 = toRadians(coords1.lat);
    const lat2 = toRadians(coords2.lat);
    const deltaLat = toRadians(coords2.lat - coords1.lat);
    const deltaLon = toRadians(coords2.lon - coords1.lon);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMiles * c; // Distance in miles
  }
  // console.log(pois)
  const allPois = pois.concat(customPois);
  allPois.forEach((poi) => {
    poi.dist = haversineDistanceInMiles({lat: location.coords.latitude, lon: location.coords.longitude}, poi)
  });
  allPois.sort((a, b) => a.dist - b.dist);

  // console.log(allPois);

  const playSound = async (text) => {
    console.log("Playing")
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, 
      staysActiveInBackground: true,
    });
    
    try {
      const response = await fetch(`${uri}/openai_tts?text=${text}`);
      const blob = await response.blob();

      const fileInfo = await FileSystem.getInfoAsync("./assets/POINarration.mp3");
      if (fileInfo.exists) {
      
        await FileSystem.deleteAsync("./assets/POINarration.mp3");
      }

      await FileSystem.writeAsStringAsync("./assets/POINarration.mp3", blob, { encoding: FileSystem.EncodingType.Base64 });
    
      console.log(blob);
      
      // const url = URL.createObjectURL(blob);
      // console.log(url);
    
      // const { sound } = await Audio.Sound.createAsync({ uri: url });
      const { sound } = await localSound.loadAsync({ uri: "./assets/POINarration.mp3" });
      setSound(sound);
      console.log(sound);
      await sound.playAsync();
      console.log("success");
    } catch (err) {
      console.error("Error:", err);
    }
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
          showsMyLocationButton={true}
          showsCompass={true}
          mapType={"satellite"}
        >
          {allPois.map((poi, idx) => (
                  <Marker
                      coordinate={{latitude: poi.lat, longitude: poi.lon}}
                      title={poi.name}
                      description={`${Math.round(poi.dist * 100) / 100} mile(s) away`}
                      key={idx}
                  />
              )
          )}
        </MapView>
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
      </View>
    );
  }
  else {
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
        {/* put in that sliding stuff ehre */}

        <View style={styles.textBox}>
          <Text style={styles.textBoxText}>Location:</Text>
          <Text style={styles.textBoxText}>
            Latitude: {location.coords.latitude.toFixed(5)}
          </Text>
          <Text style={styles.textBoxText}>
            Longitude {location.coords.longitude.toFixed(5)}
          </Text>
        </View>

        <Camera style={styles.details} type={type}>
          <Animated.View style={[styles.textArea, animatedStyle]}>
            <View style={styles.container2}>
              <TouchableOpacity
                style={styles.detailsToggle}
                onPress={toggleDetails}
              >
                <View style={styles.box}></View>
              </TouchableOpacity>
              <View style={styles.constantSizeContainer}>
                {
                  selectedPoi
                      ? 
                      <View >
                        
                        <TouchableOpacity onPress={() => setSelectedPoi(null)} style={styles.closeButton}>
                          <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => playSound(description)}>
                          <Text style={styles.closeButtonText}>Play</Text>
                        </TouchableOpacity>
                        {/* <Image source={{uri: selectedPoi.imgUrl}} style={{ width: 200, height: 200 }}/> */}
                        <Text style={styles.cardTitle}>{selectedPoi.name}</Text>
                        <Text style={styles.cardText}>{description}</Text>
                      </View>
                      : <ScrollView style={styles.container2}>
                        {
                          allPois.map((poi, idx) => (
                              <TouchableOpacity key={idx} onPress={() => {
                                setDescription("Loading...");
                                setSelectedPoi(poi)
                                // setDescription("Loading...");
                                fetch(
                                  `${uri}/openai_rephrase?info=${JSON.stringify(poi)}`,
                                  {method: "GET"}
                              )
                                  .then((response) => response.json())
                                  .then((poiData) => {
                                    setDescription(poiData.message);
                                    // setSelectedPoi(poi)
                                  })
                                  .catch((err) => {
                                    console.log(err);
                                  })
                                  console.log( `${uri}/openai_rephrase?info=${JSON.stringify(poi)}`)
                              }
                              
                              }>
                                <View style={styles.card}>
                                  <Text style={styles.cardTitle}>{poi.name}</Text>
                                  <Text style={styles.cardText}>{poi.address}</Text>
                                  <Text style={styles.cardText}>Latitude: {poi.lat}</Text>
                                  <Text style={styles.cardText}>Longitude: {poi.lon}</Text>
                                  <Text style={styles.cardText}>{Math.round(poi.dist * 100) / 100} mile(s) away</Text>
                                </View>
                              </TouchableOpacity>
                          ))
                        }
                      </ScrollView>
                }
              </View>
            </View>
          </Animated.View>
        </Camera>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 36,
    margin: 5,
    padding: 40,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: "#02030a",
    overflow: "hidden",
  },
  input: {
    height: 200,
    margin: 20,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#EBECF1",
    color: "#02030a",
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
    flex: 1,
    // position: "absolute",
  },
  containerCentered: {
    display:"grid", 
    justifyContent:"center", 
    textAllign:"center", 
    padding:20, 
    width:"100%", 
    height:"100%"
  },
  container2: {
    flex: 1,
    width: "100%",
    overflow: "scroll",
    marginBottom: 35,
    height: "100%",
  },

  map: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 1,
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
  },
  constantSizeContainer: {
    // position: "absolute",
    marginTop: 40,
    marginRight: 0,
    height: "100%", // Set your desired height
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  details: {
    flex: 1,
    // position: "relative",
    // zIndex: 0,
    // height: "50%",
    // margin: 0,
  },
  textArea: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1B1C25",
    // marginTop: 750,
    marginLeft: 1,
    marginRight: 1,
    marginBottom: 0,
    borderRadius: 35,
    zIndex: 1,
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

  closeButton: {
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3
  },

  closeButtonText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
