import { useState } from 'react'
import './App.css'
import { GoBoard } from './components/GoBoard'
import { GamesList } from './components/GamesList'
import { useGoGame } from './hooks/useGoGame'

function App() {
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
    // Initialize new game settings with current values
    setNewBoardSize(boardSize)
    setNewHandicap(handicap)
    setNewKomi(komi)
  }

  const handleStartNewGame = () => {
    // Apply the new settings
    setBoardSize(newBoardSize)
    setHandicap(newHandicap)
    setKomi(newKomi)
    setShowNewGameSettings(false)
    // Reset game with new config immediately
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
      <h1>Go Board</h1>

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
        <div className="game-management">
          <button onClick={handleNewGame} className="new-game-button">New Game</button>
          <button onClick={() => setShowGamesList(true)} className="load-game-button">Load Game</button>
        </div>
      </div>

      {showGamesList && (
        <GamesList
          currentGameId={currentGameId}
          onSelectGame={handleLoadGame}
          onClose={() => setShowGamesList(false)}
        />
      )}

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
    </div>
  )
}

export default App
