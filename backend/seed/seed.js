// seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LearnerHub from '../models/LearnerHub.js';
import User from '../models/User.js';

dotenv.config();

console.log('🔍 Loaded MONGODB_URI:', process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is undefined. Check your .env file name or path.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected for Seeding'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 🧩 MOCK LEARNER HUBS
const mockHubs = [
  {
    name: 'AI & Machine Learning Hub',
    description: 'A community for learning and building AI and ML projects together.',
    category: 'Technology',
    tags: ['AI', 'Machine Learning', 'Python'],
    privacyType: 'public',
  },
  {
    name: 'Web Development Warriors',
    description: 'Frontend and backend enthusiasts sharing modern web dev knowledge.',
    category: 'Development',
    tags: ['React', 'Node.js', 'Full Stack'],
    privacyType: 'public',
  },
  {
    name: 'Cybersecurity Learners Club',
    description: 'Dive deep into ethical hacking, security tools, and certifications.',
    category: 'Security',
    tags: ['Cybersecurity', 'Ethical Hacking', 'Networking'],
    privacyType: 'request-to-join',
  },
  {
    name: 'Data Science Gurus',
    description: 'Learn data analytics, visualization, and machine learning hands-on.',
    category: 'Data Science',
    tags: ['Data', 'Statistics', 'AI'],
    privacyType: 'public',
  },
  {
    name: 'UI/UX Design Hub',
    description: 'For creative designers to collaborate and share UI/UX best practices.',
    category: 'Design',
    tags: ['Figma', 'Design Thinking', 'Prototyping'],
    privacyType: 'public',
  },
];

// 🚀 SEED FUNCTION
const seedDatabase = async () => {
  try {
    const createdUsers = await User.find().limit(5);

    if (createdUsers.length === 0) {
      console.error('❌ No users found in the database. Please create at least one user.');
      process.exit(1);
    }

    await LearnerHub.deleteMany();
    console.log('🧹 Cleared old learner hubs');

    const hubsToInsert = mockHubs.map((hub, index) => ({
      ...hub,
      creator: createdUsers[index % createdUsers.length]._id,
      members: [
        {
          user: createdUsers[index % createdUsers.length]._id,
          role: 'admin',
        },
      ],
    }));

    const createdHubs = await LearnerHub.insertMany(hubsToInsert);
    console.log(`✅ Created ${createdHubs.length} learner hubs`);

    console.log('🌱 Seeding complete!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    mongoose.connection.close();
  }
};

seedDatabase();
