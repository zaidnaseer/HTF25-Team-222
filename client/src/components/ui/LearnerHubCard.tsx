import { FC } from "react";
import { Button } from "./Button";
import { motion } from "framer-motion";

interface LearnerHubCardProps {
  name: string;
  skills: string[];
  privacy: "Open" | "Request" | "Closed";
  members: number;
}

const LearnerHubCard: FC<LearnerHubCardProps> = ({
  name,
  skills,
  privacy,
  members,
}) => {
  const privacyColor =
    privacy === "Open"
      ? "bg-green-500"
      : privacy === "Request"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <motion.div
      className="rounded-xl shadow-lg p-6 cursor-pointer bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white hover:shadow-xl"
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-gray-200 mb-2">Skills: {skills.join(", ")}</p>
      <p className="mb-4">
        Members: {members} |{" "}
        <span className={`px-2 py-1 rounded ${privacyColor}`}>{privacy}</span>
      </p>
      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={privacy === "Closed"}
      >
        {privacy === "Open"
          ? "Join"
          : privacy === "Request"
          ? "Request Join"
          : "Closed"}
      </Button>
    </motion.div>
  );
};

export default LearnerHubCard;
