const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create a new Admin user
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'Admin',
      status: 'active'
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin account created successfully!' });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAdmin
};
