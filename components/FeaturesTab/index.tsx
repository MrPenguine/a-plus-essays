"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import FeaturesTabItem from "./FeaturesTabItem";
import featuresTabData from "./featuresTabData";
import { motion } from "framer-motion";

const FeaturesTab = () => {
  const [currentTab, setCurrentTab] = useState("tabOne");
  const [visibleTabs, setVisibleTabs] = useState<string[]>(["tabOne", "tabTwo", "tabThree"]);

  const goToNext = () => {
    const currentIndex = featuresTabData.findIndex(tab => tab.id === currentTab);
    const nextIndex = (currentIndex + 1) % featuresTabData.length;
    setCurrentTab(featuresTabData[nextIndex].id);

    // Calculate next 3 visible tabs
    const nextTabs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const index = (nextIndex + i) % featuresTabData.length;
      nextTabs.push(featuresTabData[index].id);
    }
    setVisibleTabs(nextTabs);
  };

  const goToPrev = () => {
    const currentIndex = featuresTabData.findIndex(tab => tab.id === currentTab);
    const prevIndex = (currentIndex - 1 + featuresTabData.length) % featuresTabData.length;
    setCurrentTab(featuresTabData[prevIndex].id);

    // Calculate prev 3 visible tabs
    const prevTabs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const index = (prevIndex + i) % featuresTabData.length;
      prevTabs.push(featuresTabData[index].id);
    }
    setVisibleTabs(prevTabs);
  };

  const handleTabClick = (tabId: string) => {
    const newIndex = featuresTabData.findIndex(tab => tab.id === tabId);
    setCurrentTab(tabId);

    // Calculate new visible tabs based on clicked tab
    const newTabs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const index = (newIndex + i) % featuresTabData.length;
      newTabs.push(featuresTabData[index].id);
    }
    setVisibleTabs(newTabs);
  };

  useEffect(() => {
    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [currentTab]);

  return (
    <>
      {/* <!-- ===== Features Tab Start ===== --> */}
      <section className="relative pb-20 pt-18.5 lg:pb-22.5 bg-secondary-gray-50 dark:bg-gray-900">
        <div className="relative mx-auto max-w-c-1390 px-4 md:px-8 2xl:px-0">
          <div className="absolute -top-16 -z-1 mx-auto h-[350px] w-[90%]">
            <Image
              fill
              className="dark:hidden"
              src="/images/shape/shape-dotted-light.svg"
              alt="Dotted Shape"
            />
            <Image
              fill
              className="hidden dark:block"
              src="/images/shape/shape-dotted-dark.svg"
              alt="Dotted Shape"
            />
          </div>

          {/* <!-- Tab Menues Start --> */}
          <motion.div
            variants={{
              hidden: {
                opacity: 0,
                y: -20,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top relative mb-15 flex flex-wrap justify-center rounded-[10px] border border-stroke bg-white shadow-solid-5 dark:border-strokedark dark:bg-gray-800 dark:border-secondary-gray-800 dark:shadow-solid-6 md:flex-nowrap md:items-center lg:gap-7.5 xl:mb-21.5 xl:gap-12.5"
          >
            <button
              onClick={goToPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 transform px-4 py-2 text-2xl text-black dark:text-white"
            >
              ←
            </button>
            
            {featuresTabData.map((tab, index) => (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex w-full cursor-pointer items-center gap-4 border-b border-stroke px-6 py-2 last:border-0 dark:border-strokedark md:w-auto md:border-0 xl:px-13.5 xl:py-5 ${
                  !visibleTabs.includes(tab.id) ? "hidden" : ""
                } ${
                  currentTab === tab.id
                    ? "active before:absolute before:bottom-0 before:left-0 before:h-1 before:w-full before:rounded-tl-[4px] before:rounded-tr-[4px] before:bg-primary"
                    : ""
                }`}
              >
                <div className="flex h-12.5 w-12.5 items-center justify-center rounded-[50%] border border-stroke dark:border-strokedark dark:bg-blacksection">
                  <p className="text-metatitle3 font-medium text-black dark:text-white">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                </div>
                <div className="md:w-3/5 lg:w-auto">
                  <button className="text-sm font-medium text-black dark:text-white xl:text-regular">
                    {tab.title}
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 transform px-4 py-2 text-2xl text-black dark:text-white"
            >
              →
            </button>
          </motion.div>
          {/* <!-- Tab Menues End --> */}

          {/* <!-- Tab Content Start --> */}
          <motion.div
            variants={{
              hidden: {
                opacity: 0,
                y: -20,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
            className="animate_top mx-auto max-w-c-1154"
          >
            {featuresTabData.map((feature, key) => (
              <div
                className={feature.id === currentTab ? "block" : "hidden"}
                key={key}
              >
                <FeaturesTabItem featureTab={feature} />
              </div>
            ))}
          </motion.div>
          {/* <!-- Tab Content End --> */}
        </div>
      </section>
      {/* <!-- ===== Features Tab End ===== --> */}
    </>
  );
};

export default FeaturesTab;
