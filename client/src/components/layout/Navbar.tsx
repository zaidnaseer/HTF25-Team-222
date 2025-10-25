import { FC } from "react";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

const Navbar: FC = () => {
  return (
    <nav className="flex justify-between items-center py-4 px-6 bg-gray-900 text-white">
      <Link to="/" className="text-2xl font-bold">
        P-LEX
      </Link>

      <div className="space-x-4">
        <Link to="/">
          <Button variant="ghost" size="md">Home</Button>
        </Link>
        <Link to="/learner-hub">
          <Button variant="ghost" size="md">Learner Hub</Button>
        </Link>
        <Button variant="primary" size="md">Login</Button>
      </div>
    </nav>
  );
};

export default Navbar;
