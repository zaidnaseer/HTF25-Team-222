import LearnerHubCard from "../components/ui/LearnerHubCard";

const sampleHubs: {
  name: string;
  skills: string[];
  privacy: "Open" | "Request" | "Closed";
  members: number;
}[] = [
  {
    name: "Frontend Learners",
    skills: ["React", "CSS", "Tailwind"],
    privacy: "Open",
    members: 12,
  },
  {
    name: "ML Enthusiasts",
    skills: ["Python", "Machine Learning", "Pandas"],
    privacy: "Request",
    members: 8,
  },
  {
    name: "UX/UI Designers",
    skills: ["Figma", "Adobe XD"],
    privacy: "Closed",
    members: 5,
  },
];

const LearnerHub = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
        Learner Hub
      </h1>
      <div className="grid gap-6 md:grid-cols-3 mx-auto max-w-7xl">
        {sampleHubs.map((hub) => (
          <LearnerHubCard key={hub.name} {...hub} />
        ))}
      </div>
    </div>
  );
};

export default LearnerHub;
