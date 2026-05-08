import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Sports disciplines data
  const sportsDisciplines = [
    {
      id: 1,
      name: "Cricket",
      icon: "fas fa-baseball-ball",
      description: "Strategic team sport with batting, bowling, and fielding roles",
      teamSize: "11 Players",
      keyRoles: "Batsmen, Bowlers, All-rounders",
      strategyFocus: "Balance & Specialization"
    },
    {
      id: 2,
      name: "Football",
      icon: "fas fa-futbol",
      description: "Dynamic game requiring coordinated team movement and positioning",
      teamSize: "11 Players",
      keyRoles: "Attack, Midfield, Defense, GK",
      strategyFocus: "Formation & Chemistry"
    },
    {
      id: 3,
      name: "Basketball",
      icon: "fas fa-basketball-ball",
      description: "Fast-paced sport emphasizing speed, shooting, and court coverage",
      teamSize: "5 Players",
      keyRoles: "Guards, Forwards, Center",
      strategyFocus: "Position Versatility"
    },
    {
      id: 4,
      name: "Kabaddi",
      icon: "fas fa-user-shield",
      description: "Traditional contact sport combining raiding and defensive tactics",
      teamSize: "7 Players",
      keyRoles: "Raiders, Defenders, All-rounders",
      strategyFocus: "Raid-Defense Balance"
    }
  ];

  // Auction strategies data
  const auctionStrategies = [
    {
      id: 1,
      name: "Balanced Budget",
      icon: "fas fa-balance-scale",
      tagline: "Equal distribution across all positions",
      keyPoints: [
        "Spread budget evenly",
        "Build consistent lineup",
        "Minimize weak spots",
        "Focus on team chemistry"
      ],
      riskLevel: "Low"
    },
    {
      id: 2,
      name: "Star & Scrub",
      icon: "fas fa-crown",
      tagline: "Invest heavily in elite players",
      keyPoints: [
        "Acquire 2-3 star players",
        "Fill with budget options",
        "Stars carry performance",
        "High risk, high reward"
      ],
      riskLevel: "High"
    },
    {
      id: 3,
      name: "Punt Strategy",
      icon: "fas fa-chart-line",
      tagline: "Focus on emerging talents",
      keyPoints: [
        "Identify undervalued players",
        "Invest in potential",
        "Long-term growth focus",
        "Patience required"
      ],
      riskLevel: "Medium"
    },
    {
      id: 4,
      name: "Piggy Bank",
      icon: "fas fa-piggy-bank",
      tagline: "Save budget for key moments",
      keyPoints: [
        "Conservative early bidding",
        "Save budget for targets",
        "Capitalize on opportunities",
        "Strategic late purchases"
      ],
      riskLevel: "Medium"
    }
  ];

  // Platform features data
  const platformFeatures = [
    {
      id: 1,
      title: "Custom Tournament Creation",
      icon: "fas fa-cogs",
      description: "Full control over rules, formats, and tournament parameters",
      benefit: "Complete customization"
    },
    {
      id: 2,
      title: "Real-time Auction System",
      icon: "fas fa-gavel",
      description: "Live bidding with instant updates and competitive dynamics",
      benefit: "Exciting bidding wars"
    },
    {
      id: 3,
      title: "Team Management Tools",
      icon: "fas fa-users-cog",
      description: "Comprehensive tools for roster management and strategy planning",
      benefit: "Strategic control"
    },
    {
      id: 4,
      title: "Performance Analytics",
      icon: "fas fa-chart-pie",
      description: "Detailed statistics and insights for informed decision making",
      benefit: "Data-driven decisions"
    },
    {
      id: 5,
      title: "Private & Public Options",
      icon: "fas fa-lock-open",
      description: "Choose between open tournaments or password-protected private events",
      benefit: "Flexible access control"
    },
    {
      id: 6,
      title: "Multi-sport Support",
      icon: "fas fa-running",
      description: "Support for various sports with specialized rules and formats",
      benefit: "Diverse competition"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#2a0a3e]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-2xl shadow-lg mb-6">
              <i className="fas fa-crown text-4xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-6">
              <span className="text-white">The Ultimate</span>
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent"> Sports Auction</span>
            </h1>
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Revolutionize team building through strategic auctions. Create, compete, and conquer 
              in the world's most exciting sports tournament platform.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => navigate('/auctionpage')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <i className="fas fa-gavel mr-2"></i>
                Start Auction
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-white/10 backdrop-blur-lg border border-purple-500/30 hover:border-purple-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Discipline Showcase */}
      <section className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <i className="fas fa-trophy mr-3 text-purple-400"></i>
              Sports Disciplines
            </h2>
            <p className="text-lg text-purple-200 max-w-3xl mx-auto">
              Master different sports formats and build championship-winning teams across various athletic disciplines
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sportsDisciplines.map((sport) => (
              <div key={sport.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group hover:scale-105">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${sport.icon} text-white text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{sport.name}</h3>
                  <p className="text-purple-200 text-sm mb-4">{sport.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-purple-300">
                      <span>Team Size:</span>
                      <span className="text-white">{sport.teamSize}</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Key Roles:</span>
                      <span className="text-white">{sport.keyRoles}</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Strategy:</span>
                      <span className="text-purple-400">{sport.strategyFocus}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auction Strategy Guide */}
      <section className="py-16 bg-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <i className="fas fa-brain mr-3 text-purple-400"></i>
              Auction Strategy Guide
            </h2>
            <p className="text-lg text-purple-200 max-w-3xl mx-auto">
              Master the art of team building with proven auction strategies and tactical approaches
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctionStrategies.map((strategy) => (
              <div key={strategy.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group hover:scale-105">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <i className={`${strategy.icon} text-white text-lg`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{strategy.name}</h3>
                  <p className="text-purple-200 text-sm">{strategy.tagline}</p>
                </div>
                
                <ul className="space-y-2 text-xs text-purple-200">
                  {strategy.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check text-purple-400 mr-2 mt-1"></i>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Risk Level:</span>
                    <span className={`font-semibold ${
                      strategy.riskLevel === 'Low' ? 'text-green-400' :
                      strategy.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {strategy.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <i className="fas fa-star mr-3 text-purple-400"></i>
              Platform Features
            </h2>
            <p className="text-lg text-purple-200">
              Everything you need to create and manage successful sports tournaments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformFeatures.map((feature) => (
              <div key={feature.id} className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group hover:scale-105">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <i className={`${feature.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-purple-200 text-sm">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-purple-400">
                  <i className="fas fa-bolt mr-2"></i>
                  <span>{feature.benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports Statistics */}
      <section className="py-16 bg-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <i className="fas fa-chart-bar mr-3 text-purple-400"></i>
              Platform Statistics
            </h2>
            <p className="text-lg text-purple-200">
              Join thousands of sports enthusiasts in the ultimate auction experience
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group">
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">8+</div>
              <div className="text-gray-300 text-sm">Sports Supported</div>
              <div className="text-xs text-purple-300 mt-2">From Cricket to Basketball</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group">
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">1K+</div>
              <div className="text-gray-300 text-sm">Tournaments Created</div>
              <div className="text-xs text-purple-300 mt-2">League & Knockout</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group">
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">95%</div>
              <div className="text-gray-300 text-sm">Success Rate</div>
              <div className="text-xs text-purple-300 mt-2">Tournaments Completed</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500 transition-all duration-300 group">
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">25K+</div>
              <div className="text-gray-300 text-sm">Active Users</div>
              <div className="text-xs text-purple-300 mt-2">Global Community</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 backdrop-blur-lg rounded-2xl p-12 border border-purple-500/30">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Auction Journey?
            </h2>
            <p className="text-lg text-purple-200 mb-8">
              Join thousands of users who are already building championship teams
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <i className="fas fa-rocket mr-2"></i>
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-lg border-t border-purple-500/20 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <i className="fas fa-crown text-2xl text-purple-400"></i>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Purple Sports
                </h3>
              </div>
              <p className="text-purple-200">
                The premier platform for sports player auctions worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-purple-200">
                <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">FAQ</a></li>
                <li><a href="/terms" className="hover:text-purple-400 transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Sports</h4>
              <ul className="space-y-2 text-purple-200">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Cricket</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Football</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Basketball</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Kabaddi</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-purple-200">
                <li className="hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-2">
                  <i className="fas fa-envelope"></i> support@purplesports.com
                </li>
                <li className="hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-2">
                  <i className="fas fa-phone"></i> +91 (978) 968-0237
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-500/20 mt-8 pt-8 text-center text-purple-300">
            <p>&copy; {new Date().getFullYear()} Purple Sports Auction. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;