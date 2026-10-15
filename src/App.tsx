import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import { RotateCcw, Undo2, Sparkles, Bot, UserRound } from 'lucide-react';

type Level = { rating: string; name: string; depth: number; randomness: number };
const levels: Level[] = [
  { rating: '500', name: 'Новичок', depth: 1, randomness: 0.7 },
  { rating: '1000', name: 'Любитель', depth: 2, randomness: 0.42 },
  { rating: '1500', name: 'Клубный', depth: 2, randomness: 0.12 },
  { rating: '2000', name: 'Эксперт', depth: 3, randomness: 0.04 },
  { rating: '2500+', name: 'Гроссмейстер', depth: 3, randomness: 0 },
];
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const glyphs: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};
const values: Record<PieceSymbol, number> = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };

function evaluate(chess: Chess) {
  if (chess.isCheckmate()) return -100000;
  if (chess.isDraw()) return 0;
  let score = 0;
  for (const row of chess.board()) for (const piece of row) {
    if (!piece) continue;
    const sign = piece.color === chess.turn() ? 1 : -1;
    score += values[piece.type] * sign;
    if (piece.type === 'p') {
      const progress = piece.color === 'w' ? 6 - Number(piece.square[1]) : Number(piece.square[1]) - 3;
      score += progress * 7 * sign;
    }
    if (piece.type === 'n' || piece.type === 'b') {
      const center = 3.5 - Math.abs(3.5 - files.indexOf(piece.square[0])) + 3.5 - Math.abs(3.5 - Number(piece.square[1]));
      score += center * 4 * sign;
    }
  }
  if (chess.isCheck()) score -= 24;
  return score;
}

