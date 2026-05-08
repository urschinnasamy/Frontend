import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import socket from "../sockets/socket";

const Auction = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentTeam, setCurrentTeam] = useState("");
  const [currentTeamId, setCurrentTeamId] = useState("");
  const [currentBidId, setCurrentBidId] = useState(null);

  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [auctionCompleted, setAuctionCompleted] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const isOwner = user?.id === tournament?.created_by;

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    try {
      setLoading(true);

      const [tRes, pRes, teamRes] = await Promise.all([
        API.get(`/tournaments/${id}`),
        API.get(`/auction/players/${id}`), // This matches your backend route
        API.get(`/teams?tournament_id=${id}`),
      ]);

      setTournament(tRes.data);
      
      // Map the response from your backend
      const mappedPlayers = (pRes.data || []).map(p => ({
        id: p.player_id,
        tournament_player_id: p.tournament_player_id,
        name: p.name,
        image: p.image,
        position: p.position,
        base_price: p.base_price,
        is_sold: p.is_sold,
        sold_price: p.sold_price,
        sold_to_team_id: p.sold_to_team_id
      }));
      
      setPlayers(mappedPlayers);
      setTeams(teamRes.data || []);

      if (mappedPlayers.length > 0) {
        setCurrentPlayer(mappedPlayers[0]);
        setCurrentBid(mappedPlayers[0].base_price || 0);
        setPlayerIndex(0);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    socket.emit("joinAuction", id);

    return () => {
      socket.off("bidUpdate");
      socket.off("nextPlayer");
      socket.off("auctionCompleted");
    };
  }, [id]);

  // ---------------- SOCKET LISTEN ----------------
  useEffect(() => {
    socket.on("bidUpdate", (data) => {
      setCurrentBid(data.amount);
      setCurrentTeam(data.team.team_name);
      setCurrentTeamId(data.team.id);
      setCurrentBidId(data.bidId);
      setTimeLeft((prev) => Math.min(prev + 5, 30));
      setIsBidding(false);
    });

    socket.on("nextPlayer", (player) => {
      if (!player || player === "unsold") return;

      setCurrentPlayer(player);
      setCurrentBid(player.base_price || 0);
      setCurrentTeam("");
      setCurrentTeamId("");
      setCurrentBidId(null);
      setTimeLeft(30);
      setIsBidding(false);
    });

    socket.on("auctionCompleted", () => {
      setAuctionCompleted(true);
      alert("🎉 Auction Completed Successfully! 🎉");
    });

    return () => {
      socket.off("bidUpdate");
      socket.off("nextPlayer");
      socket.off("auctionCompleted");
    };
  }, []);

  // ---------------- TIMER ----------------
  useEffect(() => {
    if (!currentPlayer || auctionCompleted) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isBidding) {
            handleTimerEnd();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPlayer, auctionCompleted, isBidding]);

  // ---------------- HANDLE TIMER END ----------------
  const handleTimerEnd = async () => {
    if (!currentPlayer) return;

    // If there's a current bidder, automatically sell to them
    if (currentTeamId && currentTeam) {
      try {
        // Using your existing sell endpoint
        await API.post("/auction/sell", {
          tournament_id: parseInt(id),
          player_id: currentPlayer.id,
          team_id: currentTeamId,
          price: currentBid,
        });

        setSoldPlayers((prev) => [...prev, { 
          ...currentPlayer, 
          sold_price: currentBid, 
          team: currentTeam,
          team_id: currentTeamId
        }]);

        alert(`⏰ Time's up! ${currentPlayer.name} SOLD to ${currentTeam} for ₹${currentBid.toLocaleString()}`);

        moveToNextPlayer();
      } catch (err) {
        console.log(err);
        alert("Failed to process auto-sell, moving to next player");
        moveToNextPlayer();
      }
    } else {
      // No bids, mark as unsold - just move to next player
      setUnsoldPlayers((prev) => [...prev, currentPlayer]);
      alert(`⏰ Time's up! ${currentPlayer.name} UNSOLD`);
      moveToNextPlayer();
    }
  };

  // ---------------- MOVE TO NEXT PLAYER ----------------
  const moveToNextPlayer = () => {
    const nextIndex = playerIndex + 1;
    
    if (nextIndex >= players.length) {
      socket.emit("completeAuction", { tournamentId: id });
      setAuctionCompleted(true);
      alert("🏆 Auction Completed! 🏆");
      return;
    }

    const nextPlayerData = players[nextIndex];
    setPlayerIndex(nextIndex);
    socket.emit("nextPlayer", {
      tournamentId: id,
      player: nextPlayerData,
    });
  };

  // ---------------- PLACE BID ----------------
  const placeBid = async (team, increment) => {
    if (!team) {
      alert("No teams available for bidding");
      return;
    }

    if (isBidding) return;

    setIsBidding(true);
    const newAmount = currentBid + increment;

    try {
      // First, save bid to database using your existing endpoint
      const bidResponse = await API.post("/auction/bids", {
        player_id: currentPlayer.id,
        team_id: team.id,
        amount: newAmount,
      });

      // Then emit socket event for real-time update
      socket.emit("placeBid", {
        tournamentId: id,
        player: currentPlayer,
        team,
        amount: newAmount,
        bidId: bidResponse.data.id,
      });
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.msg || "Failed to place bid");
      setIsBidding(false);
    }
  };

  // ---------------- MARK SOLD MANUALLY ----------------
  const markSold = async () => {
    if (!currentTeam) {
      alert("No bid placed yet! Cannot mark as sold.");
      return;
    }

    try {
      await API.post("/auction/sell", {
        tournament_id: parseInt(id),
        player_id: currentPlayer.id,
        team_id: currentTeamId,
        price: currentBid,
      });

      setSoldPlayers((prev) => [...prev, { 
        ...currentPlayer, 
        sold_price: currentBid, 
        team: currentTeam,
        team_id: currentTeamId
      }]);

      alert(`✅ ${currentPlayer.name} SOLD to ${currentTeam} for ₹${currentBid.toLocaleString()}`);

      moveToNextPlayer();
    } catch (err) {
      console.log(err);
      alert("Failed to mark as sold");
    }
  };

  // ---------------- MARK UNSOLD MANUALLY ----------------
  const markUnsold = () => {
    setUnsoldPlayers((prev) => [...prev, currentPlayer]);
    alert(`❌ ${currentPlayer.name} marked as UNSOLD`);
    moveToNextPlayer();
  };

  // ---------------- FINISH AUCTION ----------------
  const finishAuction = async () => {
    if (!isOwner) {
      alert("Only tournament owner can finish the auction");
      return;
    }

    const confirmFinish = window.confirm(
      "Are you sure you want to finish the auction? This will mark all remaining players as unsold."
    );

    if (!confirmFinish) return;

    socket.emit("completeAuction", { tournamentId: id });
    setAuctionCompleted(true);
    alert("🎉 Auction Finished Successfully! 🎉");
  };

  // ---------------- FORMAT BID ----------------
  const formatBidAmount = (amount) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} L`;
    }
    return amount.toLocaleString();
  };

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-gavel text-purple-400 text-xl animate-pulse"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center animate-pulse">
                <i className="fas fa-gavel text-white text-xl"></i>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Live Auction
              </h1>
            </div>
            <p className="text-gray-400 ml-2">
              <i className="fas fa-trophy mr-2 text-purple-400"></i>
              {tournament?.name}
            </p>
          </div>

          {/* Auction Stats */}
          <div className="flex gap-3">
            <div className="bg-black/40 backdrop-blur-lg border border-purple-500/30 rounded-2xl px-6 py-3 text-center">
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-2xl font-bold text-purple-400">{players.length - playerIndex}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-lg border border-purple-500/30 rounded-2xl px-6 py-3 text-center">
              <p className="text-xs text-gray-400">Sold</p>
              <p className="text-2xl font-bold text-green-400">{soldPlayers.length}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-lg border border-purple-500/30 rounded-2xl px-6 py-3 text-center">
              <p className="text-xs text-gray-400">Unsold</p>
              <p className="text-2xl font-bold text-red-400">{unsoldPlayers.length}</p>
            </div>
          </div>
        </div>

        {/* TIMER & AUCTION COMPLETED */}
        {auctionCompleted ? (
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-2xl p-8 mb-8 text-center">
            <i className="fas fa-check-circle text-5xl text-green-400 mb-3"></i>
            <h2 className="text-3xl font-bold text-green-400">Auction Completed!</h2>
            <p className="text-gray-300 mt-2">{soldPlayers.length} players sold • {unsoldPlayers.length} players unsold</p>
            <button
              onClick={() => navigate(`/tournaments/${id}`)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-xl transition"
            >
              Back to Tournament
            </button>
          </div>
        ) : (
          <>
            {/* TIMER BAR */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Time Remaining for {currentPlayer?.name}</span>
                <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                  {timeLeft} seconds
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* MAIN PLAYER CARD */}
            {currentPlayer && (
              <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-purple-500/20 p-6 mb-8 shadow-2xl">
                <div className="grid lg:grid-cols-2 gap-8">
                  
                  {/* LEFT SIDE - PLAYER INFO */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-3xl blur-2xl opacity-50"></div>
                      {currentPlayer.image ? (
                        <img
                          src={currentPlayer.image}
                          alt={currentPlayer.name}
                          className="relative w-80 h-80 object-cover rounded-3xl mx-auto border-4 border-purple-500/50 shadow-2xl"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="relative w-80 h-80 bg-gradient-to-br from-purple-900 to-fuchsia-900 rounded-3xl mx-auto border-4 border-purple-500/50 flex items-center justify-center">
                          <i className="fas fa-user-circle text-8xl text-purple-400"></i>
                        </div>
                      )}
                      {/* Base Price Badge */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                        Base Price: ₹{currentPlayer.base_price?.toLocaleString()}
                      </div>
                    </div>
                    
                    <h2 className="text-3xl mt-6 font-bold text-white">
                      {currentPlayer.name}
                    </h2>
                    <p className="text-purple-300 text-lg mt-1 flex items-center justify-center gap-2">
                      <i className="fas fa-tag"></i>
                      {currentPlayer.position || "All-Rounder"}
                    </p>
                  </div>

                  {/* RIGHT SIDE - BID INFO */}
                  <div className="flex flex-col justify-center">
                    
                    {/* CURRENT BID CARD */}
                    <div className="bg-gradient-to-br from-purple-900/50 to-black/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 mb-6">
                      <p className="text-gray-300 text-sm mb-2 flex items-center gap-2">
                        <i className="fas fa-gavel"></i>
                        Current Bid
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl text-gray-400">₹</span>
                        <span className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          {formatBidAmount(currentBid)}
                        </span>
                      </div>
                      {currentTeam && (
                        <div className="mt-4 p-3 bg-purple-600/20 rounded-xl">
                          <p className="text-purple-300 flex items-center gap-2">
                            <i className="fas fa-crown"></i>
                            Current Highest: <span className="font-semibold text-white">{currentTeam}</span>
                          </p>
                        </div>
                      )}
                      {!currentTeam && (
                        <p className="text-gray-500 mt-4 flex items-center gap-2">
                          <i className="fas fa-info-circle"></i>
                          Waiting for first bid...
                        </p>
                      )}
                    </div>

                    {/* BID BUTTONS */}
                    {!auctionCompleted && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {teams.map((team) => (
                            <div key={team.id} className="flex gap-2">
                              <button
                                onClick={() => placeBid(team, 500000)}
                                disabled={isBidding}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {team.team_name}<br/>
                                <span className="text-xs">+5 Lakhs</span>
                              </button>
                              <button
                                onClick={() => placeBid(team, 1000000)}
                                disabled={isBidding}
                                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {team.team_name}<br/>
                                <span className="text-xs">+10 Lakhs</span>
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={markSold}
                            disabled={!currentTeam || isBidding}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-check-circle"></i>
                            Mark Sold
                          </button>

                          <button
                            onClick={markUnsold}
                            disabled={isBidding}
                            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-times-circle"></i>
                            Mark Unsold
                          </button>
                        </div>

                        {/* FINISH AUCTION BUTTON */}
                        {isOwner && (
                          <button
                            onClick={finishAuction}
                            className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <i className="fas fa-flag-checkered"></i>
                            Finish Auction Early
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TEAMS SECTION */}
        {teams.length > 0 && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6 mb-8">
            <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <i className="fas fa-users"></i>
              Participating Teams ({teams.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-purple-900/30 border border-purple-500/30 rounded-xl px-4 py-2 flex items-center gap-2"
                >
                  {team.team_logo ? (
                    <img src={team.team_logo} alt={team.team_name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <i className="fas fa-shield-alt text-purple-400"></i>
                  )}
                  <span className="text-sm">{team.team_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAYER QUEUE */}
        {!auctionCompleted && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
              <i className="fas fa-list"></i>
              Upcoming Players ({players.length - playerIndex - 1})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {players.slice(playerIndex + 1, playerIndex + 13).map((player, idx) => (
                <div
                  key={player.id || idx}
                  className="bg-black/40 rounded-xl p-2 border border-purple-800/50"
                >
                  <div className="relative">
                    {player.image ? (
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-full h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/100x80?text=Player";
                        }}
                      />
                    ) : (
                      <div className="w-full h-20 bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <i className="fas fa-user text-purple-400 text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold mt-1 truncate">{player.name}</p>
                  <p className="text-xs text-gray-400 truncate">{player.position || "Player"}</p>
                  <p className="text-xs text-yellow-400 font-semibold">
                    ₹{(player.base_price || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOLD & UNSOLD SUMMARY */}
        {(soldPlayers.length > 0 || unsoldPlayers.length > 0) && auctionCompleted && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {soldPlayers.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-green-500/20 p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  Sold Players ({soldPlayers.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {soldPlayers.map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-green-900/20 rounded-lg">
                      <div>
                        <span className="font-semibold">{player.name}</span>
                        <span className="text-xs text-gray-400 ml-2">→ {player.team}</span>
                      </div>
                      <span className="text-green-400 font-bold">₹{player.sold_price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {unsoldPlayers.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-red-500/20 p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <i className="fas fa-times-circle"></i>
                  Unsold Players ({unsoldPlayers.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unsoldPlayers.map((player, idx) => (
                    <div key={idx} className="p-2 bg-red-900/20 rounded-lg">
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auction;