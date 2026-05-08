import { useEffect, useState } from "react";
import API from "../api/api";
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const AdminDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [sports, setSports] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    base_price: "",
    image: "",
    position: "batsman",
    sport_id: ""
  });
  
  // Add form state
  const [addForm, setAddForm] = useState({
    name: "",
    base_price: "",
    image: "",
    position: "batsman",
    sport_id: "",
    team: ""
  });

  const fetchPlayers = async () => {
    try {
      const res = await API.get("/players");
      setPlayers(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSports = async () => {
    try {
      const res = await API.get("/sports");
      setSports(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchPlayers(), fetchSports(), fetchTournaments()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // DELETE ALL PLAYERS
  const handleDeleteAll = async () => {
    if (window.confirm(`⚠️ WARNING: This will delete ALL ${players.length} players. This action cannot be undone! Are you sure?`)) {
      try {
        await API.delete("/players/all");
        alert("All players deleted successfully!");
        fetchPlayers();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "Failed to delete all players");
      }
    }
  };

  // DELETE SINGLE PLAYER
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await API.delete(`/players/${id}`);
        alert("Player deleted successfully!");
        fetchPlayers();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "Failed to delete player");
      }
    }
  };

  // OPEN EDIT MODAL
  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      base_price: player.base_price,
      image: player.image || "",
      position: player.position || "batsman",
      sport_id: player.sport_id || ""
    });
    setIsEditModalOpen(true);
  };

  // UPDATE PLAYER
  const handleUpdate = async () => {
    if (!editForm.name || !editForm.base_price) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await API.put(`/players/${editingPlayer.id}`, editForm);
      alert("Player updated successfully!");
      setIsEditModalOpen(false);
      setEditingPlayer(null);
      fetchPlayers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to update player");
    }
  };

  // ADD SINGLE PLAYER
  const handleAddPlayer = async () => {
    if (!addForm.name || !addForm.base_price || !addForm.sport_id) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await API.post("/players", addForm);
      alert("Player added successfully!");
      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        base_price: "",
        image: "",
        position: "batsman",
        sport_id: "",
        team: ""
      });
      fetchPlayers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to add player");
    }
  };

  // HANDLE EXCEL/UPLOAD
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Map Excel columns to player object
      const mappedData = jsonData.map((row) => ({
      name: row.Name || row.name || row.PLAYER_NAME || "",

      image:
        row.Image ||
        row.image ||
        row.IMAGE_URL ||
        "",

      gender:
        row.Gender ||
        row.gender ||
        row.GENDER ||
        "m",

      position:
        row.Position ||
        row.position ||
        row.ROLE ||
        "Batsman",

      sport:
        row.Sport ||
        row.sport ||
        row.SPORT ||
        "Cricket",

      base_price: Number(
        row.BasePrice ||
        row.base_price ||
        row.PRICE ||
        row.Base_Price ||
        0
      )

    })).filter((p) => p.name);
      
      setUploadData(mappedData);
      setUploadPreview(mappedData.slice(0, 10));
    };
    reader.readAsArrayBuffer(file);
  };

  // BULK UPLOAD PLAYERS
  const handleBulkUpload = async () => {
    if (uploadData.length === 0) {
      alert("No data to upload. Please select a valid Excel/CSV file.");
      return;
    }

    if (window.confirm(`This will add ${uploadData.length} players to the database. Continue?`)) {
      try {
        const response = await API.post("/players/bulk", { players: uploadData });
        alert(`Successfully added ${response.data.count} players!`);
        setIsUploadModalOpen(false);
        setUploadData([]);
        setUploadPreview([]);
        fetchPlayers();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.msg || "Failed to upload players");
      }
    }
  };

  // DOWNLOAD SAMPLE EXCEL
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        Name: "Virat Kohli",
        Team: "Royal Challengers",
        BasePrice: 2000000,
        position: "batsman",
        SportId: "sport_cricket_id",
        Image: "https://example.com/virat.jpg"
      },
      {
        Name: "Jasprit Bumrah",
        Team: "Mumbai Indians",
        BasePrice: 1500000,
        position: "bowler",
        SportId: "sport_cricket_id",
        Image: ""
      },
      {
        Name: "MS Dhoni",
        Team: "Chennai Super Kings",
        BasePrice: 1800000,
        position: "wicketkeeper",
        SportId: "sport_cricket_id",
        Image: ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Players");
    XLSX.writeFile(wb, "sample_players_template.xlsx");
  };

  // Dashboard Statistics
  const totalPlayers = players.length;
  const totalSports = sports.length;
  const completedTournaments = tournaments.filter(t => t.status === "completed").length;
  const ongoingTournaments = tournaments.filter(t => t.status === "ongoing").length;
  
  // Sports wise players count for chart
  const sportsWiseData = sports.map(sport => ({
    name: sport.name,
    players: players.filter(p => p.sport_id === sport.id).length,
    color: sport.color || "#a855f7"
  }));

  // position wise distribution
  const positionData = [
    { name: "Batsman", value: players.filter(p => p.position === "Batsman").length, color: "#c084fc" },
    { name: "Bowler", value: players.filter(p => p.position === "Bowler").length, color: "#7e22ce" },
    { name: "Wicketkeeper", value: players.filter(p => p.position === "Wicketkeeper").length, color: "#d8b4fe" },
    { name: "Allrounder", value: players.filter(p => p.position === "Allrounder").length, color: "#a855f7" }
  ];

  // Tournament data
  const tournamentData = [
    { name: "Completed", value: completedTournaments, color: "#10b981" },
    { name: "Ongoing", value: ongoingTournaments, color: "#f59e0b" },
    { name: "Upcoming", value: tournaments.length - completedTournaments - ongoingTournaments, color: "#6366f1" }
  ];

  // Price range distribution
  const priceRanges = [
    { range: "Under ₹1L", count: players.filter(p => p.base_price < 100000).length },
    { range: "₹1L - ₹5L", count: players.filter(p => p.base_price >= 100000 && p.base_price < 500000).length },
    { range: "₹5L - ₹10L", count: players.filter(p => p.base_price >= 500000 && p.base_price < 1000000).length },
    { range: "₹10L+", count: players.filter(p => p.base_price >= 1000000).length }
  ];

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white flex">

      {/* SIDEBAR */}
      <div className="w-64 bg-black/40 backdrop-blur-xl border-r border-purple-800 p-5 fixed h-full overflow-y-auto">
        <h1 className="text-2xl font-bold text-purple-400 mb-8 flex items-center gap-2">
          <i className="fas fa-crown"></i>
          Auction Admin
        </h1>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
              activeTab === "dashboard" 
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600" 
                : "hover:bg-purple-700/20"
            }`}
          >
            <i className="fas fa-chart-line"></i>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("players")}
            className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
              activeTab === "players" 
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600" 
                : "hover:bg-purple-700/20"
            }`}
          >
            <i className="fas fa-users"></i>
            <span>Players Management</span>
          </button>
          
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
              activeTab === "tournaments" 
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600" 
                : "hover:bg-purple-700/20"
            }`}
          >
            <i className="fas fa-trophy"></i>
            <span>Tournaments</span>
          </button>
        </nav>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 ml-64 p-6">
        
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
                <i className="fas fa-chart-pie"></i>
                Dashboard Overview
              </h2>
              <div className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-black/40 border border-purple-800 p-5 rounded-xl hover:scale-105 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm">Total Players</h3>
                    <p className="text-3xl font-bold text-purple-400">{totalPlayers}</p>
                  </div>
                  <i className="fas fa-users text-4xl text-purple-500 opacity-50"></i>
                </div>
              </div>

              <div className="bg-black/40 border border-purple-800 p-5 rounded-xl hover:scale-105 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm">Total Sports</h3>
                    <p className="text-3xl font-bold text-purple-400">{totalSports}</p>
                  </div>
                  <i className="fas fa-futbol text-4xl text-purple-500 opacity-50"></i>
                </div>
              </div>

              <div className="bg-black/40 border border-purple-800 p-5 rounded-xl hover:scale-105 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm">Completed Tournaments</h3>
                    <p className="text-3xl font-bold text-green-400">{completedTournaments}</p>
                  </div>
                  <i className="fas fa-check-circle text-4xl text-green-500 opacity-50"></i>
                </div>
              </div>

              <div className="bg-black/40 border border-purple-800 p-5 rounded-xl hover:scale-105 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-400 text-sm">Active Tournaments</h3>
                    <p className="text-3xl font-bold text-yellow-400">{ongoingTournaments}</p>
                  </div>
                  <i className="fas fa-play-circle text-4xl text-yellow-500 opacity-50"></i>
                </div>
              </div>
            </div>

            {/* CHARTS - same as before */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-black/40 border border-purple-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-bar"></i>
                  Sports Wise Players Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sportsWiseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#c084fc" />
                    <YAxis stroke="#c084fc" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a0a2e', borderColor: '#a855f7' }} />
                    <Bar dataKey="players" fill="#a855f7" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-black/40 border border-purple-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-pie"></i>
                  position Wise Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={positionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {positionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-black/40 border border-purple-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-area"></i>
                  Tournament Status
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tournamentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#c084fc" />
                    <YAxis stroke="#c084fc" />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#7e22ce" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-black/40 border border-purple-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-line"></i>
                  Price Range Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceRanges} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#c084fc" />
                    <YAxis dataKey="range" type="position" stroke="#c084fc" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#c084fc" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/40 border border-purple-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <i className="fas fa-clock"></i>
                Recent Players Added
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-purple-800">
                    <tr>
                      <th className="pb-3 text-purple-300">Player</th>
                      <th className="pb-3 text-purple-300">position</th>
                      <th className="pb-3 text-purple-300">Base Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.slice(0, 5).map((player) => (
                      <tr key={player.id} className="border-b border-purple-800/50">
                        <td className="py-3">{player.name}</td>
                        <td className="py-3 capitalize">{player.position}</td>
                        <td className="py-3 text-yellow-400">₹{Number(player.base_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PLAYERS MANAGEMENT TAB */}
        {activeTab === "players" && (
          <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
                <i className="fas fa-users"></i>
                Players Management
              </h2>

              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search players..."
                  className="px-4 py-2 rounded-lg bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <i className="fas fa-file-excel"></i>
                  Excel Upload
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-5 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <i className="fas fa-plus"></i>
                  Add Player
                </button>
                {players.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <i className="fas fa-trash-alt"></i>
                    Delete All
                  </button>
                )}
              </div>
            </div>

            {/* STATS CARDS for Players Tab */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-black/40 border border-purple-800 p-4 rounded-xl">
                <h3 className="text-gray-400 text-sm">Total Players</h3>
                <p className="text-2xl font-bold text-purple-400">{players.length}</p>
              </div>
              <div className="bg-black/40 border border-purple-800 p-4 rounded-xl">
                <h3 className="text-gray-400 text-sm">Batsmen</h3>
                <p className="text-2xl font-bold text-purple-400">{players.filter(p => p.position === "Batsman").length}</p>
              </div>
              <div className="bg-black/40 border border-purple-800 p-4 rounded-xl">
                <h3 className="text-gray-400 text-sm">Bowlers</h3>
                <p className="text-2xl font-bold text-purple-400">{players.filter(p => p.position === "Bowler").length}</p>
              </div>
              <div className="bg-black/40 border border-purple-800 p-4 rounded-xl">
                <h3 className="text-gray-400 text-sm">Wicketkeepers</h3>
                <p className="text-2xl font-bold text-purple-400">{players.filter(p => p.position === "Wicketkeeper").length}</p>
              </div>
              <div className="bg-black/40 border border-purple-800 p-4 rounded-xl">
                <h3 className="text-gray-400 text-sm">All-Rounders</h3>
                <p className="text-2xl font-bold text-purple-400">{players.filter(p => p.position === "Allrounder").length}</p>
              </div>
            </div>

            {/* PLAYERS GRID */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="bg-black/40 border border-purple-800 rounded-xl p-4 hover:scale-105 transition duration-200"
                  >
                    {/* IMAGE */}
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 bg-purple-900/30 rounded-lg mb-3 flex items-center justify-center">
                        <i className="fas fa-user fa-3x text-purple-500"></i>
                      </div>
                    )}

                    {/* INFO */}
                    <h4 className="text-lg font-bold text-purple-300">{p.name}</h4>
                    <p className="text-sm text-gray-400">
                      <i className="fas fa-tag mr-1"></i>
                      position: <span className="capitalize">{p.position || "N/A"}</span>
                    </p>
                    <p className="text-sm text-yellow-400 font-semibold mt-2">
                      <i className="fas fa-rupee-sign mr-1"></i>
                      {Number(p.base_price).toLocaleString()}
                    </p>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="flex-1 bg-purple-700 hover:bg-purple-600 text-sm py-2 rounded transition flex items-center justify-center gap-1"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-sm py-2 rounded transition flex items-center justify-center gap-1"
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredPlayers.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-search fa-4x text-purple-500 mb-4"></i>
                <p className="text-gray-400">No players found matching "{search}"</p>
              </div>
            )}
          </div>
        )}

        {/* TOURNAMENTS TAB */}
        {activeTab === "tournaments" && (
          <div>
            <h2 className="text-2xl font-bold text-purple-300 mb-6 flex items-center gap-2">
              <i className="fas fa-trophy"></i>
              Tournaments Management
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-black/40 border border-purple-800 rounded-xl p-6 text-center">
                <i className="fas fa-check-circle text-green-400 text-4xl mb-3"></i>
                <h3 className="text-2xl font-bold text-green-400">{completedTournaments}</h3>
                <p className="text-gray-400">Completed Tournaments</p>
              </div>
              <div className="bg-black/40 border border-purple-800 rounded-xl p-6 text-center">
                <i className="fas fa-play-circle text-yellow-400 text-4xl mb-3"></i>
                <h3 className="text-2xl font-bold text-yellow-400">{ongoingTournaments}</h3>
                <p className="text-gray-400">Ongoing Tournaments</p>
              </div>
              <div className="bg-black/40 border border-purple-800 rounded-xl p-6 text-center">
                <i className="fas fa-clock text-blue-400 text-4xl mb-3"></i>
                <h3 className="text-2xl font-bold text-blue-400">{tournaments.length - completedTournaments - ongoingTournaments}</h3>
                <p className="text-gray-400">Upcoming Tournaments</p>
              </div>
            </div>

            <div className="bg-black/40 border border-purple-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Tournament List</h3>
              <div className="space-y-3">
                {tournaments.map(tournament => (
                  <div key={tournament.id} className="flex justify-between items-center p-4 bg-purple-900/20 rounded-lg border border-purple-800">
                    <div>
                      <h4 className="font-semibold">{tournament.name}</h4>
                      <p className="text-sm text-gray-400">{tournament.date} • {tournament.sport_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tournament.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      tournament.status === 'ongoing' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXCEL UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-2xl w-full max-w-4xl border border-purple-500 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-purple-800">
              <h3 className="text-xl font-bold text-purple-300">
                <i className="fas fa-file-excel mr-2 text-green-400"></i>
                Bulk Upload Players (Excel/CSV)
              </h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadData([]);
                  setUploadPreview([]);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Instructions */}
              <div className="bg-purple-900/30 rounded-lg p-4 mb-6 border border-purple-700">
                <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  Instructions:
                </h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-6 list-disc">
                  <li>Supported formats: .xlsx, .xls, .csv</li>
                  <li>Required columns: Name, BasePrice, position, SportId</li>
                  <li>Optional columns: Team, Image</li>
                  <li>position values: batsman, bowler, wicketkeeper, allrounder</li>
                </ul>
                <button
                  onClick={downloadSampleExcel}
                  className="mt-3 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <i className="fas fa-download"></i>
                  Download Sample Excel Template
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-purple-500 rounded-lg p-8 text-center mb-6">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excelUpload"
                />
                <label
                  htmlFor="excelUpload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <i className="fas fa-cloud-upload-alt text-5xl text-purple-400"></i>
                  <span className="text-purple-300">Click or drag file to upload</span>
                  <span className="text-xs text-gray-500">.xlsx, .xls, .csv files only</span>
                </label>
              </div>

              {/* Preview Section */}
              {uploadPreview.length > 0 && (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold text-purple-300 mb-2">
                      Preview ({uploadPreview.length} of {uploadData.length} records)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-purple-900/30">
                          <tr>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Team</th>
                            <th className="p-2 text-left">Base Price</th>
                            <th className="p-2 text-left">position</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadPreview.map((item, idx) => (
                            <tr key={idx} className="border-b border-purple-800/50">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2">{item.team || "-"}</td>
                              <td className="p-2">₹{Number(item.base_price).toLocaleString()}</td>
                              <td className="p-2 capitalize">{item.position}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBulkUpload}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-upload"></i>
                      Upload {uploadData.length} Players
                    </button>
                    <button
                      onClick={() => {
                        setUploadData([]);
                        setUploadPreview([]);
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold transition"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-2xl w-full max-w-md border border-purple-500 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-purple-800">
              <h3 className="text-xl font-bold text-purple-300">
                <i className="fas fa-edit mr-2"></i>
                Edit Player
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-purple-300 mb-1">Player Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">position</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                >
                  <option value="batsman">🏏 Batsman</option>
                  <option value="bowler">🎯 Bowler</option>
                  <option value="wicketkeeper">🥅 Wicketkeeper</option>
                  <option value="allrounder">⭐ All-Rounder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Sport</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={editForm.sport_id}
                  onChange={(e) => setEditForm({ ...editForm, sport_id: e.target.value })}
                >
                  <option value="">Select Sport</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>{sport.icon} {sport.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={editForm.base_price}
                  onChange={(e) => setEditForm({ ...editForm, base_price: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Image URL</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-purple-800">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-2 rounded-lg font-semibold transition"
              >
                <i className="fas fa-save mr-2"></i>
                Update Player
              </button>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold transition"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PLAYER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-black rounded-2xl w-full max-w-md border border-purple-500 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-purple-800">
              <h3 className="text-xl font-bold text-purple-300">
                <i className="fas fa-user-plus mr-2"></i>
                Add New Player
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-purple-300 mb-1">Player Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Team</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={addForm.team}
                  onChange={(e) => setAddForm({ ...addForm, team: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">position</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={addForm.position}
                  onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                >
                  <option value="batsman">🏏 Batsman</option>
                  <option value="bowler">🎯 Bowler</option>
                  <option value="wicketkeeper">🥅 Wicketkeeper</option>
                  <option value="allrounder">⭐ All-Rounder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Sport *</label>
                <select
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={addForm.sport_id}
                  onChange={(e) => setAddForm({ ...addForm, sport_id: e.target.value })}
                >
                  <option value="">Select Sport</option>
                  {sports.map(sport => (
                    <option key={sport.id} value={sport.id}>{sport.icon} {sport.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={addForm.base_price}
                  onChange={(e) => setAddForm({ ...addForm, base_price: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-purple-300 mb-1">Image URL</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  value={addForm.image}
                  onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-purple-800">
              <button
                onClick={handleAddPlayer}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-2 rounded-lg font-semibold transition"
              >
                <i className="fas fa-save mr-2"></i>
                Add Player
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold transition"
              >
                <i className="fas fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;