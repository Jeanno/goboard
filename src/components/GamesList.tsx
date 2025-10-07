import { useState, useEffect } from 'react';
import { GameRecord } from '../types';
import { loadGamesList, deleteGame, updateGameName } from '../utils/gameStorage';
import './GamesList.css';

interface GamesListProps {
  currentGameId: string | null;
  onSelectGame: (gameId: string) => void;
  onClose: () => void;
}

export function GamesList({ currentGameId, onSelectGame, onClose }: GamesListProps) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = () => {
    const loadedGames = loadGamesList();
    // Sort by most recently updated
    loadedGames.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setGames(loadedGames);
  };

  const handleDelete = (gameId: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGame(gameId);
      loadGames();
    }
  };

  const handleStartEdit = (game: GameRecord) => {
    setEditingId(game.id);
    setEditName(game.name);
  };

  const handleSaveEdit = (gameId: string) => {
    if (editName.trim()) {
      updateGameName(gameId, editName.trim());
      setEditingId(null);
      loadGames();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="games-list-overlay" onClick={onClose}>
      <div className="games-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="games-list-header">
          <h2>Saved Games</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="games-list-content">
          {games.length === 0 ? (
            <p className="no-games">No saved games yet</p>
          ) : (
            <ul className="games-list">
              {games.map(game => (
                <li
                  key={game.id}
                  className={`game-item ${game.id === currentGameId ? 'current' : ''}`}
                >
                  <div className="game-item-content">
                    {editingId === game.id ? (
                      <div className="game-edit">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(game.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(game.id)}>✓</button>
                        <button onClick={handleCancelEdit}>✗</button>
                      </div>
                    ) : (
                      <>
                        <div className="game-info" onClick={() => onSelectGame(game.id)}>
                          <div className="game-name">
                            {game.name}
                            {game.id === currentGameId && <span className="current-badge">Current</span>}
                          </div>
                          <div className="game-details">
                            Updated: {formatDate(game.updatedAt)}
                          </div>
                        </div>
                        <div className="game-actions">
                          <button
                            onClick={() => handleStartEdit(game)}
                            title="Rename"
                            className="icon-button"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(game.id)}
                            title="Delete"
                            className="icon-button delete-button"
                            disabled={game.id === currentGameId}
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
