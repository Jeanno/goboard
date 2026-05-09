import { useState } from 'react'
import './App.css'
import { GoBoard } from './components/GoBoard'
import { GamesList } from './components/GamesList'
import { JosekiViewLazy } from './components/JosekiView.lazy'
import { useGoGame } from './hooks/useGoGame'

type Mode = 'play' | 'joseki'

function App() {
  const [mode, setMode] = useState<Mode>('play')
  const [boardSize, setBoardSize] = useState(19)
  const [handicap, setHandicap] = useState(0)
  const [komi, setKomi] = useState(6.5)
  const [showNewGameSettings, setShowNewGameSettings] = useState(false)
  const [showGamesList, setShowGamesList] = useState(false)

  const [newBoardSize, setNewBoardSize] = useState(19)
  const [newHandicap, setNewHandicap] = useState(0)
  const [newKomi, setNewKomi] = useState(6.5)

  const { gameState, currentGameId, placeStone, resetGame, loadGameById, goBack, goForward, jumpToStart, jumpToEnd, goBack10, goForward10 } = useGoGame({
    boardSize,
    handicapStones: handicap,
    komi,
  })

  const handleNewGame = () => {
    setShowNewGameSettings(true)
    setNewBoardSize(boardSize)
    setNewHandicap(handicap)
    setNewKomi(komi)
  }

  const handleStartNewGame = () => {
    setBoardSize(newBoardSize)
    setHandicap(newHandicap)
    setKomi(newKomi)
    setShowNewGameSettings(false)
    resetGame({
      boardSize: newBoardSize,
      handicapStones: newHandicap,
      komi: newKomi,
    })
  }

  const handleCancelNewGame = () => {
    setShowNewGameSettings(false)
  }

  const handleLoadGame = (gameId: string) => {
    loadGameById(gameId)
    setShowGamesList(false)
  }

  return (
    <div className="App">
      <header className="app-header">
        {mode === 'play' && (
          <button
            className="burger-menu"
            onClick={() => setShowGamesList(true)}
            aria-label="Open games menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
        <h1>Go Board</h1>
        <div className="mode-toggle" role="tablist" aria-label="Mode">
          <button
            className={mode === 'play' ? 'active' : ''}
            onClick={() => setMode('play')}
            role="tab"
            aria-selected={mode === 'play'}
          >
            Play
          </button>
          <button
            className={mode === 'joseki' ? 'active' : ''}
            onClick={() => setMode('joseki')}
            role="tab"
            aria-selected={mode === 'joseki'}
          >
            Joseki
          </button>
        </div>
      </header>

      {mode === 'joseki' ? (
        <JosekiViewLazy />
      ) : (
        <>
          <div className="game-info">
            <div className="current-player">
              Current Player: <span className={`player-${gameState.currentPlayer}`}>
                {gameState.currentPlayer === 'black' ? 'Black' : 'White'}
              </span>
            </div>
            <div className="captures">
              Captured - Black: {gameState.capturedStones.black}, White: {gameState.capturedStones.white}
            </div>
            <div className="game-settings-info">
              Board: {boardSize}x{boardSize} | Handicap: {handicap} | Komi: {komi}
            </div>
          </div>

          <div className="board-container">
            <GoBoard gameState={gameState} onPlaceStone={placeStone} />
          </div>

          <div className="controls">
            <div className="navigation-controls">
              <button
                onClick={jumpToStart}
                disabled={gameState.historyIndex === 0}
                title="Jump to start"
              >
                ⏮
              </button>
              <button
                onClick={goBack10}
                disabled={gameState.historyIndex === 0}
                title="Back 10 moves"
              >
                ⏪
              </button>
              <button
                onClick={goBack}
                disabled={gameState.historyIndex === 0}
                title="Back 1 move"
              >
                ◀
              </button>
              <button
                onClick={goForward}
                disabled={gameState.historyIndex >= gameState.history.length - 1}
                title="Forward 1 move"
              >
                ▶
              </button>
              <button
                onClick={goForward10}
                disabled={gameState.historyIndex >= gameState.history.length - 1}
                title="Forward 10 moves"
              >
                ⏩
              </button>
              <button
                onClick={jumpToEnd}
                disabled={gameState.historyIndex >= gameState.history.length - 1}
                title="Jump to end"
              >
                ⏭
              </button>
            </div>
            <button onClick={handleNewGame} className="new-game-button">New Game</button>
          </div>

          <GamesList
            currentGameId={currentGameId}
            isOpen={showGamesList}
            onSelectGame={handleLoadGame}
            onClose={() => setShowGamesList(false)}
          />

          {showNewGameSettings && (
            <div className="settings">
              <h3>New Game Settings</h3>
              <div className="setting-group">
                <label>Board Size:</label>
                <select value={newBoardSize} onChange={(e) => setNewBoardSize(Number(e.target.value))}>
                  <option value={9}>9x9</option>
                  <option value={13}>13x13</option>
                  <option value={19}>19x19</option>
                </select>
              </div>
              <div className="setting-group">
                <label>Handicap:</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={newHandicap}
                  onChange={(e) => setNewHandicap(Number(e.target.value))}
                />
              </div>
              <div className="setting-group">
                <label>Komi:</label>
                <input
                  type="number"
                  step="0.5"
                  value={newKomi}
                  onChange={(e) => setNewKomi(Number(e.target.value))}
                />
              </div>
              <div className="settings-buttons">
                <button onClick={handleStartNewGame}>Start New Game</button>
                <button onClick={handleCancelNewGame}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
