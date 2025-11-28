// Debugging handler to log initialization errors
function logInitializationError(error) {
  const errorContainer = document.getElementById('auth-form-container');
  if (errorContainer) {
    errorContainer.innerText = error;
  }
}

// Example usage
try {
  // Initialization code here...
} catch (error) {
  logInitializationError(error.message);
}
