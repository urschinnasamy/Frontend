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
  const [teamPurchases, setTeamPurchases] = useState({}); // Track purchases per team

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
  const [activeTab, setActiveTab] = useState("bidding");
  const [processingAutoSell, setProcessingAutoSell] = useState(false);
  const [selectedTeamForPlayers, setSelectedTeamForPlayers] = useState(null);
  const [showTeamPlayersPopup, setShowTeamPlayersPopup] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const isOwner = user?.id === tournament?.created_by;

  const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const tRes = await API.get(`/tournaments/${id}`);
      setTournament(tRes.data);

      const pRes = await API.get(`/auction/players/${id}`);
      const teamRes = await API.get(`/auction/teams/${id}`);

      let teamsArray = [];
      if (Array.isArray(teamRes.data)) {
        teamsArray = teamRes.data;
      } else if (teamRes.data && typeof teamRes.data === "object") {
        teamsArray = Array.isArray(teamRes.data.data) ? teamRes.data.data : [];
      }

      teamsArray = teamsArray.map(team => ({
        ...team,
        remaining_purse: toNumber(team.remaining_purse),
        purchased_players: [] // Initialize empty purchased players array
      }));
      setTeams(teamsArray);

      // Initialize team purchases tracker
      const initialPurchases = {};
      teamsArray.forEach(team => {
        initialPurchases[team.id] = [];
      });
      setTeamPurchases(initialPurchases);

      const mappedPlayers = Array.isArray(pRes.data)
        ? pRes.data.map((p) => ({
            id: p.player_id,
            tournament_player_id: p.tournament_player_id,
            name: p.name,
            image: p.image,
            position: p.position,
            base_price: toNumber(p.base_price),
            is_sold: p.is_sold,
            sold_price: toNumber(p.sold_price),
            sold_to_team_id: p.sold_to_team_id,
          }))
        : [];

      setPlayers(mappedPlayers);

      if (mappedPlayers.length > 0) {
        setCurrentPlayer(mappedPlayers[0]);
        setCurrentBid(toNumber(mappedPlayers[0].base_price));
        setPlayerIndex(0);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
      alert("Failed to load auction data.");
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

  useEffect(() => {
    socket.on("bidUpdate", (data) => {
      setCurrentBid(toNumber(data.amount));
      setCurrentTeam(data.team.team_name);
      setCurrentTeamId(data.team.id);
      setCurrentBidId(data.bidId);
      setTimeLeft((prev) => Math.min(prev + 5, 30));
      setIsBidding(false);
    });

    socket.on("nextPlayer", (player) => {
      if (!player || player === "unsold") return;
      setCurrentPlayer(player);
      setCurrentBid(toNumber(player.base_price));
      setCurrentTeam("");
      setCurrentTeamId("");
      setCurrentBidId(null);
      setTimeLeft(30);
      setIsBidding(false);
      setProcessingAutoSell(false);
    });

    socket.on("auctionCompleted", () => {
      setAuctionCompleted(true);
      alert("🎉 Auction Completed Successfully!");
    });

    return () => {
      socket.off("bidUpdate");
      socket.off("nextPlayer");
      socket.off("auctionCompleted");
    };
  }, []);

  useEffect(() => {
    if (!currentPlayer || auctionCompleted || processingAutoSell) return;

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
  }, [currentPlayer, auctionCompleted, isBidding, processingAutoSell]);

  // Show popup for team when they buy a player
  const showPurchasePopup = (teamName, playerName, price) => {
    alert(`🎉 ${teamName} purchased ${playerName} for ₹${price.toLocaleString()}!`);
  };

  const handleTimerEnd = async () => {
    if (!currentPlayer || processingAutoSell) return;
    
    setProcessingAutoSell(true);

    if (currentTeamId && currentTeam && currentBid > toNumber(currentPlayer.base_price)) {
        try {
            const sellData = {
                tournament_id: parseInt(id),
                player_id: currentPlayer.id,
                team_id: currentTeamId,
                price: toNumber(currentBid),
            };
            
            const response = await API.post("/auction/sell", sellData);

            // Show purchase popup
            showPurchasePopup(currentTeam, currentPlayer.name, toNumber(currentBid));

            // Add to sold players list
            const soldPlayerData = {
                ...currentPlayer,
                sold_price: toNumber(currentBid),
                team: currentTeam,
                team_id: currentTeamId,
            };
            
            setSoldPlayers((prev) => [...prev, soldPlayerData]);

            // Update team purchases
            setTeamPurchases(prev => ({
                ...prev,
                [currentTeamId]: [...(prev[currentTeamId] || []), soldPlayerData]
            }));

            // Update team budget locally
            setTeams(prevTeams => 
                prevTeams.map(team => 
                    team.id === currentTeamId 
                        ? { 
                            ...team, 
                            remaining_purse: toNumber(team.remaining_purse) - toNumber(currentBid),
                            purchased_players: [...(team.purchased_players || []), soldPlayerData]
                          }
                        : team
                )
            );

            alert(`⏰ Time's up! ${currentPlayer.name} SOLD to ${currentTeam} for ₹${toNumber(currentBid).toLocaleString()}`);
            moveToNextPlayer();
        } catch (err) {
            console.error("Auto-sell error:", err);
            alert(`Failed to auto-sell ${currentPlayer.name}: ${err.response?.data?.msg || err.message}`);
            moveToNextPlayer();
        }
    } else {
        setUnsoldPlayers((prev) => [...prev, currentPlayer]);
        alert(`⏰ Time's up! ${currentPlayer.name} UNSOLD (no bids placed)`);
        moveToNextPlayer();
    }
  };

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

  const placeBid = async (team, increment) => {
    if (!team) {
      alert("No teams available for bidding");
      return;
    }

    if (isBidding) {
      alert("Please wait, processing previous bid...");
      return;
    }

    setIsBidding(true);

    const currentBidAmount = toNumber(currentBid);
    const incrementAmount = toNumber(increment);
    const newAmount = currentBidAmount + incrementAmount;
    const teamBudget = toNumber(team.remaining_purse);

    if (newAmount > teamBudget) {
      alert(`${team.team_name} has insufficient balance!\n\nAvailable: ₹${teamBudget.toLocaleString()}\nRequired: ₹${newAmount.toLocaleString()}`);
      setIsBidding(false);
      return;
    }

    if (newAmount <= currentBidAmount) {
      alert(`Bid must be higher than current bid of ₹${currentBidAmount.toLocaleString()}`);
      setIsBidding(false);
      return;
    }

    try {
      const bidResponse = await API.post("/auction/bids", {
        tournament_id: parseInt(id),
        player_id: currentPlayer.id,
        team_id: team.id,
        amount: newAmount,
      });

      socket.emit("placeBid", {
        tournamentId: id,
        player: currentPlayer,
        team: {
          id: team.id,
          team_name: team.team_name,
        },
        amount: newAmount,
        bidId: bidResponse.data.id,
      });
    } catch (err) {
      console.log("Bid error:", err);
      const errorMsg = err.response?.data?.msg || "Failed to place bid";
      alert(errorMsg);
      setIsBidding(false);
    }
  };

  const markSold = async () => {
    if (!currentTeamId || !currentTeam) {
      alert("Cannot sell: No bid has been placed on this player yet!");
      return;
    }

    if (!isOwner) {
      alert("Only tournament owner can manually sell players");
      return;
    }

    const confirmSell = window.confirm(`Are you sure you want to sell ${currentPlayer.name} to ${currentTeam} for ₹${toNumber(currentBid).toLocaleString()}?`);
    
    if (!confirmSell) return;

    try {
      await API.post("/auction/sell", {
        tournament_id: parseInt(id),
        player_id: currentPlayer.id,
        team_id: currentTeamId,
        price: toNumber(currentBid),
      });

      const soldPlayerData = {
        ...currentPlayer,
        sold_price: toNumber(currentBid),
        team: currentTeam,
        team_id: currentTeamId,
      };

      setSoldPlayers((prev) => [...prev, soldPlayerData]);

      setTeamPurchases(prev => ({
        ...prev,
        [currentTeamId]: [...(prev[currentTeamId] || []), soldPlayerData]
      }));

      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === currentTeamId 
            ? { 
                ...team, 
                remaining_purse: toNumber(team.remaining_purse) - toNumber(currentBid),
                purchased_players: [...(team.purchased_players || []), soldPlayerData]
              }
            : team
        )
      );

      alert(`✅ ${currentPlayer.name} SOLD to ${currentTeam} for ₹${toNumber(currentBid).toLocaleString()}`);
      moveToNextPlayer();
    } catch (err) {
      console.error(err);
      alert("Failed to mark as sold");
    }
  };

  const markUnsold = () => {
    if (!isOwner) {
      alert("Only tournament owner can manually mark players as unsold");
      return;
    }

    const confirmUnsold = window.confirm(`Are you sure you want to mark ${currentPlayer.name} as UNSOLD?`);
    
    if (!confirmUnsold) return;

    setUnsoldPlayers((prev) => [...prev, currentPlayer]);
    alert(`❌ ${currentPlayer.name} marked as UNSOLD`);
    moveToNextPlayer();
  };

 const finishAuction = async () => {
    if (!isOwner) {
        alert("Only tournament owner can finish the auction");
        return;
    }

    const remainingPlayers = players.length - playerIndex;
    const confirmFinish = window.confirm(
        `🏆 FINISH AUCTION?\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 Current Status:\n` +
        `• Sold Players: ${soldPlayers.length}\n` +
        `• Unsold Players: ${unsoldPlayers.length}\n` +
        `• Remaining Players: ${remainingPlayers}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ This will:\n` +
        `• Mark all remaining ${remainingPlayers} players as UNSOLD\n` +
        `• End the auction permanently\n` +
        `• Prevent any further bids\n\n` +
        `Are you sure you want to finish the auction?`
    );

    if (!confirmFinish) return;

    try {
        console.log("Finishing auction for tournament:", id);
        
        const response = await API.post(`/auction/finish/${id}`);
        
        console.log("Finish response:", response.data);
        
        if (response.data.success) {
            // Emit socket event
            socket.emit("completeAuction", { 
                tournamentId: id,
                finishedBy: {
                    id: user?.id,
                    name: user?.name,
                    email: user?.email
                }
            });
            
            setAuctionCompleted(true);
            
            alert(
                `🎉 AUCTION FINISHED! 🎉\n\n` +
                `📊 Final Summary:\n` +
                `✅ Sold: ${soldPlayers.length} players\n` +
                `❌ Unsold: ${unsoldPlayers.length} players\n` +
                `📋 Remaining marked unsold: ${remainingPlayers}\n\n` +
                `Redirecting to tournaments page...`
            );
            
            // Redirect to tournaments page after 3 seconds
            setTimeout(() => {
                navigate('/tournaments');
            }, 3000);
        } else {
            alert(response.data.msg || "Failed to finish auction");
        }
    } catch (err) {
        console.error("Finish auction error:", err);
        alert(`Failed to finish auction: ${err.response?.data?.msg || err.message}`);
    }
};

  const formatBidAmount = (amount) => {
    const numAmount = toNumber(amount);
    if (numAmount >= 10000000) return `${(numAmount / 10000000).toFixed(2)} Cr`;
    if (numAmount >= 100000) return `${(numAmount / 100000).toFixed(2)} L`;
    return `₹${numAmount.toLocaleString()}`;
  };

  const getBidIncrements = (basePrice) => {
    const price = toNumber(basePrice);
    if (price >= 10000000) {
      return [
        { label: "+25 L", value: 2500000 },
        { label: "+50 L", value: 5000000 },
        { label: "+75 L", value: 7500000 },
        { label: "+1 Cr", value: 10000000 },
      ];
    } else if (price >= 1000000) {
      return [
        { label: "+5 L", value: 500000 },
        { label: "+10 L", value: 1000000 },
        { label: "+15 L", value: 1500000 },
        { label: "+25 L", value: 2500000 },
      ];
    } else if (price >= 100000) {
      return [
        { label: "+25k", value: 25000 },
        { label: "+50k", value: 50000 },
        { label: "+75k", value: 75000 },
        { label: "+1L", value: 100000 },
      ];
    } else {
      return [
        { label: "+5k", value: 5000 },
        { label: "+10k", value: 10000 },
        { label: "+25k", value: 25000 },
        { label: "+50k", value: 50000 },
      ];
    }
  };

  const increments = currentPlayer ? getBidIncrements(currentPlayer.base_price) : [];

  // Component to show team purchased players
  const TeamPlayersPopup = ({ team, onClose }) => {
    const purchasedPlayers = teamPurchases[team.id] || [];
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl w-full max-w-2xl border border-purple-500 shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-purple-800">
            <div className="flex items-center gap-3">
              {team.team_logo ? (
                <img src={team.team_logo} alt={team.team_name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{team.team_name}</h2>
                <p className="text-sm text-purple-300">Purchased Players</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {purchasedPlayers.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No players purchased yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {purchasedPlayers.map((player, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-xs text-purple-300">{player.position || "All-Rounder"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">₹{toNumber(player.sold_price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-purple-800">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Remaining Purse:</span>
                <span className="text-yellow-400 font-bold text-xl">₹{toNumber(team.remaining_purse).toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-purple-800">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading Auction Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Team Players Popup */}
      {showTeamPlayersPopup && selectedTeamForPlayers && (
        <TeamPlayersPopup 
          team={selectedTeamForPlayers} 
          onClose={() => {
            setShowTeamPlayersPopup(false);
            setSelectedTeamForPlayers(null);
          }}
        />
      )}

      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Auction Arena</h1>
                <p className="text-xs text-purple-300">{tournament?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/10 rounded-lg px-3 py-1 text-center">
                <p className="text-[10px] text-gray-400">Remaining</p>
                <p className="text-lg font-bold text-purple-400">{players.length - playerIndex}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-1 text-center">
                <p className="text-[10px] text-gray-400">Sold</p>
                <p className="text-lg font-bold text-green-400">{soldPlayers.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-1 text-center">
                <p className="text-[10px] text-gray-400">Unsold</p>
                <p className="text-lg font-bold text-red-400">{unsoldPlayers.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Section - Player Card and Bidding */}
          <div className="lg:col-span-2">
            {auctionCompleted ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Auction Completed!</h2>
                <p className="text-purple-300 mb-6">{soldPlayers.length} players sold • {unsoldPlayers.length} unsold</p>
                <button
                  onClick={() => navigate(`/tournaments/${id}`)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Back to Tournament
                </button>
              </div>
            ) : (
              <>
                {/* Timer Section */}
                <div className="mb-6">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Time Remaining for {currentPlayer?.name}</span>
                      <span className={`text-2xl font-bold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-yellow-400"}`}>
                        {timeLeft}s
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-red-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      ></div>
                    </div>
                    {currentTeam && (
                      <div className="mt-2 text-center text-xs text-purple-300">
                        Highest bidder: {currentTeam} - ₹{toNumber(currentBid).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Player Card */}
                {currentPlayer && (
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden mb-6">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                      {/* Player Info */}
                      <div className="text-center md:text-left">
                        <div className="relative inline-block md:mx-0 mx-auto">
                          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-[2px] mx-auto md:mx-0">
                            <div className="w-full h-full rounded-2xl bg-slate-900 overflow-hidden">
                              {currentPlayer.image ? (
                                <img src={currentPlayer.image} alt={currentPlayer.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-20 h-20 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mt-4">{currentPlayer.name}</h2>
                        <p className="text-purple-300 text-sm mb-3">{currentPlayer.position || "All-Rounder"}</p>
                        
                        <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-4 py-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-yellow-400 font-semibold text-sm">Base: {formatBidAmount(currentPlayer.base_price)}</span>
                        </div>
                      </div>

                      {/* Bidding Section */}
                      <div>
                        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/10">
                          <p className="text-xs text-gray-400 mb-1">Current Bid</p>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-white">{formatBidAmount(currentBid)}</span>
                            {currentTeam && (
                              <span className="text-xs bg-purple-500/20 px-2 py-1 rounded-full text-purple-300">
                                by {currentTeam}
                              </span>
                            )}
                          </div>
                          {!currentTeam && (
                            <p className="text-xs text-yellow-400 mt-2">No bids yet. Starting bid: {formatBidAmount(currentPlayer.base_price)}</p>
                          )}
                        </div>

                        <div className="flex space-x-2 mb-4">
                          <button
                            onClick={() => setActiveTab("bidding")}
                            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "bidding" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                          >
                            Place Bid
                          </button>
                          <button
                            onClick={() => setActiveTab("teams")}
                            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "teams" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                          >
                            Teams ({teams.length})
                          </button>
                        </div>

                        {activeTab === "bidding" && (
                          <>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                              {teams.map((team) => (
                                <div key={team.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="font-semibold text-white">{team.team_name}</span>
                                    <span className="text-xs text-green-400">₹{toNumber(team.remaining_purse).toLocaleString()}</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {increments.map((inc, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => placeBid(team, inc.value)}
                                        disabled={isBidding}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-2 rounded-lg font-bold text-xs transition disabled:opacity-50"
                                      >
                                        {inc.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {isOwner && (
                              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-xs text-yellow-400 mb-2 text-center">Owner Controls (Manual Override)</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    onClick={markSold}
                                    disabled={!currentTeamId || isBidding}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-2 rounded-lg font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Force Sell</span>
                                  </button>
                                  <button
                                    onClick={markUnsold}
                                    disabled={isBidding}
                                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 py-2 rounded-lg font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>Force Unsold</span>
                                  </button>
                                </div>
                                <button
                                  onClick={finishAuction}
                                  className="w-full mt-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 py-2 rounded-lg font-semibold text-xs transition flex items-center justify-center space-x-2"
                                >
                                  <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Finish Auction Early</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {activeTab === "teams" && (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {teams.map((team) => (
                              <div 
                                key={team.id} 
                                className="bg-white/5 rounded-lg p-3 border border-white/10 cursor-pointer hover:bg-white/10 transition"
                                onClick={() => {
                                  setSelectedTeamForPlayers(team);
                                  setShowTeamPlayersPopup(true);
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {team.team_logo ? (
                                      <img src={team.team_logo} alt={team.team_name} className="w-8 h-8 rounded-full" />
                                    ) : (
                                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                        </svg>
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-semibold text-white text-sm">{team.team_name}</p>
                                      <p className="text-xs text-gray-400">
                                        Purchased: {(teamPurchases[team.id] || []).length} players
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-400">₹{toNumber(team.remaining_purse).toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400">Remaining</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Players */}
                {!auctionCompleted && players.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-white">Upcoming Players</h3>
                      <span className="text-xs text-purple-300">({players.length - playerIndex - 1} left)</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {players.slice(playerIndex + 1, playerIndex + 9).map((player, idx) => (
                        <div key={player.id || idx} className="bg-black/30 rounded-lg p-2 text-center border border-white/10">
                          <div className="w-full h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-1">
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-white truncate">{player.name}</p>
                          <p className="text-[8px] text-yellow-400">{formatBidAmount(player.base_price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Section - Teams List with Purchased Players */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sticky top-20">
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-white/10">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Teams & Budgets</h3>
              </div>
              
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {teams.map((team) => {
                  const purchasedCount = (teamPurchases[team.id] || []).length;
                  const totalSpent = (teamPurchases[team.id] || []).reduce((sum, p) => sum + toNumber(p.sold_price), 0);
                  
                  return (
                    <div 
                      key={team.id} 
                      className="bg-white/5 rounded-xl p-3 border border-white/10 cursor-pointer hover:bg-white/10 transition-all hover:scale-105"
                      onClick={() => {
                        setSelectedTeamForPlayers(team);
                        setShowTeamPlayersPopup(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
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
                            <p className="text-[10px] text-purple-300">
                              {purchasedCount} player{purchasedCount !== 1 ? 's' : ''} purchased
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-400">₹{toNumber(team.remaining_purse).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Remaining</p>
                        </div>
                      </div>
                      
                      {totalSpent > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Total Spent:</span>
                            <span className="text-yellow-400 font-semibold">₹{totalSpent.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Progress bar for budget usage */}
                      <div className="mt-2">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                            style={{ 
                              width: `${((team.purse_amount - toNumber(team.remaining_purse)) / team.purse_amount) * 100}% 
                            `}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary Section */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Players:</span>
                  <span className="text-white font-semibold">{players.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Sold Players:</span>
                  <span className="text-green-400 font-semibold">{soldPlayers.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Unsold Players:</span>
                  <span className="text-red-400 font-semibold">{unsoldPlayers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auction;