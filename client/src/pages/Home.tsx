import HeroSection from "../components/ui/HeroSection";
import Card from "../components/ui/Card";

const sampleTrainers = [
  { name: "Alice Johnson", skills: ["React", "Node.js"], rating: 5 },
  { name: "Bob Smith", skills: ["Python", "ML"], rating: 4 },
  { name: "Carol Lee", skills: ["UI/UX", "Figma"], rating: 5 },
];

const Home = () => {
  return (
    <div className="space-y-12">
      <HeroSection />

      <section>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
          Top Trainers
        </h2>
        <div className="grid gap-6 md:grid-cols-3 mx-auto max-w-7xl">
          {sampleTrainers.map((t) => (
            <Card key={t.name} {...t} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
