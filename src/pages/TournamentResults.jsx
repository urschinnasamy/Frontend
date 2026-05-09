import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

const TournamentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const isOwner = user?.id === tournament?.created_by;

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);

      // Fetch tournament details
      const tRes = await API.get(`/tournaments/${id}`);
      setTournament(tRes.data);

      // Fetch sold players
      const soldRes = await API.get(`/auction/sold/${id}`);
      setSoldPlayers(soldRes.data || []);

      // Fetch teams
      const teamRes = await API.get(`/auction/teams/${id}`);
      setTeams(teamRes.data || []);

      // Fetch unsold players
      const playersRes = await API.get(`/auction/players/${id}`);
      setUnsoldPlayers(playersRes.data || []);

    } catch (err) {
      console.error("Error fetching results:", err);
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

  // Group sold players by team
  const playersByTeam = {};
  soldPlayers.forEach(player => {
    if (!playersByTeam[player.team_id]) {
      playersByTeam[player.team_id] = {
        team_name: player.sold_to_team,
        team_id: player.team_id,
        players: [],
        total_spent: 0
      };
    }
    playersByTeam[player.team_id].players.push(player);
    playersByTeam[player.team_id].total_spent += Number(player.sold_price || 0);
  });

  // Get team budget info
  const teamBudgetMap = {};
  teams.forEach(team => {
    teamBudgetMap[team.id] = team;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading Results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Auction Results</h1>
                <p className="text-xs text-purple-300">{tournament?.name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/tournaments/${id}`)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Tournament
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Players</p>
                <p className="text-2xl font-bold text-white">{soldPlayers.length + unsoldPlayers.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-xl rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Sold Players</p>
                <p className="text-2xl font-bold text-green-400">{soldPlayers.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-xl rounded-xl p-4 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unsold Players</p>
                <p className="text-2xl font-bold text-red-400">{unsoldPlayers.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {formatAmount(soldPlayers.reduce((sum, p) => sum + Number(p.sold_price || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Teams and Players Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sticky top-20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Participating Teams ({teams.length})
              </h2>
              <div className="space-y-2">
                {teams.map((team) => {
                  const teamPlayers = playersByTeam[team.id];
                  const isSelected = selectedTeam?.id === team.id;
                  
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`bg-white/5 rounded-xl p-3 border cursor-pointer transition-all ${
                        isSelected 
                          ? "border-purple-500 bg-purple-500/20" 
                          : "border-white/10 hover:border-purple-500/50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {team.team_logo ? (
                            <img src={team.team_logo} alt={team.team_name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {team.team_name?.charAt(0) || "T"}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-white text-sm">{team.team_name}</p>
                            <p className="text-xs text-gray-400">
                              {teamPlayers ? teamPlayers.players.length : 0} players purchased
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">
                            {teamPlayers ? formatAmount(teamPlayers.total_spent) : "₹0"}
                          </p>
                          <p className="text-[10px] text-gray-400">Total Spent</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Players List for Selected Team */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {selectedTeam.team_logo ? (
                      <img src={selectedTeam.team_logo} alt={selectedTeam.team_name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedTeam.team_name?.charAt(0) || "T"}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedTeam.team_name}</h2>
                      <p className="text-sm text-purple-300">
                        {playersByTeam[selectedTeam.id]?.players.length || 0} Players Purchased
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Spent</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {formatAmount(playersByTeam[selectedTeam.id]?.total_spent || 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {playersByTeam[selectedTeam.id]?.players.length > 0 ? (
                    playersByTeam[selectedTeam.id].players.map((player, idx) => (
                      <div key={idx} className="bg-black/30 rounded-xl p-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{player.name}</p>
                            <p className="text-xs text-purple-300">{player.position || "All-Rounder"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">{formatAmount(player.sold_price)}</p>
                          <p className="text-[10px] text-gray-400">Sold Price</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-400">No players purchased by this team</p>
                    </div>
                  )}
                </div>

                {/* Budget Info */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Initial Budget:</span>
                    <span className="text-white font-semibold">{formatAmount(selectedTeam.purse_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Remaining Budget:</span>
                    <span className="text-green-400 font-semibold">{formatAmount(selectedTeam.remaining_purse)}</span>
                  </div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ 
                        width: `${((selectedTeam.purse_amount - selectedTeam.remaining_purse) / selectedTeam.purse_amount) * 100}% 
                      `}}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center">
                <svg className="w-20 h-20 text-purple-500 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">Select a Team</h3>
                <p className="text-gray-400">Click on any team from the left to view their purchased players</p>
              </div>
            )}
          </div>
        </div>

        {/* Unsold Players Section */}
        {unsoldPlayers.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Unsold Players ({unsoldPlayers.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {unsoldPlayers.map((player, idx) => (
                  <div key={idx} className="bg-black/30 rounded-xl p-3 text-center">
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-2">
                      {player.image ? (
                        <img src={player.image} alt={player.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="font-semibold text-white text-sm truncate">{player.name}</p>
                    <p className="text-xs text-purple-300">{player.position || "All-Rounder"}</p>
                    <p className="text-xs text-yellow-400 mt-1">{formatAmount(player.base_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentResults;