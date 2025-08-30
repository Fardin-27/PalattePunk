require('dotenv').config();
const mongoose = require('mongoose');
const minimist = require('minimist');

const User = require('../models/User');
const Notification = require('../models/Notification');

(async () => {
  const args = minimist(process.argv.slice(2));
  const email = args.email || args.e || null;
  const id = args.id || args._id || null;

  if (!process.env.MONGO_URI) {
    console.error('❌ Missing MONGO_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  let user = null;
  if (id) {
    user = await User.findById(id).select('_id email');
  } else if (email) {
    user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('_id email');
  } else {
    console.error('Usage: node scripts/seedNotifications.js --email you@example.com  OR  --id <userId>');
    console.error('Pro tip: call GET /api/auth/me with your token to see your id/email.');
    process.exit(1);
  }

  if (!user) {
    console.error('❌ No user found for the given identifier');
    process.exit(1);
  }

  const docs = [
    {
      user: user._id,
      type: 'info',
      title: 'Welcome to PalettePunk',
      body: 'Your account is ready. Explore the market!',
      isRead: false,
    },
    {
      user: user._id,
      type: 'role',
      title: 'Role Request Approved',
      body: 'Your Artist role is now active.',
      isRead: false,
    },
  ];

  const res = await Notification.insertMany(docs);
  console.log(`✅ Inserted ${res.length} notifications for ${user.email || user._id}`);

  await mongoose.disconnect();
})();
