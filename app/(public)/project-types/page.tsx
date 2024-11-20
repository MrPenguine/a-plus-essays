"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ContactSection from "@/components/Contact";
const ProjectTypesPage = () => {
  return (
    <div className="pt-[80px]">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/best-tutor.jpg"
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
                Buy Projects From Our Exceptional Writers
              </h1>
              <p className="text-white/90 text-lg mb-8">
                Tell us about the project and your requirements
              </p>
              <Link href="/dashboard">
                <button className="bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-white/90 transition-colors">
                  Write My Project
                </button>
              </Link>
            </div>
            <div className="relative h-[400px] md:h-[500px]">
              <Image
                src="/images/best-tutor.jpg"
                alt="Essay Writing"
                fill
                className="object-contain rounded-lg hover:scale-105 transition-all duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
              
            </div>
          </div>
        </div>
      </section>

      {/* Project Types Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary dark:text-primary">
            Project Types We Cover
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Essay",
                description: "Our essay writing service provides custom-written essays on any topic, tailored to your specific requirements. Whether you need a persuasive, analytical, or narrative essay, our experienced writers will deliver high-quality, well-researched content that meets academic standards."
              },
              {
                title: "Coursework",
                description: "We offer comprehensive coursework assistance, covering a wide range of subjects and assignment types. Our experts can help you with essays, projects, research assignments, and more, ensuring your coursework is thorough, accurate, and submitted on time."
              },
              {
                title: "Homework",
                description: "Our homework help service supports students in completing their assignments efficiently and accurately. Whether you need help with math problems, science questions, or writing tasks, our tutors are here to provide guidance and solutions."
              },
              {
                title: "Speech",
                description: "Need to deliver a speech? Our speech writing service crafts compelling and effective speeches tailored to your audience and purpose. From informative to persuasive speeches, we ensure your message is clear, engaging, and well-structured."
              },
              {
                title: "Term paper",
                description: "Our term paper writing service offers expert assistance in creating comprehensive and well-researched term papers. We cover all stages, from topic selection to final editing, ensuring your term paper is insightful, properly formatted, and academically sound."
              },
              {
                title: "Presentation",
                description: "Our presentation design service helps you create visually appealing and informative presentations. Whether for academic, business, or personal use, we ensure your slides are professional, engaging, and effectively communicate your key points."
              },
              {
                title: "Dissertation",
                description: "Our dissertation writing service provides extensive support for PhD candidates. From proposal to final submission, we offer assistance with research, writing, editing, and formatting, ensuring your dissertation meets the highest academic standards."
              },
              {
                title: "Case Study",
                description: "We offer professional case study writing services that involve in-depth research and analysis. Our writers will help you examine real-life situations, providing detailed insights and solutions that are well-structured and supported by evidence."
              },
              {
                title: "Research paper",
                description: "Our research paper service provides expert help in producing detailed and well-researched papers. We assist with all aspects, including literature review, methodology, data analysis, and conclusions, ensuring your paper is thorough and scholarly."
              },
              {
                title: "Report",
                description: "Our report writing service covers a wide range of topics and formats. We create clear, concise, and well-organized reports that present information and analysis effectively, catering to academic, business, and scientific needs."
              },
              {
                title: "Book/Movie Review",
                description: "Our review writing service offers insightful and critical evaluations of books and movies. We provide comprehensive reviews that summarize the content, analyze key themes, and offer recommendations, helping you engage with literature and film critically."
              },
              {
                title: "Resume/Cover letter",
                description: "Our resume and cover letter writing service helps you create professional and impactful job application documents. We tailor your resume and cover letter to highlight your strengths and experiences, increasing your chances of securing interviews and job offers."
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-xl transition-all duration-300 transform-gpu cursor-pointer group"
              >
                <h3 className="text-lg font-semibold mb-3 text-primary dark:text-primary transition-all duration-300 group-hover:scale-110 group-hover:translate-x-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 transition-all duration-300 group-hover:scale-105">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            What You Get For Free
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "Bibliography",
              "Title Page",
              "Outline",
              "Plagiarism report",
              "Reference page",
              "Citations",
              "ZeroGPT report",
              "Degree writer"
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-primary/10 dark:bg-primary/5 rounded-full py-3 px-6 flex items-center justify-between"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {feature}
                </span>
                <span className="bg-white dark:bg-gray-800 text-xs font-bold px-2 py-1 rounded-full">
                  Free
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-medium uppercase tracking-wider">
              PROCESS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 dark:text-white">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Arrow decorations */}
            <div className="hidden md:block absolute top-1/2 left-1/3 -translate-y-1/2 w-1/6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <svg className="w-full text-primary" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z"
                  />
                </svg>
              </motion.div>
            </div>
            <div className="hidden md:block absolute top-1/2 right-1/3 -translate-y-1/2 w-1/6">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <svg className="w-full text-primary" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42.39.39 1.02.39 1.41 0l6.59-6.59c.39-.39.39-1.02 0-1.41l-6.58-6.6c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1z"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Process Steps */}
            {[
              {
                icon: "📝",
                step: "Step 1",
                title: "Tell us about your project",
                description: "Tell us about the project and your requirements"
              },
              {
                icon: "👥",
                step: "Step 2",
                title: "Compare offers",
                description: "Compare offers from top experts, and pick the best one"
              },
              {
                icon: "✅",
                step: "Step 3",
                title: "Get it done",
                description: "Chat with an expert and get your project on time"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
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
                  <span className="text-primary font-semibold block mb-2">
                    {item.step}
                  </span>
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

      {/* Buy Now Pay Later Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/5 rounded-full py-2 px-4 mb-6">
            <span className="text-2xl">💰</span>
            <span className="text-primary font-semibold">Buy now, pay later!</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-secondary-gray-900 dark:text-white">
            Pay in 2 Installments
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Split your payment into 2 easy installments. Get started with your project today!
          </p>
        </div>
        <ContactSection />
      </section>
    </div>
  );
};

export default ProjectTypesPage;
