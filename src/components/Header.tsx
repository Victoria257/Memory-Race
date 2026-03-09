import React from 'react';
import { useStore } from '../store';
import { Volume2, VolumeX, User, LogOut, Pause, Play } from 'lucide-react';

export const Header = () => {
  const { language, setLanguage, playerName, playerTokenColor, gameState, playerId, pauseGame, leaveRoom, isMuted, toggleMute } = useStore();
  const [showStats, setShowStats] = React.useState(false);
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);

  const tokenColors: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-400',
    black: 'bg-gray-900',
    red: 'bg-red-500',
    brown: 'bg-amber-800'
  };

  const handleConfirmLeave = () => {
    if (gameState) {
      leaveRoom();
    }
    localStorage.removeItem('playerId');
    window.location.reload();
  };

  const handlePause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pauseGame();
  };

  const handleExitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExitConfirm(true);
  };

  return (
    <header className="flex flex-col tablet:flex-row justify-between items-center p-3 tablet:p-4 bg-[#4D6D1A] text-white shadow-xl gap-3 border-b-4 border-[#7DA33C]/30">
      <div className="flex items-center justify-between w-full tablet:w-auto gap-4">
        <h1 className="text-xl tablet:text-2xl font-black whitespace-nowrap bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">Memory Race 🏎️</h1>
        {gameState && (
          <span className="bg-[#3A5214] border border-[#7DA33C]/30 px-3 py-1 rounded-full text-xs tablet:text-sm font-black">
            Код: <span className="font-mono text-yellow-300">{gameState.roomId}</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-center tablet:justify-end gap-2 tablet:gap-4 w-full tablet:w-auto">
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-[#3A5214] border border-[#7DA33C]/30 text-white rounded-full px-3 py-1 text-sm outline-none font-bold"
        >
          <option value="uk">UA</option>
          <option value="en">EN</option>
          <option value="sv">SV</option>
        </select>

        <button onClick={toggleMute} className="p-2 hover:bg-[#5A7D1E] rounded-full transition-all active:scale-90">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {gameState?.initiator === playerId && gameState.status !== 'finished' && (
          <button onClick={handlePause} className="p-2 hover:bg-[#5A7D1E] rounded-full transition-all active:scale-90 text-yellow-300" title={gameState.status === 'paused' ? 'Продовжити' : 'Пауза'}>
            {gameState.status === 'paused' ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
          </button>
        )}

        <div className="relative">
          <button 
            onClick={() => setShowStats(!showStats)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 transition-transform active:scale-90 ${tokenColors[playerTokenColor] || 'bg-gray-500'}`}
          >
            <User size={20} className={playerTokenColor === 'white' || playerTokenColor === 'yellow' ? 'text-gray-800' : 'text-white'} />
          </button>

          {showStats && (
            <div className="absolute right-0 mt-3 w-56 bg-[#3A5214] text-green-50 rounded-2xl shadow-2xl p-5 z-50 border-4 border-[#7DA33C]/40 animate-in fade-in zoom-in duration-200">
              <h3 className="font-black text-lg border-b-2 border-green-700/30 pb-2 mb-3 text-green-50">{playerName}</h3>
              <div className="space-y-2">
                <p className="text-sm font-bold flex justify-between"><span>🏆 Перемог:</span> <span className="text-yellow-300">0</span></p>
                <p className="text-sm font-bold flex justify-between"><span>🏎️ Заїздів:</span> <span className="text-yellow-300">1</span></p>
              </div>
            </div>
          )}
        </div>

        {gameState && (
          <button onClick={handleExitClick} className="p-2 text-red-400 hover:bg-red-900/30 rounded-full transition-all active:scale-90" title="Вийти з гри">
            <LogOut size={20} />
          </button>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-green-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#F1F8E9] rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-8 border-[#7DA33C]/20 text-center animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">🚪</div>
            <h2 className="text-2xl font-black text-green-800 mb-6">Вийти з гри?</h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirmLeave}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-red-100 transition-all active:scale-95"
              >
                ТАК, ВИЙТИ
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-2xl font-black text-lg transition-all active:scale-95"
              >
                ЗАЛИШИТИСЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
