import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_spent");
  const [viewMode, setViewMode] = useState("all"); // all, tournament

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentData(selectedTournament.id);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      const completedTournaments = (res.data || []).filter(t => t.status === "completed");
      setTournaments(completedTournaments);
      if (completedTournaments.length > 0) {
        setSelectedTournament(completedTournaments[0]);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentData = async (tournamentId) => {
    try {
      setLoading(true);
      const [teamRes, soldRes] = await Promise.all([
        API.get(`/auction/teams/${tournamentId}`),
        API.get(`/auction/sold/${tournamentId}`)
      ]);
      setTeams(teamRes.data || []);
      setSoldPlayers(soldRes.data || []);
    } catch (err) {
      console.error("Error fetching tournament data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return "₹0";
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString()}`;
  };

  // Calculate team statistics
  const getTeamStats = () => {
    const stats = {};

    teams.forEach(team => {
      stats[team.id] = {
        id: team.id,
        name: team.team_name,
        logo: team.team_logo,
        initial_budget: team.purse_amount || 0,
        remaining_budget: team.remaining_purse || 0,
        total_spent: 0,
        players: [],
        players_count: 0,
      };
    });

    soldPlayers.forEach(player => {
      const teamId = player.team_id;
      if (stats[teamId]) {
        const price = Number(player.sold_price) || 0;
        stats[teamId].players.push({
          name: player.name,
          position: player.position,
          price: price,
        });
        stats[teamId].total_spent += price;
        stats[teamId].players_count++;
      }
    });

    return Object.values(stats);
  };

  const teamStats = getTeamStats();
  
  const sortedTeams = [...teamStats].sort((a, b) => {
    if (sortBy === "total_spent") return b.total_spent - a.total_spent;
    if (sortBy === "players_count") return b.players_count - a.players_count;
    if (sortBy === "budget_used") return (b.initial_budget - b.remaining_budget) - (a.initial_budget - a.remaining_budget);
    return 0;
  });

  const getRankColor = (index) => {
    if (index === 0) return "from-yellow-400 to-orange-500";
    if (index === 1) return "from-gray-300 to-gray-400";
    if (index === 2) return "from-amber-600 to-amber-700";
    return "from-purple-600 to-fuchsia-600";
  };

  const getRankIcon = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const totalSpentAll = teamStats.reduce((sum, t) => sum + t.total_spent, 0);
  const totalPlayersSold = soldPlayers.length;

  if (loading && tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <i className="fas fa-chart-line"></i>
            Global Leaderboard
          </h1>
          <p className="text-gray-400 mt-2">Top performing teams across all completed tournaments</p>
        </div>

        {/* Tournament Selector */}
        {tournaments.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <i className="fas fa-trophy text-purple-400"></i>
                <span className="text-gray-300">Select Tournament:</span>
                <div className="flex flex-wrap gap-2">
                  {tournaments.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTournament(t)}
                      className={`px-4 py-2 rounded-lg text-sm transition ${
                        selectedTournament?.id === t.id
                          ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {teams.length} teams • {totalPlayersSold} players sold • {formatAmount(totalSpentAll)} spent
              </div>
            </div>
          </div>
        )}

        {selectedTournament && (
          <>
            {/* Tournament Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Tournament</p>
                    <p className="text-lg font-bold text-white">{selectedTournament.name}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-trophy text-purple-400"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Teams</p>
                    <p className="text-2xl font-bold text-white">{teams.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-green-400"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Players Sold</p>
                    <p className="text-2xl font-bold text-yellow-400">{totalPlayersSold}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-plus text-yellow-400"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-blue-400">{formatAmount(totalSpentAll)}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <i className="fas fa-coins text-blue-400"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-6 border border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Sort by:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy("total_spent")}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        sortBy === "total_spent"
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Total Spent
                    </button>
                    <button
                      onClick={() => setSortBy("players_count")}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        sortBy === "players_count"
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Players Bought
                    </button>
                    <button
                      onClick={() => setSortBy("budget_used")}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        sortBy === "budget_used"
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      Budget Used
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/tournaments/${selectedTournament.id}/results`)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition"
                >
                  <i className="fas fa-chart-bar mr-1"></i>
                  View Full Results
                </button>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">Team</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-purple-300">Players Bought</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-purple-300">Total Spent</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-purple-300">Budget Left</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-purple-300">Budget Used</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-purple-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map((team, index) => (
                      <tr
                        key={team.id}
                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                        onClick={() => navigate(`/tournaments/${selectedTournament.id}/results`)}
                      >
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 bg-gradient-to-r ${getRankColor(index)} rounded-full flex items-center justify-center font-bold text-sm`}>
                            {getRankIcon(index)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {team.logo ? (
                              <img src={team.logo} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{team.name?.charAt(0) || "T"}</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white">{team.name}</p>
                              <p className="text-xs text-gray-400">{team.players.length} players</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-white">{team.players_count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-yellow-400">{formatAmount(team.total_spent)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-green-400">{formatAmount(team.remaining_budget)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="w-full max-w-[100px] mx-auto">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (team.initial_budget - team.remaining_budget) / team.initial_budget > 0.7 
                                    ? "bg-red-500" 
                                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                                }`}
                                style={{ width: `${((team.initial_budget - team.remaining_budget) / team.initial_budget) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {Math.round(((team.initial_budget - team.remaining_budget) / team.initial_budget) * 100)}%
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tournaments/${selectedTournament.id}/results`);
                            }}
                            className="text-purple-400 hover:text-purple-300 transition text-sm"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {sortedTeams.length === 0 && !loading && (
              <div className="text-center py-12">
                <i className="fas fa-chart-line text-6xl text-purple-500 mb-4 opacity-50"></i>
                <p className="text-gray-400">No data available for this tournament</p>
              </div>
            )}
          </>
        )}

        {tournaments.length === 0 && !loading && (
          <div className="text-center py-12">
            <i className="fas fa-trophy text-6xl text-purple-500 mb-4 opacity-50"></i>
            <p className="text-gray-400 text-lg">No completed tournaments yet</p>
            <p className="text-gray-500 text-sm mt-2">Complete some auctions to see the leaderboard</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;