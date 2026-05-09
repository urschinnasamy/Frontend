import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const ProfileSettings = () => {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  
  // Team form
  const [teams, setTeams] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    team_name: "",
    team_logo: "",
  });
  
  // Tournament history
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    tournamentsWon: 0,
    totalPlayersBought: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
      });
      fetchUserTeams();
      fetchTournamentHistory();
    }
  }, [user]);

  const fetchUserTeams = async () => {
    try {
      const res = await API.get("/teams/my-teams");
      setTeams(res.data || []);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  const fetchTournamentHistory = async () => {
    try {
      const res = await API.get("/users/tournament-history");
      const history = res.data || [];
      setTournamentHistory(history);
      
      // Calculate stats
      const totalSpent = history.reduce((sum, t) => sum + (t.total_spent || 0), 0);
      setStats({
        totalTournaments: history.length,
        tournamentsWon: history.filter(t => t.won).length,
        totalPlayersBought: history.reduce((sum, t) => sum + (t.players_bought || 0), 0),
        totalSpent: totalSpent,
      });
    } catch (err) {
      console.error("Error fetching tournament history:", err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const res = await API.put("/users/profile", profileForm);
      updateUser(res.data.user);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.msg || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      await API.put("/users/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.msg || "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingTeam) {
        await API.put(`/teams/${editingTeam.id}`, teamForm);
        setMessage({ type: "success", text: "Team updated successfully!" });
      } else {
        await API.post("/teams", teamForm);
        setMessage({ type: "success", text: "Team created successfully!" });
      }
      fetchUserTeams();
      setShowTeamModal(false);
      setEditingTeam(null);
      setTeamForm({ team_name: "", team_logo: "" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.msg || "Failed to save team" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (window.confirm(`Are you sure you want to delete "${teamName}"?`)) {
      try {
        await API.delete(`/teams/${teamId}`);
        fetchUserTeams();
        setMessage({ type: "success", text: "Team deleted successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } catch (err) {
        setMessage({ type: "error", text: err.response?.data?.msg || "Failed to delete team" });
      }
    }
  };

  const formatAmount = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return "₹0";
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your account and preferences</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === "success" 
              ? "bg-green-500/20 border border-green-500/50 text-green-400" 
              : "bg-red-500/20 border border-red-500/50 text-red-400"
          }`}>
            <i className={`fas ${message.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`}></i>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
            <p className="text-gray-400 text-sm">Tournaments</p>
            <p className="text-2xl font-bold text-white">{stats.totalTournaments}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-xl p-4 border border-yellow-500/30">
            <p className="text-gray-400 text-sm">Tournaments Won</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.tournamentsWon}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-4 border border-green-500/30">
            <p className="text-gray-400 text-sm">Players Bought</p>
            <p className="text-2xl font-bold text-green-400">{stats.totalPlayersBought}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className="text-2xl font-bold text-blue-400">{formatAmount(stats.totalSpent)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="fas fa-user"></i>
            Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === "password"
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="fas fa-lock"></i>
            Password
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === "teams"
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="fas fa-users"></i>
            My Teams ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="fas fa-history"></i>
            Tournament History
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white text-4xl"></i>
                  </div>
                  <button className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2">
                    <i className="fas fa-camera text-white text-xs"></i>
                  </button>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{user?.name}</h3>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                  <p className="text-purple-400 text-xs mt-1">
                    <i className="fas fa-calendar-alt mr-1"></i>
                    Member since {new Date(user?.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div>
                <label className="block text-purple-300 text-sm mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-semibold text-lg">Your Teams</h3>
              <button
                onClick={() => {
                  setEditingTeam(null);
                  setTeamForm({ team_name: "", team_logo: "" });
                  setShowTeamModal(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                Create Team
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-5xl text-purple-500 mb-3 opacity-50"></i>
                <p className="text-gray-400">No teams created yet</p>
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="mt-3 text-purple-400 hover:text-purple-300 transition"
                >
                  Create your first team →
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="bg-black/30 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      {team.team_logo ? (
                        <img src={team.team_logo} alt={team.team_name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-users text-white text-xl"></i>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{team.team_name}</h4>
                        <p className="text-gray-400 text-xs">
                          <i className="fas fa-trophy mr-1"></i>
                          {team.tournaments_joined || 0} tournaments joined
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setTeamForm({ team_name: team.team_name, team_logo: team.team_logo || "" });
                            setShowTeamModal(true);
                          }}
                          className="p-2 hover:bg-purple-600/20 rounded-lg transition"
                        >
                          <i className="fas fa-edit text-purple-400"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id, team.team_name)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition"
                        >
                          <i className="fas fa-trash text-red-400"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tournament History Tab */}
        {activeTab === "history" && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Tournament Participation</h3>
            
            {tournamentHistory.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-history text-5xl text-purple-500 mb-3 opacity-50"></i>
                <p className="text-gray-400">No tournament history yet</p>
                <button
                  onClick={() => navigate("/tournaments")}
                  className="mt-3 text-purple-400 hover:text-purple-300 transition"
                >
                  Join a tournament →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tournamentHistory.map((tournament, idx) => (
                  <div key={idx} className="bg-black/30 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-semibold">{tournament.name}</h4>
                        <p className="text-gray-400 text-sm">
                          <i className="fas fa-calendar-alt mr-1"></i>
                          {new Date(tournament.date).toLocaleDateString()}
                        </p>
                      </div>
                      {tournament.won && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-xs">
                          <i className="fas fa-trophy mr-1"></i>Winner
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/10">
                      <div>
                        <p className="text-gray-400 text-xs">Players Bought</p>
                        <p className="text-white font-semibold">{tournament.players_bought || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Total Spent</p>
                        <p className="text-yellow-400 font-semibold">{formatAmount(tournament.total_spent)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Position</p>
                        <p className="text-purple-400 font-semibold">#{tournament.position || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-2xl w-full max-w-md border border-purple-500">
            <div className="flex justify-between items-center p-6 border-b border-purple-800">
              <h2 className="text-2xl font-bold text-purple-300">
                {editingTeam ? "Edit Team" : "Create Team"}
              </h2>
              <button onClick={() => setShowTeamModal(false)} className="text-gray-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamForm.team_name}
                  onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm mb-2">Team Logo URL (Optional)</label>
                <input
                  type="url"
                  value={teamForm.team_logo}
                  onChange={(e) => setTeamForm({ ...teamForm, team_logo: e.target.value })}
                  className="w-full px-4 py-2 bg-black/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 py-2 rounded-lg font-semibold transition"
                >
                  {loading ? "Saving..." : (editingTeam ? "Update" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;