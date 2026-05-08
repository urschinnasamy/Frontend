import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

const TournamentCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    sport: "Cricket",
    auction_date: "",
    max_teams: 2,
    purse_amount: 100, // TOTAL budget for tournament
    description: "",
    tournament_logo: "",
    is_private: false,
    invite_code: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.purse_amount <= 0) {
      alert("Purse amount must be greater than 0");
      return;
    }

    if (formData.max_teams <= 1) {
      alert("Max teams must be at least 2");
      return;
    }

    // Calculate per team budget
    const perTeamBudget = formData.purse_amount / formData.max_teams;
    
    const confirmMessage = `
🏆 Tournament Details:
━━━━━━━━━━━━━━━━━━━━━━━
📛 Name: ${formData.name}
👥 Max Teams: ${formData.max_teams}
💰 Total Budget: ₹${formData.purse_amount}
💵 Per Team Budget: ₹${perTeamBudget}
⚽ Sport: ${formData.sport}
📅 Date: ${new Date(formData.auction_date).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━

Do you want to create this tournament?
    `;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        ...formData,
        created_by: user?.id || 2,
      };

      const res = await API.post("/tournaments", payload);

      alert(`✅ Tournament Created Successfully!\n\nEach team will get ₹${perTeamBudget} budget for auction.`);

      navigate(`/tournaments/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  const perTeamBudget = formData.purse_amount / formData.max_teams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Create Tournament
          </h1>
          <p className="text-gray-400 mt-2">
            Setup your sports auction tournament
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-black/40 backdrop-blur-xl border border-purple-700 rounded-3xl p-8 shadow-2xl">

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* TOURNAMENT NAME */}
            <div>
              <label className="block mb-2 text-purple-300 font-medium">
                Tournament Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="IPL Mock Auction 2026"
                required
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* SPORT */}
              <div>
                <label className="block mb-2 text-purple-300 font-medium">
                  Sport
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Cricket">🏏 Cricket</option>
                  <option value="Football">⚽ Football</option>
                  <option value="Basketball">🏀 Basketball</option>
                  <option value="Kabaddi">🛡️ Kabaddi</option>
                </select>
              </div>

              {/* AUCTION DATE */}
              <div>
                <label className="block mb-2 text-purple-300 font-medium">
                  Auction Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="auction_date"
                  value={formData.auction_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* MAX TEAMS */}
              <div>
                <label className="block mb-2 text-purple-300 font-medium">
                  Maximum Teams
                </label>
                <input
                  type="number"
                  name="max_teams"
                  value={formData.max_teams}
                  onChange={handleChange}
                  min="2"
                  max="20"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 2 teams</p>
              </div>

              {/* TOTAL PURSE AMOUNT */}
              <div>
                <label className="block mb-2 text-purple-300 font-medium">
                  Total Tournament Purse (₹)
                </label>
                <input
                  type="number"
                  name="purse_amount"
                  value={formData.purse_amount}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total budget that will be split among all teams
                </p>
              </div>
            </div>

            {/* BUDGET PREVIEW */}
            <div className="bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 rounded-2xl p-5 border border-purple-700">
              <h3 className="text-purple-300 font-semibold mb-3">💰 Budget Distribution Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Total Tournament Purse</p>
                  <p className="text-xl font-bold text-yellow-400">₹{formData.purse_amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Per Team Budget</p>
                  <p className="text-xl font-bold text-green-400">₹{perTeamBudget}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-700">
                <p className="text-sm text-gray-300">
                  When <span className="text-purple-400 font-semibold">{formData.max_teams}</span> teams join, 
                  each team will receive <span className="text-green-400 font-semibold">₹{perTeamBudget}</span> for auction.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: The purse amount will be split equally among all registered teams.
                </p>
              </div>
            </div>

            {/* TOURNAMENT LOGO */}
            <div>
              <label className="block mb-2 text-purple-300 font-medium">
                Tournament Logo URL (Optional)
              </label>
              <input
                type="text"
                name="tournament_logo"
                value={formData.tournament_logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block mb-2 text-purple-300 font-medium">
                Description (Optional)
              </label>
              <textarea
                rows="4"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter tournament details, rules, etc..."
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              ></textarea>
            </div>

            {/* PRIVATE TOURNAMENT */}
            <div className="bg-purple-900/20 border border-purple-700 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  name="is_private"
                  checked={formData.is_private}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-purple-500 focus:ring-purple-500"
                />
                <label className="text-purple-300 font-medium">
                  🔒 Make this a Private Tournament
                </label>
              </div>

              {formData.is_private && (
                <div>
                  <label className="block mb-2 text-purple-300 text-sm">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    name="invite_code"
                    value={formData.invite_code}
                    onChange={handleChange}
                    placeholder="Enter a secret code for invites"
                    required={formData.is_private}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trophy mr-2"></i>
                    Create Tournament
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-4 rounded-2xl border border-purple-700 hover:bg-purple-700/20 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TournamentCreate;