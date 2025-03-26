// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";

// const firebaseApp = initializeApp({
//   apiKey: "AIzaSyBKhrhYntOMVRYGuVOei6cPQCZTfDxyeTI",
//   authDomain: "mci-v1.firebaseapp.com",
//   projectId: "mci-v1",
//   storageBucket: "mci-v1.firebasestorage.app",
//   messagingSenderId: "58185573731",
//   appId: "1:58185573731:web:4b1f37fe9282d8f8e09f56",
// });

// const messaging = getMessaging(firebaseApp);

// // Request permission and get token
// async function requestNotificationPermission() {
//   try {
//     const permission = await Notification.requestPermission();
//     if (permission === 'granted') {
//       const token = await getToken(messaging, {
//         vapidKey: 'BNr1YPHHD-jYLHyQcJUduQyVZA7BWGIx1q6e8m-bU442LV7Hu28P80AJyJNL998WF563PHdD97BLtZNpYJW-sSw' // Add your VAPID key here
//       });
//       console.log('Token:', token);
//       return token;
//     }
//   } catch (error) {
//     console.error('Error getting permission or token:', error);
//   }
// }

// // Handle foreground messages
// onMessage(messaging, (payload) => {
//   console.log('Received foreground message:', payload);
//   // Handle the message however you want in the foreground
// });

// export { messaging, requestNotificationPermission };