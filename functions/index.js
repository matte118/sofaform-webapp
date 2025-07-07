// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onValueDeleted } = require("firebase-functions/v2/database");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");

// Initialize app with a service account
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  databaseURL:
    "https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app",
});

/**
 * When a user is deleted from the RTDB at /users/{uid},
 * this function deletes the corresponding user from Firebase Auth.
 *
 * @param {object} event - The event payload
 * @return {Promise<void>} A promise that resolves when the user is deleted
 */
exports.removeUser = onValueDeleted(
  {
    ref: "/users/{uid}",
    region: "europe-west1",
  },
  async (event) => {
    const uid = event.params.uid;
    try {
      await admin.auth().deleteUser(uid);
      console.log(`User ${uid} successfully deleted from Auth`);
      return null;
    } catch (error) {
      console.error(`Failed to delete auth user ${uid}:`, error);
      return null;
    }
  }
);
