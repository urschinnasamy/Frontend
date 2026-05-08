import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);

  // FETCH TOURNAMENT
  const fetchTournament = async () => {
    try {
      const res = await API.get(`/tournaments/${id}`);
      setTournament(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // FETCH TEAMS
  const fetchTeams = async () => {
    try {
      const res = await API.get(`/teams?tournament_id=${id}`);
      
      // FIX: Handle different response structures
      let teamsData = [];
      if (res.data) {
        if (Array.isArray(res.data)) {
          teamsData = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          teamsData = res.data.data;
        } else if (res.data.teams && Array.isArray(res.data.teams)) {
          teamsData = res.data.teams;
        } else {
          teamsData = [];
        }
      }
      
      setTeams(teamsData);
      setActiveTab("teams");
    } catch (err) {
      console.log(err);
      setTeams([]); // Set empty array on error
    }
  };

  // FETCH PLAYERS
  const fetchPlayers = async () => {
    try {
      const res = await API.get("/players");
      
      // FIX: Handle different response structures
      let playersData = [];
      if (res.data) {
        if (Array.isArray(res.data)) {
          playersData = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          playersData = res.data.data;
        } else if (res.data.players && Array.isArray(res.data.players)) {
          playersData = res.data.players;
        } else {
          playersData = [];
        }
      }
      
      setPlayers(playersData);
      setActiveTab("players");
    } catch (err) {
      console.log(err);
      setPlayers([]); // Set empty array on error
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTournament();
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-trophy text-purple-400 text-xl animate-pulse"></i>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-5xl text-yellow-400 mb-4"></i>
          <p className="text-gray-400 text-lg">Tournament not found</p>
          <button
            onClick={() => navigate("/tournaments")}
            className="mt-4 text-purple-400 hover:text-purple-300 transition"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white p-6">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-white/5 backdrop-blur-lg border border-purple-500/20 rounded-3xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            
            {/* Tournament Logo */}
            {tournament.tournament_logo ? (
              <img
                src={tournament.tournament_logo}
                alt={tournament.name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-purple-500 shadow-lg"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/112x112?text=Logo";
                }}
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                <i className="fas fa-trophy text-5xl text-white"></i>
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                {tournament.name}
              </h1>
              <p className="text-gray-400 mt-2">
                {tournament.description || "No description available"}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="bg-purple-600/20 border border-purple-500/30 px-4 py-2 rounded-full text-sm">
                  🏏 {tournament.sport}
                </span>
                <span className="bg-fuchsia-600/20 border border-fuchsia-500/30 px-4 py-2 rounded-full text-sm">
                  👥 Max {tournament.max_teams} Teams
                </span>
                <span className="bg-green-600/20 border border-green-500/30 px-4 py-2 rounded-full text-sm">
                  💰 ₹{Number(tournament.purse_amount).toLocaleString()}
                </span>
                <span className={`${tournament.status === 'live' ? 'bg-green-600/20 border-green-500/30 text-green-400' : 'bg-yellow-600/20 border-yellow-500/30 text-yellow-400'} px-4 py-2 rounded-full text-sm`}>
                  <i className={`fas ${tournament.status === 'live' ? 'fa-circle' : 'fa-clock'} mr-1 text-xs`}></i>
                  {tournament.status === 'live' ? 'LIVE' : tournament.status || 'Upcoming'}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/tournaments")}
              className="text-gray-400 hover:text-white transition"
            >
              <i className="fas fa-arrow-left text-2xl"></i>
            </button>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* TEAMS BUTTON */}
          <button
            onClick={fetchTeams}
            className={`bg-white/5 backdrop-blur-lg border rounded-2xl p-6 text-left transition-all duration-200 hover:scale-105 ${
              activeTab === "teams" 
                ? "border-purple-500 shadow-lg shadow-purple-500/20" 
                : "border-purple-500/20 hover:border-purple-500"
            }`}
          >
            <i className="fas fa-users text-4xl mb-3 text-purple-400"></i>
            <h2 className="text-2xl font-bold text-white">Teams</h2>
            <p className="text-gray-400 mt-1">
              {teams.length} team{teams.length !== 1 ? 's' : ''} joined
            </p>
          </button>

          {/* PLAYERS BUTTON */}
          <button
            onClick={fetchPlayers}
            className={`bg-white/5 backdrop-blur-lg border rounded-2xl p-6 text-left transition-all duration-200 hover:scale-105 ${
              activeTab === "players" 
                ? "border-purple-500 shadow-lg shadow-purple-500/20" 
                : "border-purple-500/20 hover:border-purple-500"
            }`}
          >
            <i className="fas fa-users text-4xl mb-3 text-purple-400"></i>
            <h2 className="text-2xl font-bold text-white">Players Pool</h2>
            <p className="text-gray-400 mt-1">
              {players.length} players available
            </p>
          </button>
        </div>

        {/* DYNAMIC CONTENT - TEAMS */}
        {activeTab === "teams" && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold text-purple-300 mb-6 flex items-center gap-2">
              <i className="fas fa-users"></i>
              Joined Teams ({teams.length})
            </h2>

            {teams.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-users-slash text-5xl text-gray-500 mb-4"></i>
                <p className="text-gray-400">No teams have joined this tournament yet</p>
                <button
                  onClick={() => navigate(`/tournaments`)}
                  className="mt-4 text-purple-400 hover:text-purple-300 transition"
                >
                  Browse other tournaments →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-black/40 border border-purple-800 rounded-xl p-4 hover:border-purple-500 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      {team.team_logo ? (
                        <img
                          src={team.team_logo}
                          alt={team.team_name}
                          className="w-14 h-14 rounded-full object-cover border border-purple-500"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/56x56?text=Team";
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                          <i className="fas fa-users text-white text-xl"></i>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">
                          {team.team_name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Owner: {team.owner_name || `Team ${team.id}`}
                        </p>
                        {team.initial_budget && (
                          <p className="text-xs text-green-400 mt-1">
                            Budget: ₹{Number(team.initial_budget).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DYNAMIC CONTENT - PLAYERS */}
        {activeTab === "players" && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h2 className="text-2xl font-bold text-purple-300 mb-6 flex items-center gap-2">
              <i className="fas fa-users"></i>
              Players Pool ({players.length})
            </h2>

            {players.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-user-slash text-5xl text-gray-500 mb-4"></i>
                <p className="text-gray-400">No players available for auction</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-black/40 border border-purple-800 rounded-xl p-4 hover:border-purple-500 transition-all duration-200 hover:scale-105"
                  >
                    {player.image ? (
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-full h-40 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x160?text=Player";
                        }}
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-purple-900/50 to-fuchsia-900/50 rounded-lg flex items-center justify-center">
                        <i className="fas fa-user-circle text-5xl text-purple-400"></i>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-white mt-3">
                      {player.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {player.position || "Player"}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-purple-300">
                        {player.sport || "Cricket"}
                      </span>
                      <span className="text-yellow-400 font-semibold">
                        ₹{Number(player.base_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetails;