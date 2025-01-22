const { google } = require("googleapis");
const multer = require("multer");
const fs = require("fs");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Middleware multer
const upload = multer({ dest: "/tmp" });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Method Not Allowed" });
  }

  upload.single("video")(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ error: "File upload failed" });
    }

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const videoPath = req.file.path;

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
          body: fs.createReadStream(videoPath),
        },
      });

      fs.unlinkSync(videoPath); // Hapus file sementara
      res.status(200).send({ message: "Video uploaded!", videoId: response.data.id });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Video upload failed" });
    }
  });
};
