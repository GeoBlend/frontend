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
  Dimensions,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import MapView from "react-native-maps";

export default function App() {
  const vh = Dimensions.get("window").height/100;
  const vw = Dimensions.get("window").width/100;
  // console.log(vh, vw);
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [location, setLocation] = useState(null);
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
      let loc = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Highest, maximumAge: 100000});
      setLocation(loc);
      console.log(location);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      //console.log(`http://localhost:3000/api/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`)
      //TODO: Remove this
      // setPois([
      //   {
      //     name: "St. Johns County, Florida",
      //     wikipedia_url:
      //       "http://en.wikipedia.org/wiki/St._Johns_County,_Florida",
      //     lat: 29.93781345,
      //     lon: -81.45145655,
      //     address: "676 Natureland Cir, St. Augustine, FL 32092, USA",
      //     custom: false,
      //     details: "St. Johns County is a county in the northeastern part of the U.S. state of Florida. As of the 2020 United States Census, its population was 273,425.[1] The county seat and largest incorporated city is St. Augustine, although the largest community, St. Johns, is much larger.[2] St. Johns County is part of the Jacksonville metropolitan area. The county was established in 1821. It was named for the St. Johns River, which runs along its western border. The St. Johns River is the longest river in Florida and is the state's most significant commercial, agricultural, residential, and recreational waterway. St. Johns County is one of the two original counties of Florida, established July 21, 1821, when Florida became a state, and was divided into 39 counties in 1824. St. Johns County was created out of Duval County, which covered most of the northern part of the state.",
      //     imageUrl:
      //       "https://lh5.googleusercontent.com/p/AF1QipNtVj045Rr-MPs2YeH8APuK3_sjzs_3VAYN9iXd=w408-h413-k-no",
      //   },
      //   {
      //       name: "Kingsley Plantation",
      //       wikipedia_url:
      //         "https://en.wikipedia.org/wiki/Kingsley_Plantation",
      //       lat: 30.438333,
      //       lon: -81.438056,
      //       address: "676 Natureland Circle, St. Augustine, FL 32092, USA",
      //       custom: false,
      //       details: "Kingsley Plantation (also known as the Zephaniah Kingsley Plantation Home and Buildings) is the site of a former estate on Fort George Island, in Duval County, Florida, that was named for its developer and most famous owner, Zephaniah Kingsley, who spent 25 years there. It is located at the northern tip of Fort George Island at Fort George Inlet, and is part of the Timucuan Ecological and Historic Preserve managed by the U.S. National Park Service. Kingsley's house is the oldest plantation house still standing in Florida, and the solidly-built village of slave cabins is one of the best preserved in the United States. It is also ",
      //       imageUrl:
      //         "https://lh5.googleusercontent.com/p/AF1QipNtVj045Rr-MPs2YeH8APuK3_sjzs_3VAYN9iXd=w408-h413-k-no",
      //     },
      // ]);
      // fetch(
      //   `http://localhost:3000/api/get_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
      //   { method: "GET" }
      // )
      //   .then((response) => response.json())
      //   .then((data) => {
      //     setPois(data);
      //     // console.log(
      //     //   2,
      //     //   location.coords.latitude,
      //     //   location.coords.longitude,
      //     //   data[0]
      //     // );
      //   })
      //   .catch((err) => {
      //     console.log(err.message);
      //   });
      fetch(
        `http://localhost:3000/api/get_custom_pois?lat=${location.coords.latitude}&lon=${location.coords.longitude}`,
        { method: "GET" }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setCustomPois(data);
          // console.log(
            
          //   1,
          //   location.coords.latitude,
          //   location.coords.longitude,
          //   data[0]
          // );
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
    );
  }
  var allPois = pois.concat(cutomPois)
  console.log(allPois);
  allPois.forEach((poi) => {
    poi.dist = Math.sqrt(Math.pow(Math.abs(location.coords.latitude - poi.lat), 2) + Math.pow(Math.abs(location.coords.longitude - poi.lon), 2));
    // console.log(poi.dist);
  });
  allPois.sort((a, b) => a.dist - b.dist);

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

        <View style={styles.details}>
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
                  {/* <View style={{height:"100%"}}> */}
                  {allPois.map((poi) => (
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
                        <Text style={styles.cardText}>Dist: {poi.dist}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {/* </View> */}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
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
                <ScrollView style={styles.container2}>
                  {/* <View style={{height:"100%"}}> */}
                  {allPois.map((poi) => (
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
                        <Text style={styles.cardText}>Dist: {poi.dist}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {/* </View> */}
                </ScrollView>
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
    paddingTop: 0,
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
});
