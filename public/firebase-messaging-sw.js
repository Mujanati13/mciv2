// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// firebase.initializeApp({
//   apiKey: "AIzaSyBKhrhYntOMVRYGuVOei6cPQCZTfDxyeTI",
//   authDomain: "mci-v1.firebaseapp.com",
//   projectId: "mci-v1",
//   storageBucket: "mci-v1.firebasestorage.app",
//   messagingSenderId: "58185573731",
//   appId: "1:58185573731:web:4b1f37fe9282d8f8e09f56",
// });

// const messaging = firebase.messaging();

// // Handle background messages
// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
//   const notificationTitle = payload.notification.title || 'New Message';
//   const notificationOptions = {
//     body: payload.notification.body || 'Background Message',
//     icon: '/firebase-logo.png', // Replace with your app's icon
//     badge: '/badge-icon.png',   // Replace with your badge icon
//     data: payload.data
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });