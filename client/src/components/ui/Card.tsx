import { FC } from "react";
import { Button } from "./Button";
import { motion } from "framer-motion";

interface CardProps {
  name: string;
  skills: string[];
  rating: number;
}

const Card: FC<CardProps> = ({ name, skills, rating }) => {
  return (
    <motion.div
      className="bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl"
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-gray-300 mb-4">Skills: {skills.join(", ")}</p>
      <p className="text-yellow-400 mb-4">Rating: {"⭐".repeat(rating)}</p>
      <Button variant="primary" size="md" className="w-full">
        View Profile
      </Button>
    </motion.div>
  );
};

export default Card;
