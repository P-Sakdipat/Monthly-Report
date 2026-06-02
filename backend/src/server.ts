import app from './app';

const PORT = process.env.PORT || 5000;

// Start listening for requests on specified port
app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`🚀 API Server successfully started on port ${PORT}`);
  console.log(`📖 Interactive API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`===========================================================`);
});
