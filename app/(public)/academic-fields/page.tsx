"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ContactSection from "@/components/Contact";
import { useState } from "react";

const academicFields = [
  {
    id: 1,
    title: "Business & Management",
    content: [
      "Business Administration",
      "Marketing & Advertising",
      "Finance & Accounting",
      "Operations Management",
      "Strategic Management",
      "International Business",
      "Human Resource Management",
      "Supply Chain Management",
      "Entrepreneurship",
      "Business Ethics"
    ]
  },
  {
    id: 2,
    title: "Computer Science & IT",
    content: [
      "Programming & Software Development",
      "Database Management",
      "Network Security",
      "Artificial Intelligence",
      "Machine Learning",
      "Web Development",
      "Cloud Computing",
      "Data Structures & Algorithms",
      "Operating Systems",
      "Cybersecurity"
    ]
  },
  {
    id: 3,
    title: "Engineering",
    content: [
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Software Engineering",
      "Aerospace Engineering",
      "Biomedical Engineering",
      "Environmental Engineering",
      "Industrial Engineering",
      "Materials Science"
    ]
  },
  {
    id: 4,
    title: "Natural Sciences",
    content: [
      "Physics",
      "Chemistry",
      "Biology",
      "Environmental Science",
      "Astronomy",
      "Geology",
      "Marine Biology",
      "Biotechnology",
      "Genetics",
      "Ecology"
    ]
  },
  {
    id: 5,
    title: "Mathematics & Statistics",
    content: [
      "Calculus",
      "Linear Algebra",
      "Statistics",
      "Probability Theory",
      "Discrete Mathematics",
      "Number Theory",
      "Mathematical Analysis",
      "Applied Mathematics",
      "Data Analysis",
      "Quantitative Methods"
    ]
  },
  {
    id: 6,
    title: "Social Sciences",
    content: [
      "Psychology",
      "Sociology",
      "Political Science",
      "Economics",
      "Anthropology",
      "International Relations",
      "Public Policy",
      "Urban Planning",
      "Social Work",
      "Development Studies"
    ]
  },
  {
    id: 7,
    title: "Humanities & Arts",
    content: [
      "Literature",
      "History",
      "Philosophy",
      "Religious Studies",
      "Art History",
      "Cultural Studies",
      "Linguistics",
      "Media Studies",
      "Film Studies",
      "Creative Writing"
    ]
  },
  {
    id: 8,
    title: "Medicine & Healthcare",
    content: [
      "Medicine",
      "Nursing",
      "Public Health",
      "Pharmacology",
      "Healthcare Management",
      "Anatomy & Physiology",
      "Medical Ethics",
      "Clinical Research",
      "Health Informatics",
      "Nutrition"
    ]
  },
  {
    id: 9,
    title: "Law & Legal Studies",
    content: [
      "Constitutional Law",
      "Criminal Law",
      "Civil Law",
      "Business Law",
      "International Law",
      "Human Rights Law",
      "Environmental Law",
      "Intellectual Property Law",
      "Family Law",
      "Legal Ethics"
    ]
  },
  {
    id: 10,
    title: "Education & Teaching",
    content: [
      "Educational Psychology",
      "Curriculum Development",
      "Special Education",
      "Early Childhood Education",
      "Educational Technology",
      "Teaching Methods",
      "Educational Leadership",
      "Adult Education",
      "STEM Education",
      "Language Teaching"
    ]
  },
  {
    id: 11,
    title: "Communication Studies",
    content: [
      "Mass Communication",
      "Public Relations",
      "Journalism",
      "Digital Media",
      "Broadcasting",
      "Interpersonal Communication",
      "Corporate Communication",
      "Media Studies",
      "Speech Communication",
      "Technical Writing"
    ]
  },
  {
    id: 12,
    title: "Environmental Studies",
    content: [
      "Environmental Science",
      "Conservation Biology",
      "Climate Change Studies",
      "Sustainable Development",
      "Natural Resource Management",
      "Environmental Policy",
      "Ecosystem Management",
      "Environmental Impact Assessment",
      "Wildlife Conservation",
      "Green Technology"
    ]
  },
  {
    id: 13,
    title: "Agriculture & Food Sciences",
    content: [
      "Agricultural Science",
      "Food Technology",
      "Animal Science",
      "Crop Science",
      "Soil Science",
      "Food Safety",
      "Agricultural Economics",
      "Plant Pathology",
      "Horticulture",
      "Agribusiness"
    ]
  },
  {
    id: 14,
    title: "Architecture & Design",
    content: [
      "Architectural Design",
      "Urban Planning",
      "Interior Design",
      "Landscape Architecture",
      "Sustainable Architecture",
      "Construction Management",
      "Building Technology",
      "Architectural History",
      "Digital Design",
      "Environmental Design"
    ]
  },
  {
    id: 15,
    title: "Sports & Exercise Science",
    content: [
      "Sports Management",
      "Exercise Physiology",
      "Sports Psychology",
      "Athletic Training",
      "Physical Education",
      "Sports Medicine",
      "Biomechanics",
      "Sports Nutrition",
      "Coaching",
      "Rehabilitation Science"
    ]
  },
  {
    id: 16,
    title: "Music & Performing Arts",
    content: [
      "Music Theory",
      "Music History",
      "Performance Studies",
      "Music Composition",
      "Theater Arts",
      "Dance Studies",
      "Music Education",
      "Sound Design",
      "Opera Studies",
      "Musical Theater"
    ]
  },
  {
    id: 17,
    title: "Tourism & Hospitality",
    content: [
      "Hotel Management",
      "Tourism Studies",
      "Event Management",
      "Restaurant Management",
      "Travel Industry Management",
      "Hospitality Marketing",
      "Tourism Planning",
      "Food Service Management",
      "Resort Management",
      "Sustainable Tourism"
    ]
  },
  {
    id: 18,
    title: "International Studies",
    content: [
      "Global Politics",
      "International Relations",
      "Cross-Cultural Communication",
      "Global Economics",
      "International Law",
      "Diplomatic Studies",
      "Area Studies",
      "International Development",
      "Peace Studies",
      "Global Security"
    ]
  },
  {
    id: 19,
    title: "Gender & Women's Studies",
    content: [
      "Feminist Theory",
      "Gender Studies",
      "Women's History",
      "LGBTQ+ Studies",
      "Gender and Politics",
      "Gender and Literature",
      "Sexuality Studies",
      "Intersectionality",
      "Women's Rights",
      "Gender and Media"
    ]
  },
  {
    id: 20,
    title: "Film & Media Studies",
    content: [
      "Film Theory",
      "Film Production",
      "Digital Media",
      "Screenwriting",
      "Documentary Studies",
      "Film History",
      "Media Analysis",
      "Animation",
      "Visual Effects",
      "Film Criticism"
    ]
  }
];

