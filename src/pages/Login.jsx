import { useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }
    
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      login(res.data);

      // CHECK ADMIN
      if (res.data.user.isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        

        {/* Login Form Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                <i className="fas fa-envelope mr-2"></i>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-purple-400"></i>
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                <i className="fas fa-lock mr-2"></i>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-purple-400"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 bg-purple-900/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-purple-900/20 border-purple-500/30 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-purple-400 hover:text-purple-300 transition">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>

            
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{" "}
            <a href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition">
              Create account
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">
             © {new Date().getFullYear()} Purple Admin. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;