"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const About = () => {
  return (
    <>
      {/* <!-- ===== About Start ===== --> */}
      <section className="overflow-hidden pb-20 lg:pb-25 xl:pb-30 bg-secondary-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-c-1235 px-4 md:px-8 xl:px-0">
          <div className="flex items-center gap-8 lg:gap-32.5">
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: -20,
                },

                visible: {
                  opacity: 1,
                  x: 0,
                },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="animate_left relative mx-auto hidden aspect-[588/526.5] md:block md:w-1/2"
            >
              <Image
                src="/images/about/how-to-order-girl.png"
                alt="About"
                className="object-cover rounded-lg hover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
            </motion.div>
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: 20,
                },

                visible: {
                  opacity: 1,
                  x: 0,
                },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="animate_right md:w-1/2"
            >
              <span className="font-medium uppercase text-black dark:text-white">
                THE PROCESS
              </span>
              <h2 className="relative mb-6 text-3xl font-bold text-black dark:text-white xl:text-hero">
                How to place an order with us
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-secondary-gray-900 dark:text-white">1. Fill in a brief</h3>
                  <p className="mb-4 text-secondary-gray-600 dark:text-secondary-gray-300">Tell us what you need help with, describe your project requirements, and set the deadline</p>
                  <button 
                    onClick={() => window.location.href = '/createproject'}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-white dark:text-black duration-300 ease-in-out hover:bg-primary/90 dark:text-white dark:hover:bg-primary/90"
                  >
                    Order Now
                  </button>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2 text-secondary-gray-900 dark:text-white">2. Expert Assignment</h3>
                  <p className="mb-4 text-secondary-gray-600 dark:text-secondary-gray-300">We'll assign the best-suited expert for your project based on the subject matter and requirements</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2 text-secondary-gray-900 dark:text-white">3. Get it done on time</h3>
                  <p className="mb-4 text-secondary-gray-600 dark:text-secondary-gray-300">Chat with the expert directly, discuss your project in detail, and get professional academic assistance by the deadline</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2 text-secondary-gray-900 dark:text-white">4. Make it perfect</h3>
                  <p className="mb-4 text-secondary-gray-600 dark:text-secondary-gray-300">Get your finished assignment checked for plagiarism and errors, and request revisions if needed — until it is up to your standards</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* <!-- ===== About End ===== --> */}

      {/* <!-- ===== About Two Start ===== --> */}
      <section>
        <div className="mx-auto max-w-c-1235 overflow-hidden px-4 md:px-8 2xl:px-0">
          <div className="flex items-center gap-8 lg:gap-32.5">
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: -20,
                },

                visible: {
                  opacity: 1,
                  x: 0,
                },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 1, delay: 0.1 }}
              viewport={{ once: true }}
              className="animate_left md:w-1/2"
            >
              <h4 className="font-medium uppercase text-black dark:text-white">
                GET YOUR PROJECT DONE
              </h4>
              <h2 className="relative mb-6 text-3xl font-bold text-black dark:text-white xl:text-hero">
                With expert tutors in all 
                <br />
                <span className="relative inline-block before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg2 dark:before:bg-titlebgdark">
                  Fields
                </span>
              </h2>
              <p>
                Our expert tutors are ready to help with any academic subject 
                from math and science to humanities and business. Get matched with a qualified tutor who specializes in your field and can provide the guidance you need.
              </p>
              <div className="animate_left">
                <div className="group mt-7.5 inline-flex items-center gap-2.5 text-black hover:text-primary dark:text-white dark:hover:text-primary">
                  <Link href="/createproject" className="flex items-center gap-2.5">
                    Start Your Project
                    <svg
                      className="fill-current"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                        fill=""
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: 20,
                },

                visible: {
                  opacity: 1,
                  x: 0,
                },
              }}
              initial="hidden"
              whileInView="visible"
              transition={{ duration: 1, delay: 0.1 }}
              viewport={{ once: true }}
              className="animate_right relative mx-auto hidden aspect-[588/526.5] md:block md:w-1/2"
            >
              <Image
                src="/images/about/tutors.png"
                alt="About"
                className="dark:hidden object-cover rounded-lg hover:scale-105 transition-all duration-300"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
            </motion.div>
          </div>
        </div>
      </section>
      {/* <!-- ===== About Two End ===== --> */}
    </>
  );
};

export default About;
