import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, LogIn, Crown, Play, Eye, EyeOff, RotateCcw, Share2 } from 'lucide-react';

const defaultWordSets = {
  حيوانات: [
    { main: 'أسد', impostor: 'نمر' },
    { main: 'فيل', impostor: 'وحيد القرن' },
    { main: 'دولفين', impostor: 'حوت' },
    { main: 'نسر', impostor: 'صقر' },
    { main: 'فراشة', impostor: 'نحلة' }
  ],
  أكل: [
    { main: 'بيتزا', impostor: 'باستا' },
    { main: 'برجر', impostor: 'شاورما' },
    { main: 'كبسة', impostor: 'مندي' },
    { main: 'كنافة', impostor: 'بسبوسة' },
    { main: 'قهوة', impostor: 'شاي' }
  ],
  أماكن: [
    { main: 'شاطئ', impostor: 'صحراء' },
    { main: 'مطار', impostor: 'محطة قطار' },
    { main: 'مدرسة', impostor: 'جامعة' },
    { main: 'سوق', impostor: 'مول' },
    { main: 'حديقة', impostor: 'منتزه' }
  ],
  وظائف: [
    { main: 'طبيب', impostor: 'ممرض' },
    { main: 'مهندس', impostor: 'معمار' },
    { main: 'معلم', impostor: 'أستاذ' },
    { main: 'طباخ', impostor: 'خباز' },
    { main: 'سائق', impostor: 'كابتن' }
  ]
};