const AcademicFieldsPage = () => {
  const [activeField, setActiveField] = useState<number | null>(null);

  const toggleField = (id: number) => {
    setActiveField(activeField === id ? null : id);
  };

  return (
    <div className="pt-[80px]">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/graduating.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Light mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80 dark:hidden"></div>
          {/* Dark mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-900/90 hidden dark:block"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Expert Help Across All Academic Fields
              </h1>
              <p className="text-white/90 text-lg mb-8">
                Get professional assistance in any academic discipline from our qualified experts
              </p>
              <Link href="/dashboard">
                <button className="bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>
            <div className="relative h-[400px] md:h-[500px]">
              <Image
                src="/images/graduating.png"
                alt="Academic Fields"
                fill
                className="object-contain rounded-lg hover:scale-105 transition-all duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Academic Fields Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary dark:text-primary">
            Academic Fields We Cover
          </h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicFields.map((field) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: field.id * 0.05 }}
                className="mb-4"
              >
                <button
                  onClick={() => toggleField(field.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {field.title}
                  </h3>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${
                      activeField === field.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {activeField === field.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {field.content.map((item, index) => (
                        <li
                          key={index}
                          className="text-gray-600 dark:text-gray-300 flex items-center"
                        >
                          <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-medium uppercase tracking-wider">
              WHY CHOOSE US
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 dark:text-white">
              Expert Help in Every Field
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "👨‍🎓",
                title: "Field Experts",
                description: "Our writers hold advanced degrees in their respective fields and have years of academic writing experience"
              },
              {
                icon: "🔒",
                title: "100% Privacy",
                description: "Your personal information is encrypted and never shared with third parties"
              },
              {
                icon: "🎭",
                title: "Complete Anonymity",
                description: "Your identity remains completely confidential throughout the entire process"
              },
              {
                icon: "🕒",
                title: "24/7 Support",
                description: "Our support team is available around the clock to assist you with any questions"
              },
              {
                icon: "✨",
                title: "Quality Assured",
                description: "Rigorous quality checks and peer review process for every assignment"
              },
              {
                icon: "⚡",
                title: "On-Time Delivery",
                description: "We strictly adhere to deadlines and often deliver ahead of schedule"
              },
              {
                icon: "📝",
                title: "Free Revisions",
                description: "Unlimited free revisions until you're completely satisfied with the work"
              },
              {
                icon: "💰",
                title: "Money-Back Guarantee",
                description: "Your satisfaction is guaranteed or you get your money back"
              },
              {
                icon: "🔍",
                title: "Plagiarism/AI-Free",
                description: "Every paper is written from scratch and checked through multiple plagiarism detection tools"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  {/* Circle Background */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full" />
                  
                  {/* Icon Circle */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />
    </div>
  );
};

export default AcademicFieldsPage;
