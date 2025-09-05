// functions/index.js

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onValueDeleted } = require("firebase-functions/v2/database");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");

// Initialize app - Cloud Functions have default access, no need for service account
admin.initializeApp({
  databaseURL:
    "https://sofaform-59f6f-default-rtdb.europe-west1.firebasedatabase.app",
});

// Define OpenAI API Key as a secret parameter
const openaiApiKey = defineString("OPENAI_API_KEY");

/**
 * Cloud Function per gestire le traduzioni tramite OpenAI API
 * Protegge l'API key mantenendola sul server
 */
exports.translateTexts = onRequest(
  {
    region: "europe-west1",
    cors: {
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async (req, res) => {
    console.log("Function called with method:", req.method);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);

    // Handle preflight CORS request
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Max-Age", "3600");
      return res.status(204).send("");
    }

    // Set CORS headers for actual request
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");

    // Verifica il metodo HTTP
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { texts, targetLanguage } = req.body;

      console.log("Processing translation request:", {
        textsCount: texts?.length,
        targetLanguage,
      });

      // Validazione input
      if (!texts || !Array.isArray(texts) || !targetLanguage) {
        return res.status(400).json({
          error: "Invalid request: texts array and targetLanguage are required",
        });
      }

      // Se la lingua è italiana, ritorna identity mapping
      if (targetLanguage === "it") {
        const translations = {};
        texts.forEach((text) => (translations[text] = text));
        console.log("Italian language detected, returning identity mapping");
        return res.json({ translations });
      }

      // Mapping lingue
      const languageNames = {
        en: "English",
        fr: "French",
        de: "German",
        es: "Spanish",
        pt: "Portuguese",
      };

      const targetLang = languageNames[targetLanguage] || "English";
      console.log("Target language:", targetLang);

      // Prepara la richiesta per OpenAI
      const openaiPayload = {
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in furniture and sofa product catalogs. Translate ALL texts from Italian to ${targetLang}. Keep model names, keep units, keep category codes numbers (e.g. 'CAT. 1'), but translate labels when appropriate. **Produce ONLY valid JSON** in this format: {"translations": {"<src>": "<dst>", ...}}`,
          },
          {
            role: "user",
            content: `Translate these: ${JSON.stringify(texts)}`,
          },
        ],
      };

      // Chiamata all'API OpenAI
      const fetch = (await import("node-fetch")).default;
      console.log("Calling OpenAI API...");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey.value()}`,
        },
        body: JSON.stringify(openaiPayload),
      });

      console.log("OpenAI response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No translation content received from OpenAI");
      }

      console.log("Translation successful");
      const parsed = JSON.parse(content);
      const translations = parsed.translations || {};

      return res.json({ translations });
    } catch (error) {
      console.error("Translation error:", error);

      // Fallback: ritorna testi originali in caso di errore
      const fallbackTranslations = {};
      if (req.body.texts && Array.isArray(req.body.texts)) {
        req.body.texts.forEach((text) => (fallbackTranslations[text] = text));
      }

      return res.status(200).json({
        translations: fallbackTranslations,
        warning: "Translation failed, using original texts",
        error: error.message,
      });
    }
  }
);

/**
 * When a user is deleted from the RTDB at /users/{uid},
 * this function deletes the corresponding user from Firebase Auth.
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
return null;

