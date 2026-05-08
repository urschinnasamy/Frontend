import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Close mobile menu when route changes
  useState(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsProfileDropdownOpen(false);
  };

  const navLinks = [
    { path: "/", label: "Home", icon: "fas fa-home" },
    
    { path: "/tournaments", label: "Tournaments", icon: "fas fa-trophy" },
    { path: "/leaderboard", label: "Leaderboard", icon: "fas fa-chart-line" },
    { path: "/players", label: "Players", icon: "fas fa-users" },
  ];

  return (
    <>
      <nav className="w-full bg-gradient-to-r from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] text-white px-4 md:px-6 py-3 flex justify-between items-center border-b border-purple-500/30 shadow-lg sticky top-0 z-50">
        
        {/* LEFT SIDE - BRAND */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
              <i className="fas fa-crown text-white text-xl"></i>
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Sports Auction
              </div>
              
            </div>
          </button>
        </div>

        {/* DESKTOP NAVIGATION - CENTER */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2 bg-white/5 backdrop-blur-lg rounded-full px-2 py-1 border border-purple-500/20">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`px-3 lg:px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 text-sm lg:text-base ${
                location.pathname === link.path
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                  : "hover:bg-purple-600/20 hover:text-purple-300"
              }`}
            >
              <i className={link.icon}></i>
              <span>{link.label}</span>
            </button>
          ))}

          {/* ADMIN DASHBOARD (ONLY SUPER ADMIN) */}
          {user?.isAdmin && (
            <button
              onClick={() => navigate("/admin/dashboard")}
              className={`px-3 lg:px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2 text-sm lg:text-base ${
                location.pathname.includes("/admin")
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                  : "hover:bg-purple-600/20 hover:text-purple-300 border border-yellow-500/50"
              }`}
            >
              <i className="fas fa-shield-alt"></i>
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* RIGHT SIDE - USER INFO & ACTIONS */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell */}
          <button className="relative hidden md:block p-2 rounded-full hover:bg-purple-600/20 transition-colors">
            <i className="fas fa-bell text-purple-300"></i>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {user ? (
            <>
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-full pl-2 pr-3 py-1 border border-purple-500/30 hover:bg-purple-600/20 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <span className="hidden md:inline text-purple-200 text-sm font-medium">
                    {user.name?.split(" ")[0] || "User"}
                  </span>
                  <i className="fas fa-chevron-down text-purple-400 text-xs hidden md:block"></i>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-[#1a0a2e] backdrop-blur-lg rounded-xl border border-purple-500/30 shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-purple-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-white text-xl"></i>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{user.name}</p>
                            <p className="text-purple-300 text-xs">{user.email}</p>
                            {user.isAdmin && (
                              <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                                <i className="fas fa-crown mr-1 text-xs"></i>Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-purple-200 hover:bg-purple-600/20 transition flex items-center gap-3"
                        >
                          <i className="fas fa-user-circle w-5"></i>
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate("/my-teams");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-purple-200 hover:bg-purple-600/20 transition flex items-center gap-3"
                        >
                          <i className="fas fa-users w-5"></i>
                          <span>My Teams</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate("/my-auctions");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-purple-200 hover:bg-purple-600/20 transition flex items-center gap-3"
                        >
                          <i className="fas fa-gavel w-5"></i>
                          <span>My Auctions</span>
                        </button>
                        <div className="border-t border-purple-500/20 my-1"></div>
                        <button
                          onClick={() => {
                            navigate("/settings");
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-purple-200 hover:bg-purple-600/20 transition flex items-center gap-3"
                        >
                          <i className="fas fa-cog w-5"></i>
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition flex items-center gap-3"
                        >
                          <i className="fas fa-sign-out-alt w-5"></i>
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-5 py-2 rounded-full text-white font-medium transition-all duration-200 shadow-lg"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="border border-purple-500 hover:bg-purple-600/20 px-4 py-2 rounded-full text-purple-300 transition-all duration-200"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-purple-600/20 transition-colors"
          >
            <i className={`fas ${isMobileMenuOpen ? "fa-times" : "fa-bars"} text-xl text-purple-300`}></i>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed top-[61px] left-0 right-0 bg-[#1a0a2e] backdrop-blur-lg border-b border-purple-500/30 z-50 md:hidden animate-slideDown">
            <div className="flex flex-col p-4">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    location.pathname === link.path
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                      : "text-purple-200 hover:bg-purple-600/20"
                  }`}
                >
                  <i className={link.icon + " w-5"}></i>
                  <span>{link.label}</span>
                </button>
              ))}

              {user?.isAdmin && (
                <button
                  onClick={() => {
                    navigate("/admin/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 text-yellow-400 border-t border-purple-500/20 mt-2 pt-3"
                >
                  <i className="fas fa-shield-alt w-5"></i>
                  <span>Admin Dashboard</span>
                </button>
              )}

              {!user && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-purple-500/20">
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2 rounded-xl text-white"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/register");
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 border border-purple-500 py-2 rounded-xl text-purple-300"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;