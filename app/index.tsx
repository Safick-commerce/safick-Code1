import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loginscreens from "./screens/loginscreens/Loginscreens";

const AUTH_KEY = "user_logged_in";

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(AUTH_KEY);
        // #region agent log
        fetch('http://127.0.0.1:7795/ingest/37eacd44-5dc4-4313-8413-ac6c68b6e4f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a40776'},body:JSON.stringify({sessionId:'a40776',location:'index.tsx:AsyncStorage',message:'Auth check',data:{value,isTrue:value==='true'},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        setIsLoggedIn(value === "true");
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7795/ingest/37eacd44-5dc4-4313-8413-ac6c68b6e4f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a40776'},body:JSON.stringify({sessionId:'a40776',location:'index.tsx:AsyncStorage catch',message:'AsyncStorage error',data:{err:String(e)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLoginSuccess = async () => {
    await AsyncStorage.setItem(AUTH_KEY, "true");
    setIsLoggedIn(true);
    router.replace("/(tabs)");
  };

  /** Navigate to the sign-in screen when user taps "I already have an account" */
  const handleSignInPress = () => {
    router.push("/screens/loginscreens/signinscreen");
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF2800" />
      </View>
    );
  }

  if (!isLoggedIn) {
    // #region agent log
    fetch('http://127.0.0.1:7795/ingest/37eacd44-5dc4-4313-8413-ac6c68b6e4f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a40776'},body:JSON.stringify({sessionId:'a40776',location:'index.tsx:branch',message:'Rendering Loginscreens',data:{isLoading,isLoggedIn},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return (
      <Loginscreens
        onSuccess={handleLoginSuccess}
        onSignInPress={handleSignInPress}
        logoIconSource={require('../assets/images/icons.png')}
      />
    );
  }

  // Already logged in: redirect in useEffect to avoid calling router during render
  return <RedirectToTabs />;
}

function RedirectToTabs() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(tabs)");
  }, [router]);
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#FF2800" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});