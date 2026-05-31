// Dummy file - Vercel handles Serverless Functions automatically
// This file exists only for local development with `vercel dev`

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('pages'));

// Catch-all for serving the SPA
app.get('/*', (req, res) => {
  res.sendFile(__dirname + '/pages/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
