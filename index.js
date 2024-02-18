import express, { json } from "express";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import language from "@google-cloud/language";

import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import { read } from "fs";

import { db } from "./db.js";

import dotenv from "dotenv"
dotenv.config()

const app = express();
const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const nlpclient = new language.LanguageServiceClient();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = "http://localhost:3000/auth/callback";
const scopes = [
  "profile",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly"];

const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

setUpWebHook();  //setting up a web hook to watch the user's inbox

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

//authetication
function authenticate(res) {
  res.send(`<a href="${authUrl}">Authorize this app to access your Gmail</a>`);
  res.redirect("http://localhost:3000/")
}

// var searchQuery = "subject:(Thank you for your application to Addepar)";
var searchQuery =
  "(subject:'application' OR subject:'thanks' OR subject:'received' OR subject:'interest' OR subject:'applying')";

//extract the body of the email™
function getBody(payload) {
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain") {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
  }
  return "";
}

async function getMessage(gmail, message) {
  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });
    const headers = response.data.payload.headers;
    const body = getBody(response.data.payload);
    const date = new Date(parseInt(response.data.internalDate));
    for (const header of headers) {
      if (header.name === "Subject") {
        //console.log(header.value);
        return [header.value, body, date];
      }
    }
  } catch (error) {
    throw error;
  }
}

let companies = [];

//Landing page for the application
app.get("/",async (req,res)=>{
  const resp = await authenticate(res);
  res.redirect("http://localhost:3000/emails")
});

app.get("/emails", async (req, res) => {
  try {
    // const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const msgListRes = await gmail.users.messages.list({
      userId: "me",
      q: searchQuery,
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  res.redirect("/emails");
});

async function classifyText(body) {
  try {
    let response = await fetch("http://localhost:8000/nlp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: body }),
    });
    response = await response.json();
    console.log("Response from spacy", response);
    if (response.length > 0) {
      companies.push(response[0]);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function setUpWebHook(gmail) {
  const request = {
    userId: "me",
    requestBody: {
      labelIds: ["INBOX"], //  label(s) to watch
      topicName: "projects/"+process.env.GOOGLE_PROJECT_ID+"/topics/"+TOPIC_NAME, // Your Cloud Pub/Sub topic
    },
  };

  // Watch the Gmail inbox for new messages
  try {
    const response = await gmail.users.watch(request);
    console.log("Gmail API watch request successful:", response.data);
  } catch (error) {
    console.error("Error setting up Gmail API watch:", error);
  }
}
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
