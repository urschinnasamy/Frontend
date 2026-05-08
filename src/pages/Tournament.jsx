import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const Tournaments = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [tournaments, setTournaments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // MODALS
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    sport: "",
    max_teams: "",
    purse_amount: "",
    auction_date: "",
    description: "",
  });

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const [joinForm, setJoinForm] = useState({
    team_name: "",
    team_logo: "",
  });

  // FETCH
const fetchTournaments = async () => {
  try {
    setLoading(true);
    const res = await API.get("/tournaments");

    console.log("TOURNAMENTS API:", res.data); // 👈 IMPORTANT

    setTournaments(res.data || []);
  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchTournaments();
  }, []);

  // SEARCH
  const filtered = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // JOIN CHECK (IMPORTANT)
  const isUserJoined = (tournament) => {
    if (!tournament?.teams) return false;

    return tournament.teams.some(
      (team) => team.user_id === user?.id
    );
  };

  // DELETE
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" ?`)) return;

    try {
      await API.delete(`/tournaments/${id}`);
      fetchTournaments();
    } catch (err) {
      console.log(err);
    }
  };

  // START AUCTION (OWNER)
  const startAuction = async (id) => {
  try {
    // 1. start auction via correct backend route
    await API.put(`/auction/start/${id}`);

    alert("Auction Started 🚀");

    // 2. refresh list so status becomes "live"
    await fetchTournaments();

    // 3. go to auction page
    navigate(`/auction/${id}`);
  } catch (err) {
    console.log(err);
  }
};
  // JOIN
  const handleJoinTournament = async () => {
    try {
      await API.post("/teams", {
        tournament_id: selectedTournament.id,
        user_id: user.id,
        team_name: joinForm.team_name,
        team_logo: joinForm.team_logo,
      });

      alert("Joined successfully");
      setIsJoinOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white p-6">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            🏆 Tournaments
          </h1>
          <p className="text-gray-400 mt-2">Create, join and participate in live auctions</p>
        </div>

        <button
          onClick={() => navigate("/tournament/create")}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Create Tournament
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative z-10 mb-8">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            className="w-full md:w-96 pl-12 pr-4 py-3 bg-white/5 backdrop-blur-lg border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="relative z-10 flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-trophy text-purple-400 text-xl animate-pulse"></i>
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="relative z-10 text-center py-20">
          <i className="fas fa-trophy text-6xl text-purple-500 mb-4 opacity-50"></i>
          <p className="text-gray-400 text-lg">No tournaments found</p>
          <button
            onClick={() => navigate("/tournament/create")}
            className="mt-4 text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2"
          >
            Create your first tournament <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      ) : (
        /* TOURNAMENT CARDS GRID */
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white/5 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-5 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 group"
            >
              {/* STATUS BADGE */}
              <div className="flex justify-end mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  t.status === "live" 
                    ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                }`}>
                  <i className={`fas ${t.status === "live" ? "fa-circle" : "fa-clock"} mr-1 text-xs`}></i>
                  {t.status === "live" ? "LIVE" : "Upcoming"}
                </span>
              </div>

              {/* TOURNAMENT INFO */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-trophy text-2xl text-white"></i>
                </div>
                <h2 className="text-xl font-bold text-purple-300 mb-2">
                  {t.name}
                </h2>
                <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                  <i className="fas fa-calendar-alt"></i>
                  {new Date(t.auction_date).toLocaleDateString()}
                </p>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-black/30 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Sport</p>
                  <p className="text-sm font-semibold text-purple-300">
                    <i className="fas fa-futbol mr-1"></i>
                    {t.sport}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Max Teams</p>
                  <p className="text-sm font-semibold text-purple-300">
                    <i className="fas fa-users mr-1"></i>
                    {t.max_teams}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Prize Pool</p>
                  <p className="text-sm font-semibold text-yellow-400">
                    <i className="fas fa-rupee-sign mr-1"></i>
                    {Number(t.purse_amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Status</p>
                  <p className={`text-sm font-semibold ${t.status === "live" ? "text-green-400" : "text-yellow-400"}`}>
                    <i className={`fas ${t.status === "live" ? "fa-play" : "fa-hourglass-half"} mr-1`}></i>
                    {t.status === "live" ? "Active" : "Ready"}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-2">
                {/* VIEW BUTTON */}
                <button
                  onClick={() => navigate(`/tournaments/${t.id}`)}
                  className="w-full bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600 hover:border-purple-600 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-eye"></i>
                  View Details
                </button>

                {/* JOIN BUTTON */}
                <button
                  onClick={() => {
                    setSelectedTournament(t);
                    setIsJoinOpen(true);
                  }}
                  className="w-full bg-fuchsia-600/20 border border-fuchsia-500/50 hover:bg-fuchsia-600 hover:border-fuchsia-600 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Join Tournament
                </button>

                {/* START AUCTION (OWNER ONLY) */}
                {user?.id === t.created_by && t.status !== "live" && (
                  <button
                    onClick={() => startAuction(t.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-black font-semibold"
                  >
                    <i className="fas fa-play"></i>
                    Start Auction
                  </button>
                )}

                {/* ENTER AUCTION (ONLY LIVE + JOINED OR OWNER) */}
                {t.status === "live" &&
                  (user?.id === t.created_by || isUserJoined(t)) && (
                    <button
                      onClick={() => navigate(`/auction/${t.id}`)}
                      className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg"
                    >
                      <i className="fas fa-gavel"></i>
                      Enter Auction
                    </button>
                  )}

                {/* DELETE BUTTON (OWNER ONLY) */}
                {user?.id === t.created_by && (
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="w-full bg-red-600/20 border border-red-500/50 hover:bg-red-600 hover:border-red-600 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-trash-alt"></i>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOIN MODAL */}
      {isJoinOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-2xl w-full max-w-md border border-purple-500 shadow-2xl transform transition-all duration-300 animate-fadeIn">
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-6 border-b border-purple-800">
              <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
                <i className="fas fa-handshake"></i>
                Join Tournament
              </h2>
              <button
                onClick={() => setIsJoinOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6">
              <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-700">
                <p className="text-sm text-gray-400">Tournament</p>
                <p className="text-white font-semibold">{selectedTournament?.name}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-purple-300 mb-2">
                    <i className="fas fa-users mr-2"></i>
                    Team Name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-black/50 border border-purple-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter your team name"
                    value={joinForm.team_name}
                    onChange={(e) =>
                      setJoinForm({ ...joinForm, team_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm text-purple-300 mb-2">
                    <i className="fas fa-image mr-2"></i>
                    Team Logo URL (Optional)
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-black/50 border border-purple-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="https://example.com/logo.png"
                    value={joinForm.team_logo}
                    onChange={(e) =>
                      setJoinForm({ ...joinForm, team_logo: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex gap-3 p-6 border-t border-purple-800">
              <button
                onClick={handleJoinTournament}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fas fa-check"></i>
                Join Tournament
              </button>
              <button
                onClick={() => setIsJoinOpen(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Tournaments;