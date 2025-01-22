require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Konfigurasi multer untuk upload file sementara
const upload = multer({ dest: "uploads/" });

// URL untuk meminta izin pengguna
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

// Endpoint untuk autentikasi OAuth2
app.get("/auth", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(authUrl);
});

// Endpoint untuk menangani callback OAuth2
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send("Authentication successful! You can now upload videos.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Authentication failed.");
  }
});

// Endpoint untuk upload video
app.post("/upload", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No video file uploaded.");
  }

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  try {
    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: "Sample Video",
          description: "This is a test video uploaded via YouTube API.",
        },
        status: {
          privacyStatus: "private",
        },
      },
      media: {
        body: fs.createReadStream(req.file.path),
      },
    });

    // Hapus file lokal setelah upload
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Video uploaded successfully!",
      videoId: response.data.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to upload video.");
  }
});

// Jalankan server
if (process.env.VERCEL_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Authorize the app at http://localhost:${PORT}/auth`);
  });
}

module.exports = app;
