import { useState } from 'react'
import './App.css'
import { GoBoard } from './components/GoBoard'
import { useGoGame } from './hooks/useGoGame'

function App() {
  const [boardSize, setBoardSize] = useState(19)
  const [handicap, setHandicap] = useState(0)
  const [komi, setKomi] = useState(6.5)

  const { gameState, placeStone, resetGame, undo } = useGoGame({
    boardSize,
    handicapStones: handicap,
    komi,
  })

  const handleReset = () => {
    resetGame()
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
      </div>

      <div className="board-container">
        <GoBoard gameState={gameState} onPlaceStone={placeStone} />
      </div>

      <div className="controls">
        <button onClick={undo}>Undo</button>
        <button onClick={handleReset}>Reset Game</button>
      </div>

      <div className="settings">
        <div className="setting-group">
          <label>Board Size:</label>
          <select value={boardSize} onChange={(e) => setBoardSize(Number(e.target.value))}>
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
            value={handicap}
            onChange={(e) => setHandicap(Number(e.target.value))}
          />
        </div>
        <div className="setting-group">
          <label>Komi:</label>
          <input
            type="number"
            step="0.5"
            value={komi}
            onChange={(e) => setKomi(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

export default App
