const express = require('express');
const path = require('path');

const app = express();
const PORT = 5004;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving the appropriate HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/clients', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clients.html'));
});

app.get('/measurements', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`StyleTrack server is running on http://localhost:${PORT}`);
  console.log(`Access the application at: http://localhost:${PORT}`);
});