export default function WhoIsOutMultiplayer() {
  const [screen, setScreen] = useState('home'); // home, lobby, waiting, reveal, play, vote, result
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [showWord, setShowWord] = useState(false);
  const [myWord, setMyWord] = useState('');
  const [isImpostor, setIsImpostor] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('حيوانات');
  const [loading, setLoading] = useState(false);

  // Poll for room updates
  useEffect(() => {
    if (roomCode && screen !== 'home') {
      const interval = setInterval(async () => {
        await loadRoomData();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [roomCode, screen]);

  const loadRoomData = async () => {
    try {
      const result = await window.storage.get(`room:${roomCode}`, true);
      if (result && result.value) {
        const data = JSON.parse(result.value);
        setRoomData(data);
        
        // Update screen based on room state
        if (data.state === 'playing' && screen === 'lobby') {
          setScreen('waiting');
        } else if (data.state === 'voting' && screen === 'waiting') {
          setScreen('vote');
        } else if (data.state === 'finished' && screen === 'vote') {
          setScreen('result');
        }
      }
    } catch (error) {
      console.log('Room not found or error loading:', error);
    }
  };

  const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      alert('الرجاء إدخال اسمك');
      return;
    }

    setLoading(true);
    console.log('Creating room...');

    const code = generateRoomCode();
    const newPlayerId = Date.now().toString();
    
    const room = {
      code: code,
      host: newPlayerId,
      players: [{
        id: newPlayerId,
        name: playerName.trim(),
        ready: false
      }],
      state: 'lobby',
      category: selectedCategory,
      gameData: null,
      votes: {}
    };

    try {
      // Check if window.storage is available
      if (!window.storage) {
        console.error('window.storage is not available');
        alert('عذراً، التخزين المشترك غير متاح في هذا المتصفح.\n\nجرب فتح اللعبة من claude.ai');
        setLoading(false);
        return;
      }
      
      console.log('Saving room to storage...', code);
      const result = await window.storage.set(`room:${code}`, JSON.stringify(room), true);
      console.log('Storage result:', result);
      
      if (!result) {
        throw new Error('Failed to create room');
      }
      
      console.log('Room created successfully!');
      setRoomCode(code);
      setPlayerId(newPlayerId);
      setIsHost(true);
      setRoomData(room);
      setScreen('lobby');
    } catch (error) {
      console.error('Error creating room:', error);
      alert('حدث خطأ في إنشاء الغرفة:\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !joinCode.trim()) {
      alert('الرجاء إدخال اسمك وكود الغرفة');
      return;
    }

    setLoading(true);
    console.log('Joining room:', joinCode);

    try {
      if (!window.storage) {
        console.error('window.storage is not available');
        alert('عذراً، التخزين المشترك غير متاح في هذا المتصفح.\n\nجرب فتح اللعبة من claude.ai');
        setLoading(false);
        return;
      }

      const result = await window.storage.get(`room:${joinCode}`, true);
      console.log('Room data:', result);
      
      if (!result || !result.value) {
        alert('الغرفة غير موجودة!');
        setLoading(false);
        return;
      }

      const room = JSON.parse(result.value);
      const newPlayerId = Date.now().toString();
      
      // Check if name already exists
      if (room.players.some(p => p.name === playerName.trim())) {
        alert('هذا الاسم موجود بالفعل في الغرفة!');
        setLoading(false);
        return;
      }

      room.players.push({
        id: newPlayerId,
        name: playerName.trim(),
        ready: false
      });

      await window.storage.set(`room:${joinCode}`, JSON.stringify(room), true);
      
      setRoomCode(joinCode);
      setPlayerId(newPlayerId);
      setIsHost(false);
      setRoomData(room);
      setScreen('lobby');
    } catch (error) {
      console.error('Error joining room:', error);
      alert('حدث خطأ في الانضمام للغرفة:\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!roomData || roomData.players.length < 3) {
      alert('تحتاج على الأقل 3 لاعبين للبدء!');
      return;
    }

    const categoryWords = defaultWordSets[roomData.category];
    const randomWords = categoryWords[Math.floor(Math.random() * categoryWords.length)];
    
    // Assign words to players
    const impostorIndex = Math.floor(Math.random() * roomData.players.length);
    const gameData = {
      mainWord: randomWords.main,
      impostorWord: randomWords.impostor,
      impostorId: roomData.players[impostorIndex].id,
      playerWords: {}
    };

    roomData.players.forEach((player, idx) => {
      gameData.playerWords[player.id] = {
        word: idx === impostorIndex ? randomWords.impostor : randomWords.main,
        isImpostor: idx === impostorIndex
      };
    });

    roomData.state = 'playing';
    roomData.gameData = gameData;

    await window.storage.set(`room:${roomCode}`, JSON.stringify(roomData), true);
    setRoomData(roomData);
    setScreen('waiting');
  };

  const revealMyWord = () => {
    if (roomData && roomData.gameData) {
      const wordData = roomData.gameData.playerWords[playerId];
      setMyWord(wordData.word);
      setIsImpostor(wordData.isImpostor);
      setShowWord(true);
    }
  };

  const startVoting = async () => {
    roomData.state = 'voting';
    await window.storage.set(`room:${roomCode}`, JSON.stringify(roomData), true);
    setScreen('vote');
  };

  const vote = async (votedPlayerId) => {
    if (hasVoted) return;

    roomData.votes[playerId] = votedPlayerId;
    await window.storage.set(`room:${roomCode}`, JSON.stringify(roomData), true);
    setHasVoted(true);

    // Check if all voted
    if (Object.keys(roomData.votes).length === roomData.players.length) {
      roomData.state = 'finished';
      await window.storage.set(`room:${roomCode}`, JSON.stringify(roomData), true);
    }
  };

  const resetGame = async () => {
    roomData.state = 'lobby';
    roomData.gameData = null;
    roomData.votes = {};
    roomData.players.forEach(p => p.ready = false);
    
    await window.storage.set(`room:${roomCode}`, JSON.stringify(roomData), true);
    setRoomData(roomData);
    setScreen('lobby');
    setShowWord(false);
    setHasVoted(false);
    setMyWord('');
  };

  const leaveRoom = async () => {
    if (isHost) {
      // Delete room if host leaves
      try {
        await window.storage.delete(`room:${roomCode}`, true);
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    } else {
      // Remove player from room
      try {
        const result = await window.storage.get(`room:${roomCode}`, true);
        if (result && result.value) {
          const room = JSON.parse(result.value);
          room.players = room.players.filter(p => p.id !== playerId);
          await window.storage.set(`room:${roomCode}`, JSON.stringify(room), true);
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    
    setScreen('home');
    setRoomCode('');
    setPlayerId('');
    setIsHost(false);
    setRoomData(null);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = async () => {
    const text = `انضم لغرفتي في لعبة "مين برا السالفة"!\nكود الغرفة: ${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (error) {
        copyRoomCode();
      }
    } else {
      copyRoomCode();
    }
  };

  // Calculate vote results
  const getVoteResults = () => {
    if (!roomData || !roomData.votes) return null;
    
    const voteCount = {};
    Object.values(roomData.votes).forEach(vote => {
      voteCount[vote] = (voteCount[vote] || 0) + 1;
    });

    const mostVoted = Object.keys(voteCount).reduce((a, b) => 
      voteCount[a] > voteCount[b] ? a : b, 
      Object.keys(voteCount)[0]
    );

    const impostorCaught = mostVoted === roomData.gameData?.impostorId;

    return { voteCount, mostVoted, impostorCaught };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4 font-['Tajawal',sans-serif]" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-in {
          animation: slideIn 0.5s ease-out;
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
        
        .bounce {
          animation: bounce 1s infinite;
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Home Screen */}
        {screen === 'home' && (
          <div className="animate-in bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">🎭</div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                مين برا السالفة؟
              </h1>
              <p className="text-xl text-gray-600">
                العب مع أصدقائك من أي مكان!
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <input
                type="text"
                placeholder="اسمك"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                className="w-full text-2xl font-bold text-center bg-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-purple-300"
              />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-700 mb-3 text-center">اختر الفئة:</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(defaultWordSets).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-3 px-4 rounded-xl font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={createRoom}
                disabled={loading || !playerName.trim()}
                className={`w-full text-2xl font-black py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                  loading || !playerName.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-105'
                }`}
              >
                <Users size={28} />
                {loading ? 'جاري الإنشاء...' : 'إنشاء غرفة جديدة'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-gray-500 font-bold">أو</span>
                </div>
              </div>

              <input
                type="text"
                placeholder="كود الغرفة (4 أرقام)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full text-2xl font-bold text-center bg-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-pink-300"
              />

              <button
                onClick={joinRoom}
                disabled={loading || !playerName.trim() || !joinCode.trim()}
                className={`w-full text-2xl font-black py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                  loading || !playerName.trim() || !joinCode.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-600 to-red-600 text-white hover:shadow-2xl hover:scale-105'
                }`}
              >
                <LogIn size={28} />
                {loading ? 'جاري الانضمام...' : 'انضم للغرفة'}
              </button>
            </div>
          </div>
        )}

        {/* Lobby Screen */}
        {screen === 'lobby' && roomData && (
          <div className="animate-in bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl mb-4">
                <div className="text-sm opacity-90 mb-1">كود الغرفة</div>
                <div className="text-5xl font-black tracking-wider">{roomCode}</div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={copyRoomCode}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  {copied ? 'تم النسخ!' : 'نسخ'}
                </button>
                <button
                  onClick={shareRoom}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <Share2 size={20} />
                  مشاركة
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-6">
              <p className="text-center text-lg font-bold text-gray-700">
                الفئة: <span className="text-purple-600">{roomData.category}</span>
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-800 mb-4 text-center">
                اللاعبين ({roomData.players.length})
              </h3>
              <div className="space-y-3">
                {roomData.players.map(player => (
                  <div
                    key={player.id}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">👤</div>
                      <span className="text-xl font-bold text-gray-800">{player.name}</span>
                    </div>
                    {player.id === roomData.host && (
                      <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg font-bold text-sm">
                        <Crown size={16} />
                        مضيف
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {roomData.players.length < 3 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mb-6 text-center">
                <p className="text-yellow-800 font-bold">
                  ⚠️ تحتاج على الأقل 3 لاعبين للبدء
                </p>
              </div>
            )}

            <div className="space-y-3">
              {isHost && (
                <button
                  onClick={startGame}
                  disabled={roomData.players.length < 3}
                  className={`w-full text-2xl font-black py-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                    roomData.players.length >= 3
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Play size={28} />
                  ابدأ اللعبة
                </button>
              )}
              
              <button
                onClick={leaveRoom}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-xl font-bold py-4 rounded-2xl transition-all"
              >
                مغادرة الغرفة
              </button>
            </div>
          </div>
        )}

        {/* Waiting/Reveal Screen */}
        {screen === 'waiting' && roomData && (
          <div className="animate-in bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            <h2 className="text-4xl font-black text-gray-800 mb-6">
              جاهز تشوف كلمتك؟
            </h2>

            {!showWord ? (
              <div>
                <div className="text-7xl mb-8 bounce">🎴</div>
                <button
                  onClick={revealMyWord}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-black py-6 px-12 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  <Eye size={28} />
                  اكشف كلمتي
                </button>
              </div>
            ) : (
              <div>
                <div className="pulse bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-3xl p-12 mb-8 shadow-2xl">
                  <p className="text-2xl mb-4 opacity-90">كلمتك هي:</p>
                  <p className="text-6xl font-black">{myWord}</p>
                  {isImpostor && (
                    <div className="mt-6 bg-red-600 rounded-xl p-4">
                      <p className="text-2xl font-bold">🎭 أنت المتطفل!</p>
                    </div>
                  )}
                </div>

                <div className="bg-amber-100 rounded-2xl p-6 mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    💡 تكلم عن كلمتك بدون ما تقولها مباشرة!
                  </p>
                </div>

                {isHost && (
                  <button
                    onClick={startVoting}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-2xl font-black py-6 px-12 rounded-2xl shadow-xl hover:scale-105 transition-all mx-auto"
                  >
                    ابدأ التصويت
                  </button>
                )}

                {!isHost && (
                  <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4">
                    <p className="text-blue-800 font-bold">
                      انتظر المضيف ليبدأ التصويت...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vote Screen */}
        {screen === 'vote' && roomData && (
          <div className="animate-in bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <h2 className="text-4xl font-black text-gray-800 mb-6 text-center">
              من تعتقد برا السالفة؟
            </h2>

            {!hasVoted ? (
              <div className="grid grid-cols-2 gap-4">
                {roomData.players.map(player => (
                  player.id !== playerId && (
                    <button
                      key={player.id}
                      onClick={() => vote(player.id)}
                      className="bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-3 border-orange-300 rounded-2xl p-6 text-center shadow-lg hover:scale-105 transition-all"
                    >
                      <div className="text-4xl mb-3">👤</div>
                      <p className="text-xl font-bold text-gray-800">{player.name}</p>
                    </button>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-7xl mb-6">✅</div>
                <p className="text-2xl font-bold text-gray-700 mb-4">تم تسجيل صوتك!</p>
                <div className="bg-blue-100 rounded-2xl p-6">
                  <p className="text-lg text-gray-700">
                    في انتظار باقي اللاعبين...
                  </p>
                  <p className="text-3xl font-black text-blue-600 mt-4">
                    {Object.keys(roomData.votes).length} / {roomData.players.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result Screen */}
        {screen === 'result' && roomData && (() => {
          const results = getVoteResults();
          const impostorPlayer = roomData.players.find(p => p.id === roomData.gameData?.impostorId);
          const mostVotedPlayer = roomData.players.find(p => p.id === results?.mostVoted);

          return (
            <div className="animate-in bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
              <div className="text-8xl mb-6">
                {results?.impostorCaught ? '🎉' : '😱'}
              </div>
              
              <h2 className="text-5xl font-black mb-6">
                {results?.impostorCaught ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                    مبروك! اكتشفتوا المتطفل!
                  </span>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                    المتطفل فاز!
                  </span>
                )}
              </h2>

              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
                <p className="text-2xl mb-4">المتطفل كان:</p>
                <p className="text-5xl font-black mb-4">{impostorPlayer?.name} 🎭</p>
                <div className="bg-white/20 rounded-2xl p-4 backdrop-blur">
                  <p className="text-xl mb-2">الكلمة الأساسية: <strong>{roomData.gameData?.mainWord}</strong></p>
                  <p className="text-xl">كلمة المتطفل: <strong>{roomData.gameData?.impostorWord}</strong></p>
                </div>
              </div>

              <div className="bg-gray-100 rounded-2xl p-6 mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 نتائج التصويت</h3>
                <div className="space-y-3">
                  {Object.entries(results?.voteCount || {}).map(([playerId, count]) => {
                    const player = roomData.players.find(p => p.id === playerId);
                    return (
                      <div key={playerId} className="flex items-center justify-between bg-white rounded-xl p-4 shadow">
                        <span className="text-lg font-bold">
                          {player?.name}
                          {playerId === roomData.gameData?.impostorId && ' 🎭'}
                        </span>
                        <span className="text-2xl font-black text-orange-600">{count} أصوات</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isHost && (
                <button
                  onClick={resetGame}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-black py-6 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto"
                >
                  <RotateCcw size={28} />
                  العب مرة ثانية
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}