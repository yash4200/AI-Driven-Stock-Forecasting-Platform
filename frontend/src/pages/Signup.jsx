import { useState } from "react";

function Signup({ onSignup, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    onSignup();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Stock<span className="text-blue-500">AI</span>
          </h1>

          <p className="text-gray-400 mt-2">
            Start your AI-powered market journey
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

          <h2 className="text-2xl font-semibold">
            Create Account
          </h2>

          <p className="text-gray-400 text-sm mt-2">
            Create your StockAI account
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            <div>
              <label className="text-sm text-gray-300">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
            >
              Create Account
            </button>

          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{" "}
            <button
              onClick={onLogin}
              className="text-blue-500 hover:text-blue-400"
            >
              Login
            </button>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Signup;
