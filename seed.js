
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ideavault";

if (!uri) {
  console.error("MONGODB_URI is missing in your .env file");
  process.exit(1);
}

const sampleIdeas = [
  {
    title: "Smart Study Planner",
    shortDescription: "An AI-powered planner that helps students manage study goals and deadlines.",
    detailedDescription:
      "Smart Study Planner helps students organize assignments, exams, daily study tasks, and personal learning goals in one simple dashboard. It gives personalized suggestions based on deadlines and workload.",
    category: "Education",
    tags: ["education", "productivity", "student"],
    imageURL: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    estimatedBudget: "$1,500",
    targetAudience: "Students, teachers, and academic institutions",
    problemStatement:
      "Many students struggle to manage deadlines, study routines, and exam preparation properly.",
    proposedSolution:
      "A smart planning system that creates personalized study schedules, reminders, and progress tracking.",
    authorEmail: "admin@ideavault.com",
    authorName: "IdeaVault Team",
    authorPhoto: "",
    views: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "AI Resume Helper",
    shortDescription: "A resume improvement platform for fresh graduates and job seekers.",
    detailedDescription:
      "AI Resume Helper reviews resumes and suggests improvements for formatting, keywords, skills, and job-specific presentation. It helps users create stronger resumes for competitive job markets.",
    category: "AI",
    tags: ["ai", "career", "resume"],
    imageURL: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
    estimatedBudget: "$3,000",
    targetAudience: "Fresh graduates, job seekers, and career centers",
    problemStatement:
      "Many applicants have skills but fail to present them clearly in their resumes.",
    proposedSolution:
      "An AI-based resume analysis tool that gives practical suggestions and role-based resume improvements.",
    authorEmail: "admin@ideavault.com",
    authorName: "IdeaVault Team",
    authorPhoto: "",
    views: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "HealthTrack App",
    shortDescription: "A simple habit tracker for daily health and wellness goals.",
    detailedDescription:
      "HealthTrack App helps users track water intake, sleep, walking, exercise, and wellness habits. It is designed for people who want a simple, friendly way to build healthier routines.",
    category: "Health",
    tags: ["health", "wellness", "habit"],
    imageURL: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
    estimatedBudget: "$2,000",
    targetAudience: "Young adults, students, and health-conscious users",
    problemStatement:
      "People often fail to maintain consistent health habits because they do not track their progress.",
    proposedSolution:
      "A clean habit-tracking app with reminders, daily goals, progress insights, and simple wellness tips.",
    authorEmail: "admin@ideavault.com",
    authorName: "IdeaVault Team",
    authorPhoto: "",
    views: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Local Skill Exchange",
    shortDescription: "A community platform where people can exchange practical skills.",
    detailedDescription:
      "Local Skill Exchange connects people who want to teach and learn skills such as coding, design, cooking, language, photography, and freelancing. Users can exchange skills instead of paying for expensive courses.",
    category: "Tech",
    tags: ["community", "learning", "skills"],
    imageURL: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    estimatedBudget: "$2,500",
    targetAudience: "Students, freelancers, and local communities",
    problemStatement:
      "Many people want to learn practical skills but cannot afford premium courses or training programs.",
    proposedSolution:
      "A peer-to-peer learning platform where users can teach one skill and learn another from the community.",
    authorEmail: "admin@ideavault.com",
    authorName: "IdeaVault Team",
    authorPhoto: "",
    views: 39,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Green Delivery Network",
    shortDescription: "An eco-friendly delivery platform for small businesses.",
    detailedDescription:
      "Green Delivery Network connects local businesses with bicycle and electric vehicle delivery partners. It helps small shops reduce delivery costs while supporting cleaner transportation.",
    category: "Business",
    tags: ["green", "delivery", "startup"],
    imageURL: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68",
    estimatedBudget: "$4,000",
    targetAudience: "Local shops, restaurants, and delivery riders",
    problemStatement:
      "Small businesses need affordable delivery options, while cities face pollution from traditional delivery systems.",
    proposedSolution:
      "A delivery network that uses eco-friendly riders, optimized routes, and low-cost local delivery plans.",
    authorEmail: "admin@ideavault.com",
    authorName: "IdeaVault Team",
    authorPhoto: "",
    views: 34,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Mental Wellness Journal",
    shortDescription: "A private digital journal for mood tracking and self-care.",
    detailedDescription:
      "Mental Wellness Journal gives users a safe space to write daily thoughts, track mood, and follow simple self-care exercises. It focuses on emotional awareness and healthy routines.",
    category: "Health",
    tags: ["mental-health", "journal", "wellness"],
    imageURL: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    estimatedBudget: "$3,500",
    targetAudience: "Students, young professionals, and wellness-focused users",
    problemStatement:
      "Many people want emotional support tools but feel uncomfortable using complex mental health platforms.",
    proposedSolution:
      "A simple journaling and mood-tracking platform with guided prompts, privacy, and wellness reminders.",
    authorEmail: "admin@ideavault.com",
    authorName: "IdeaVault Team",
    authorPhoto: "",
    views: 26,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(dbName);
    const ideasCollection = db.collection("ideas");

    await ideasCollection.deleteMany({ authorEmail: "admin@ideavault.com" });

    const result = await ideasCollection.insertMany(sampleIdeas);

    console.log(`${result.insertedCount} sample ideas inserted successfully.`);
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await client.close();
  }
}

seedDatabase();

