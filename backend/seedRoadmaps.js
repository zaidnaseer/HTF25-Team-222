import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Roadmap from './models/Roadmap.js';
import connectDB from './config/db.js';

dotenv.config();

const approvedRoadmaps = [
    {
        title: "Full Stack Web Development",
        description: "Master both frontend and backend technologies to become a complete web developer",
        category: "Web Development",
        difficulty: "intermediate",
        type: "approved",
        isTemplate: true,
        isApproved: true,
        estimatedDuration: "6 months",
        tags: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
        milestones: [
            {
                title: "Frontend Fundamentals",
                description: "Learn HTML, CSS, and JavaScript basics",
                order: 1,
                tasks: [
                    {
                        title: "HTML & CSS Mastery",
                        description: "Build responsive layouts with semantic HTML and modern CSS",
                        resources: [
                            { title: "MDN HTML Guide", url: "https://developer.mozilla.org/en-US/docs/Web/HTML", type: "documentation" },
                            { title: "CSS Tricks", url: "https://css-tricks.com", type: "tutorial" }
                        ],
                        completed: false
                    },
                    {
                        title: "JavaScript Fundamentals",
                        description: "Variables, functions, arrays, objects, and DOM manipulation",
                        resources: [
                            { title: "JavaScript.info", url: "https://javascript.info", type: "tutorial" }
                        ],
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "React Development",
                description: "Build modern UIs with React",
                order: 2,
                tasks: [
                    {
                        title: "React Basics",
                        description: "Components, Props, State, and Hooks",
                        resources: [
                            { title: "React Official Docs", url: "https://react.dev", type: "documentation" }
                        ],
                        completed: false
                    },
                    {
                        title: "State Management",
                        description: "Context API and Redux",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Backend with Node.js",
                description: "Create RESTful APIs",
                order: 3,
                tasks: [
                    {
                        title: "Express.js Fundamentals",
                        description: "Routing, middleware, and API design",
                        completed: false
                    },
                    {
                        title: "MongoDB Integration",
                        description: "Database modeling with Mongoose",
                        completed: false
                    }
                ],
                completed: false
            }
        ],
        usedBy: 0
    },
    {
        title: "Data Science with Python",
        description: "Learn data analysis, visualization, and machine learning from scratch",
        category: "Data Science",
        difficulty: "beginner",
        type: "approved",
        isTemplate: true,
        isApproved: true,
        estimatedDuration: "4 months",
        tags: ["Python", "Pandas", "NumPy", "Machine Learning", "Visualization"],
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
        milestones: [
            {
                title: "Python Programming",
                description: "Master Python basics and data structures",
                order: 1,
                tasks: [
                    {
                        title: "Python Syntax & Data Types",
                        description: "Variables, lists, dictionaries, functions",
                        completed: false
                    },
                    {
                        title: "Object-Oriented Programming",
                        description: "Classes, inheritance, and modules",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Data Analysis",
                description: "Work with Pandas and NumPy",
                order: 2,
                tasks: [
                    {
                        title: "Pandas DataFrames",
                        description: "Data manipulation and cleaning",
                        completed: false
                    },
                    {
                        title: "Statistical Analysis",
                        description: "Descriptive statistics and hypothesis testing",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Machine Learning Basics",
                description: "Introduction to ML algorithms",
                order: 3,
                tasks: [
                    {
                        title: "Supervised Learning",
                        description: "Linear regression and classification",
                        completed: false
                    }
                ],
                completed: false
            }
        ],
        usedBy: 0
    },
    {
        title: "Mobile App Development with React Native",
        description: "Build cross-platform mobile apps for iOS and Android",
        category: "Mobile Development",
        difficulty: "intermediate",
        type: "approved",
        isTemplate: true,
        isApproved: true,
        estimatedDuration: "3 months",
        tags: ["React Native", "Mobile", "JavaScript", "iOS", "Android"],
        thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
        milestones: [
            {
                title: "React Native Basics",
                description: "Setup and fundamental components",
                order: 1,
                tasks: [
                    {
                        title: "Environment Setup",
                        description: "Install Expo and development tools",
                        completed: false
                    },
                    {
                        title: "Core Components",
                        description: "View, Text, Image, ScrollView, FlatList",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Navigation & State",
                description: "React Navigation and state management",
                order: 2,
                tasks: [
                    {
                        title: "Stack & Tab Navigation",
                        description: "Implement multi-screen navigation",
                        completed: false
                    }
                ],
                completed: false
            }
        ],
        usedBy: 0
    },
    {
        title: "Cloud Computing with AWS",
        description: "Learn to deploy and manage applications on Amazon Web Services",
        category: "Cloud Computing",
        difficulty: "advanced",
        type: "approved",
        isTemplate: true,
        isApproved: true,
        estimatedDuration: "5 months",
        tags: ["AWS", "Cloud", "DevOps", "Infrastructure", "Serverless"],
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
        milestones: [
            {
                title: "AWS Fundamentals",
                description: "Core AWS services and concepts",
                order: 1,
                tasks: [
                    {
                        title: "EC2 & S3 Basics",
                        description: "Virtual servers and object storage",
                        completed: false
                    },
                    {
                        title: "IAM & Security",
                        description: "User management and access control",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Serverless Architecture",
                description: "Lambda functions and API Gateway",
                order: 2,
                tasks: [
                    {
                        title: "AWS Lambda",
                        description: "Build serverless functions",
                        completed: false
                    }
                ],
                completed: false
            }
        ],
        usedBy: 0
    },
    {
        title: "AI & Machine Learning Fundamentals",
        description: "Introduction to artificial intelligence and machine learning concepts",
        category: "AI/ML",
        difficulty: "intermediate",
        type: "approved",
        isTemplate: true,
        isApproved: true,
        estimatedDuration: "6 months",
        tags: ["AI", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch"],
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
        milestones: [
            {
                title: "ML Fundamentals",
                description: "Core concepts and algorithms",
                order: 1,
                tasks: [
                    {
                        title: "Supervised Learning",
                        description: "Regression and classification algorithms",
                        completed: false
                    },
                    {
                        title: "Unsupervised Learning",
                        description: "Clustering and dimensionality reduction",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Deep Learning",
                description: "Neural networks and frameworks",
                order: 2,
                tasks: [
                    {
                        title: "Neural Networks",
                        description: "Architecture and training",
                        completed: false
                    }
                ],
                completed: false
            }
        ],
        usedBy: 0
    },
    {
        title: "DevOps Engineering Path",
        description: "Master CI/CD, containerization, and infrastructure automation",
        category: "DevOps",
        difficulty: "advanced",
        type: "approved",
        isTemplate: true,
        isApproved: true,
        estimatedDuration: "4 months",
        tags: ["Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform"],
        thumbnail: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400",
        milestones: [
            {
                title: "Containerization",
                description: "Docker fundamentals",
                order: 1,
                tasks: [
                    {
                        title: "Docker Basics",
                        description: "Images, containers, and Docker Compose",
                        completed: false
                    }
                ],
                completed: false
            },
            {
                title: "Orchestration",
                description: "Kubernetes deployment",
                order: 2,
                tasks: [
                    {
                        title: "Kubernetes Fundamentals",
                        description: "Pods, services, and deployments",
                        completed: false
                    }
                ],
                completed: false
            }
        ],
        usedBy: 0
    }
];

const seedRoadmaps = async () => {
    try {
        await connectDB();

        // Clear existing approved roadmaps
        await Roadmap.deleteMany({ type: 'approved', isApproved: true });

        // Insert new roadmaps
        const created = await Roadmap.insertMany(approvedRoadmaps);

        console.log('✅ Approved roadmaps seeded successfully!');
        console.log(`📊 Total roadmaps created: ${created.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding roadmaps:', error);
        process.exit(1);
    }
};

seedRoadmaps();
