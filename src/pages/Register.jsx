import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      await API.post("/auth/register", form);
      alert("Registered successfully! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#2a0a3e] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-2xl shadow-lg mb-4">
            <i className="fas fa-user-plus text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Create Account
          </h1>
         
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20">
          <div className="space-y-4">
            <input
              type="text"
              className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyPress={handleKeyPress}
            />

            <input
              type="email"
              className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onKeyPress={handleKeyPress}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Registering...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Register
                </>
              )}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-purple-400 hover:text-purple-300">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;