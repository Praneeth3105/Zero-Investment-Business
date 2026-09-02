import fs from "fs";
import http from "http";
import { google } from "googleapis";

const credentials = JSON.parse(
  fs.readFileSync("./credentials/google-oauth.json", "utf8"),
);

const { client_id, client_secret, redirect_uris } = credentials.web;

const redirectUri = "http://localhost:3000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirectUri,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

console.log("\n========================================");
console.log("Open this URL in your browser:");
console.log("========================================\n");
console.log(authUrl);
console.log("\n========================================\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const url = new URL(req.url, "http://localhost:3000");
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("Authorization code not found.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log("\n========================================");
    console.log("AUTHORIZATION SUCCESSFUL");
    console.log("========================================\n");

    console.log("REFRESH TOKEN:");
    console.log(tokens.refresh_token);

    console.log("\n========================================");
    console.log("SAVE THIS TOKEN SECURELY.");
    console.log("DO NOT PUT IT ON GITHUB.");
    console.log("========================================\n");

    res.writeHead(200, {
      "Content-Type": "text/html",
    });

    res.end(`
      <h2>Gmail authorization successful!</h2>
      <p>You can close this browser tab and return to PowerShell.</p>
    `);

    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error("TOKEN ERROR:", error);

    res.writeHead(500);
    res.end("Failed to obtain authorization token.");
  }
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Waiting for Google authorization...");
});
