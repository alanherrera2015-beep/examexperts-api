const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Demo users database (replace with real database later)
const users = [
  {
    id: 1,
    email: "tutor@examexperts.com",
    password: "Password123!",
    name: "Sarah Tutor",
    role: "Tutor",
    certProgress: 65,
    sessionsCompleted: 23,
    createdAt: "2024-09-15"
  },
  {
    id: 2,
    email: "manager@examexperts.com",
    password: "Password123!",
    name: "James Manager",
    role: "Manager",
    teamSize: 8,
    avgCompliance: 83,
    createdAt: "2024-08-01"
  },
  {
    id: 3,
    email: "admin@examexperts.com",
    password: "Mytime22!",
    name: "Alan Herrera",
    role: "Admin",
    totalUsers: 15,
    createdAt: "2024-07-01"
  }
];

// Store for new users (in-memory, will be lost on restart)
let registeredUsers = [...users];

// ===== HELPER FUNCTIONS =====

// Validate email format
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate password strength
function validatePassword(password) {
  const requirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
  
  const allMet = Object.values(requirements).every(r => r);
  let score = 0;
  Object.values(requirements).forEach(r => { if(r) score += 20; });
  
  let strength = 'weak';
  if(score >= 67) strength = 'strong';
  else if(score >= 34) strength = 'medium';
  
  return { requirements, allMet, strength, score };
}

// Generate JWT token
function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ===== API ENDPOINTS =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// LOGIN ENDPOINT
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const user = registeredUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    
    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// SIGNUP ENDPOINT
app.post('/api/signup', (req, res) => {
  try {
    const { email, password, passwordConfirm, name, role } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.allMet) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        requirements: passwordCheck.requirements
      });
    }
    
    // Check if user already exists
    if (registeredUsers.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const newUser = {
      id: registeredUsers.length + 1,
      email,
      password, // In production, hash this!
      name,
      role: role || 'Tutor',
      certProgress: 0,
      sessionsCompleted: 0,
      createdAt: new Date().toISOString()
    };
    
    registeredUsers.push(newUser);
    
    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      token: token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// VALIDATE PASSWORD ENDPOINT
app.post('/api/validate-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    const validation = validatePassword(password);
    
    res.json({
      strength: validation.strength,
      score: validation.score,
      requirements: validation.requirements,
      isValid: validation.allMet
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET USER PROFILE (requires auth)
app.get('/api/user/profile', verifyToken, (req, res) => {
  try {
    const user = registeredUsers.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        certProgress: user.certProgress,
        sessionsCompleted: user.sessionsCompleted,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE USER PROFILE (requires auth)
app.put('/api/user/profile', verifyToken, (req, res) => {
  try {
    const { name } = req.body;
    const user = registeredUsers.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (name) {
      user.name = name;
    }
    
    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CHANGE PASSWORD (requires auth)
app.post('/api/user/change-password', verifyToken, (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = registeredUsers.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }
    
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.allMet) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        requirements: passwordCheck.requirements
      });
    }
    
    user.password = newPassword;
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ALL USERS (Admin only - for analytics dashboard)
app.get('/api/admin/users', verifyToken, (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const userList = registeredUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt
    }));
    
    res.json({
      success: true,
      totalUsers: userList.length,
      users: userList
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGOUT ENDPOINT (optional, mainly frontend-side)
app.post('/api/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// 404 Error handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ExamExperts API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ API Health: http://localhost:${PORT}/api/health`);
  console.log('\n📝 Demo Accounts:');
  console.log('   Email: tutor@examexperts.com | Password: Password123!');
  console.log('   Email: manager@examexperts.com | Password: Password123!');
  console.log('   Email: admin@examexperts.com | Password: Password123!');
});

module.exports = app;