function search(chess: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || chess.isGameOver()) return evaluate(chess);
  let best = -Infinity;
  const moves = chess.moves({ verbose: true }).sort((a, b) => Number(Boolean(b.captured)) - Number(Boolean(a.captured)));
  for (const move of moves) {
    chess.move(move);
    const score = -search(chess, depth - 1, -beta, -alpha);
    chess.undo();
    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

function chooseComputerMove(chess: Chess, level: Level) {
  const moves = chess.moves({ verbose: true });
  if (moves.length < 2 || level.randomness === 0) {
    let best = -Infinity;
    let candidates: typeof moves = [];
    for (const move of moves) {
      chess.move(move);
      const score = -search(chess, Math.max(0, level.depth - 1), -Infinity, Infinity);
      chess.undo();
      if (score > best) { best = score; candidates = [move]; }
      else if (score === best) candidates.push(move);
    }
    return candidates[Math.floor(Math.random() * candidates.length)] ?? moves[0];
  }
  const scored = moves.map(move => {
    chess.move(move);
    const score = -search(chess, Math.max(0, level.depth - 1), -Infinity, Infinity);
    chess.undo();
    return { move, score: score + (Math.random() - 0.5) * level.randomness * 1200 };
  }).sort((a, b) => b.score - a.score);
  const shortlist = level.randomness > 0.5 ? scored.slice(0, Math.max(3, Math.ceil(scored.length * 0.55))) :
    level.randomness > 0.1 ? scored.slice(0, Math.min(4, scored.length)) : scored.slice(0, Math.min(2, scored.length));
  return shortlist[Math.floor(Math.random() * shortlist.length)].move;
}

function statusText(game: Chess, thinking: boolean) {
  if (thinking) return 'Компьютер думает…';
  if (game.isCheckmate()) return game.turn() === 'w' ? 'Мат. Победил компьютер.' : 'Мат! Ты победил!';
  if (game.isStalemate()) return 'Пат. Ничья.';
  if (game.isDraw()) return 'Ничья.';
  if (game.isCheck()) return game.turn() === 'w' ? 'Шах! Твой ход.' : 'Шах королю компьютера.';
  return game.turn() === 'w' ? 'Твой ход' : 'Ход компьютера';
}

export default function App() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [levelIndex, setLevelIndex] = useState(1);
  const [flipped, setFlipped] = useState(false);
  const level = levels[levelIndex];
  const board = game.board();
  const targets = useMemo(() => selected ? game.moves({ square: selected, verbose: true }).map(move => move.to as Square) : [], [game, selected]);
  const status = statusText(game, thinking);
  const moveNumber = Math.max(1, Math.ceil(game.history().length / 2));
  const material = useMemo(() => {
    let white = 0, black = 0;
    for (const row of board) for (const piece of row) if (piece) {
      if (piece.color === 'w') white += values[piece.type]; else black += values[piece.type];
    }
    return { white, black };
  }, [board]);

  useEffect(() => {
    if (game.turn() !== 'b' || game.isGameOver()) return;
    setThinking(true);
    const timer = window.setTimeout(() => {
      const next = new Chess(game.fen());
      const move = chooseComputerMove(next, level);
      if (move) {
        next.move(move);
        setGame(new Chess(next.fen()));
        setLastMove({ from: move.from, to: move.to });
        setSelected(null);
       
      }
      setThinking(false);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [game, level]);

  const resetGame = () => {
    setGame(new Chess()); setSelected(null); setLastMove(null); setThinking(false);
  };
  const clickSquare = (square: Square) => {
    if (thinking || game.turn() !== 'w' || game.isGameOver()) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const next = new Chess(game.fen());
      const move = next.move({ from: selected, to: square, promotion: 'q' });
      if (move) {
        setGame(next); setLastMove({ from: move.from, to: move.to }); setSelected(null);
      }
      return;
    }
    setSelected(piece?.color === 'w' ? square : null);
  };
  const undoMove = () => {
    if (thinking || game.history().length < 2) return;
    const next = new Chess(game.fen());
    next.undo(); next.undo();
    setGame(next); setSelected(null); setLastMove(null);
  };

  return (
    <main className="chess-app">
      <header className="topbar">
        <a className="brand" href="#" onClick={event => event.preventDefault()} aria-label="M-Chess главная">
          <span className="brand-icon">♞</span><span className="brand-name">m<span>·</span>chess<small>ТВОЙ СЛЕДУЮЩИЙ ХОД</small></span>
        </a>
        <div className="topbar-right"><span className="offline-label"><i /> ИГРА БЕЗ СЕТИ</span><button className="round-button" onClick={() => setFlipped(value => !value)} title="Перевернуть доску" aria-label="Перевернуть доску"><RotateCcw size={17} /></button></div>
      </header>

      <section className="intro">
        <div className="intro-copy"><div className="kicker"><Sparkles size={14} /> НЕ СПЕШИ. ДУМАЙ.</div><h1>Тихая битва.<br /><em>Чистый расчёт.</em></h1><p>Никаких карточек и лишнего шума. Только ты, доска и компьютер.</p></div>
        <div className="opponents"><div className="opponent"><span className="opponent-avatar human"><UserRound size={21} /></span><span><b>Ты</b><small>Белые фигуры</small></span></div><span className="vs">VS</span><div className="opponent"><span className="opponent-avatar machine"><Bot size={21} /></span><span><b>Компьютер</b><small>Чёрные фигуры</small></span></div></div>
      </section>

      <section className="play-area">
        <div className="board-side">
          <div className="game-heading"><div className="game-state"><span className={game.isCheck() ? 'state-dot warning' : 'state-dot'} /> <span>{status}</span></div><span className="move-counter">ХОД {String(moveNumber).padStart(2, '0')}</span></div>
          <div className="board-wrap">
            <div className="coordinates coordinates-left">{(flipped ? [...ranks].reverse() : ranks).map(rank => <span key={rank}>{rank}</span>)}</div>
            <div className="chessboard" role="grid" aria-label="Шахматная доска">
              {(flipped ? [...ranks].reverse() : ranks).map((rank, rowIndex) => (flipped ? [...files].reverse() : files).map((file, colIndex) => {
                const square = `${file}${rank}` as Square;
                const piece = game.get(square);
                const isLight = (files.indexOf(file) + rank) % 2 !== 0;
                const isLast = lastMove?.from === square || lastMove?.to === square;
                const isKingInCheck = piece?.type === 'k' && piece.color === game.turn() && game.isCheck();
                return <button key={square} role="gridcell" aria-label={`${square}${piece ? `, ${piece.color === 'w' ? 'белая' : 'чёрная'} фигура` : ''}`} className={`square ${isLight ? 'light' : 'dark'} ${selected === square ? 'selected' : ''} ${isLast ? 'last-move' : ''} ${targets.includes(square) ? (piece ? 'capture-target' : 'legal-target') : ''} ${isKingInCheck ? 'king-check' : ''}`} onClick={() => clickSquare(square)}>
                  {targets.includes(square) && !piece && <span className="target-dot" />}
                  {piece && <span className={`piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}>{glyphs[piece.color][piece.type]}</span>}
                  {colIndex === 0 && <span className="rank-label">{rank}</span>}
                  {rowIndex === 7 && <span className="file-label">{file}</span>}
                </button>;
              }))}
            </div>
            <div className="coordinates coordinates-right">{(flipped ? [...ranks].reverse() : ranks).map(rank => <span key={rank}>{rank}</span>)}</div>
          </div>
          <div className="board-bottom"><span><i className="legend-circle" /> Возможный ход</span><span><i className="legend-square" /> Последний ход</span><span className="material-score">Материал <b>{material.white - material.black > 0 ? '+' : ''}{((material.white - material.black) / 100).toFixed(1)}</b></span></div>
        </div>

        <aside className="control-side">
          <section className="level-card">
            <div className="side-label">ВЫБЕРИ СОПЕРНИКА</div><h2>Уровень игры</h2><p>От первой партии до серьёзного вызова.</p>
            <div className="level-list">{levels.map((item, index) => <button key={item.rating} className={levelIndex === index ? 'level-option active' : 'level-option'} onClick={() => setLevelIndex(index)}><span className="level-rating">{item.rating}<small> ELO</small></span><span className="level-name">{item.name}</span><span className="level-radio">{levelIndex === index && <i />}</span></button>)}</div>
            <div className="level-note"><span className="level-spark">✦</span><span><b>{level.rating} · {level.name}</b><small>Сложность можно менять в любой момент.</small></span></div>
          </section>
          <section className="moves-card"><div className="moves-head"><h3>Партия</h3><span>{Math.floor(game.history().length / 2) + (game.history().length % 2 ? 1 : 0)} ходов</span></div>
            {game.history().length === 0 ? <div className="empty-moves"><span>♙</span><p>Твоя история начинается<br />с первого хода.</p></div> : <div className="moves-list">{Array.from({ length: Math.ceil(game.history().length / 2) }, (_, index) => <div className="move-row" key={index}><span>{index + 1}.</span><b>{game.history()[index * 2] ?? '…'}</b><b>{game.history()[index * 2 + 1] ?? '…'}</b></div>)}</div>}
            <div className="move-actions"><button onClick={undoMove} disabled={thinking || game.history().length < 2}><Undo2 size={15} /> Отменить ход</button><button onClick={resetGame}><RotateCcw size={15} /> Новая партия</button></div>
          </section>
        </aside>
      </section>
      <footer className="footer"><span>♞ M·CHESS</span><span>ХОРОШИЙ ХОД НЕ НУЖДАЕТСЯ В ШУМЕ.</span><span>ЛОКАЛЬНАЯ ПАРТИЯ</span></footer>
    </main>
  );
}
