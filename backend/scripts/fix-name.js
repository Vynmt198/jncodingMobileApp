const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const UserSchema = new mongoose.Schema({
  email: String,
  fullName: String,
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function updateName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oplw');
    const result = await User.findOneAndUpdate(
      { email: 'learner@oplw.com' },
      { fullName: 'Learner Demo' },
      { new: true }
    );
    if (result) {
      console.log('Successfully updated name in DB to:', result.fullName);
    } else {
      console.log('User not found.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
updateName();
