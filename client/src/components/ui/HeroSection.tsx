import { FC } from "react";
import { Button } from "./Button";
import { motion } from "framer-motion";

const HeroSection: FC = () => {
  return (
    <motion.section
      className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-8 sm:p-12 text-center text-white shadow-lg overflow-hidden mx-auto max-w-4xl"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 drop-shadow-lg">
        Connect, Learn, Grow
      </h1>
      <p className="text-md sm:text-lg mb-6 drop-shadow-md">
        Join our peer-to-peer learning platform and start sharing skills today.
      </p>
      <Button variant="primary" size="lg">
        Get Started
      </Button>
    </motion.section>
  );
};

export default HeroSection;
