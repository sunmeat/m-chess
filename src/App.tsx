import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import { RotateCcw, Undo2 } from 'lucide-react';

type Level = { rating: string; name: string; depth: number; randomness: number };
const level: Level = { rating: '1000', name: 'Любитель', depth: 2, randomness: 0.42 };
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const values: Record<PieceSymbol, number> = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };

function PieceArt({ type, color }: { type: PieceSymbol; color: Color }) {
  const white = color === 'w';
  const fill = white ? 'url(#porcelain)' : 'url(#forest)';
  const stroke = white ? '#a69d87' : '#17251a';
  const shine = white ? '#ffffff' : '#8cb17a';
  const common = { fill, stroke, strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  return <svg className={`piece-art ${white ? 'piece-white' : 'piece-black'}`} viewBox="0 0 64 76" aria-hidden="true" focusable="false">
    <defs><linearGradient id="porcelain" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffef8"/><stop offset=".55" stopColor="#f3e9d0"/><stop offset="1" stopColor="#c8b997"/></linearGradient><linearGradient id="forest" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6c8d5a"/><stop offset=".48" stopColor="#345638"/><stop offset="1" stopColor="#1b3423"/></linearGradient></defs>
    <ellipse cx="32" cy="69" rx="20" ry="4" fill="#17251a" opacity=".17"/>
    {type === 'p' && <g {...common}><path d="M17 62h30l-3-8H20z"/><path d="M21 54c2-5 4-8 5-13h12c1 5 3 8 5 13z"/><circle cx="32" cy="25" r="12"/><path d="M25 19c2-4 6-5 10-4" fill="none" stroke={shine} strokeWidth="3" strokeLinecap="round"/></g>}
    {type === 'r' && <g {...common}><path d="M16 62h32l-3-8H19z"/><path d="M21 54V28h22v26z"/><path d="M17 28V14h8v7h6v-7h8v7h7v-7h4v14z"/><path d="M24 35v13m8-13v13m8-13v13" fill="none" stroke={shine} strokeWidth="2" strokeLinecap="round"/></g>}
    {type === 'n' && <g {...common}><path d="M15 62h34l-4-8H19z"/><path d="M20 54c3-9 2-15-2-22l8-17 18 6 5 16-8 17z"/><path d="M26 20l8-6 11 8-9 4z"/><path d="M25 28l8 2-4 5-7-2z" fill={shine} stroke="none"/><circle cx="38" cy="25" r="2.5" fill={white ? '#5b714c' : '#f7d96d'} stroke="none"/><path d="M29 43l12 4" fill="none" stroke={shine} strokeWidth="2.5" strokeLinecap="round"/></g>}
    {type === 'b' && <g {...common}><path d="M16 62h32l-3-8H19z"/><path d="M22 54c4-7 3-12-2-18L32 14l12 22c-5 6-6 11-2 18z"/><path d="M32 17l-4 10 7 8-5 8" fill="none" stroke={shine} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="32" cy="13" r="4"/></g>}
    {type === 'q' && <g {...common}><path d="M14 62h36l-4-8H18z"/><path d="M20 54l4-20h16l4 20z"/><path d="M24 35l-8-12 10 4 6-16 6 16 10-4-8 12z"/><circle cx="16" cy="21" r="4"/><circle cx="26" cy="25" r="4"/><circle cx="32" cy="9" r="4"/><circle cx="38" cy="25" r="4"/><circle cx="48" cy="21" r="4"/><path d="M26 43h12" stroke={shine} strokeWidth="2.5" strokeLinecap="round"/></g>}
    {type === 'k' && <g {...common}><path d="M14 62h36l-4-8H18z"/><path d="M21 54l4-20h14l4 20z"/><path d="M28 34V24h-8v-6h8V9h8v9h8v6h-8v10z"/><path d="M32 12v16" fill="none" stroke={shine} strokeWidth="2" strokeLinecap="round"/><path d="M26 42h12" stroke={shine} strokeWidth="2.5" strokeLinecap="round"/></g>}
  </svg>;
}

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
  const [draggingFrom, setDraggingFrom] = useState<Square | null>(null);
  const suppressClick = useRef(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const targets = useMemo(() => selected ? game.moves({ square: selected, verbose: true }).map(move => move.to as Square) : [], [game, selected]);
  const status = statusText(game, thinking);

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
  const makeMove = (from: Square, to: Square) => {
    if (thinking || game.turn() !== 'w' || game.isGameOver()) return;
    const next = new Chess(game.fen());
    try {
      const move = next.move({ from, to, promotion: 'q' });
      if (move) {
        setGame(next);
        setLastMove({ from: move.from, to: move.to });
        setSelected(null);
        setDraggingFrom(null);
      }
    } catch {
      const piece = game.get(to);
      setSelected(piece?.color === 'w' ? to : null);
      setDraggingFrom(null);
    }
  };
  const clickSquare = (square: Square) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (thinking || game.turn() !== 'w' || game.isGameOver()) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      makeMove(selected, square);
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
      <header className="topbar"><a className="brand" href="#" onClick={event => event.preventDefault()} aria-label="Munchess"><span className="brand-icon">♞</span><span className="brand-name">m<span>·</span>chess</span></a><div className="topbar-right"><span className="rating-pill">1000 ELO</span><button className="round-button" onClick={() => setFlipped(value => !value)} title="Перевернуть доску" aria-label="Перевернуть доску"><RotateCcw size={18} /></button></div></header>

      <section className="play-area">
        <div className="board-side">
          <div className="game-heading"><span className="move-counter">ПАРТИЯ ПРОТИВ КОМПЬЮТЕРА</span></div>
          <div className="board-wrap">
            
            <div className="chessboard" role="grid" aria-label="Шахматная доска">
              {(flipped ? [...ranks].reverse() : ranks).map(rank => (flipped ? [...files].reverse() : files).map(file => {
                const square = `${file}${rank}` as Square;
                const piece = game.get(square);
                const isLight = (files.indexOf(file) + rank) % 2 !== 0;
                const isLast = lastMove?.from === square || lastMove?.to === square;
                const isKingInCheck = piece?.type === 'k' && piece.color === game.turn() && game.isCheck();
                return <button key={square} role="gridcell" aria-label={`${square}${piece ? `, ${piece.color === 'w' ? 'белая' : 'чёрная'} фигура` : ''}`} className={`square ${isLight ? 'light' : 'dark'} ${selected === square ? 'selected' : ''} ${draggingFrom === square ? 'dragging' : ''} ${isLast ? 'last-move' : ''} ${targets.includes(square) ? (piece ? 'capture-target' : 'legal-target') : ''} ${isKingInCheck ? 'king-check' : ''}`}
                  data-square={square}
                  draggable={Boolean(piece?.color === 'w' && game.turn() === 'w' && !thinking)}
                  onDragStart={event => {
                    if (!piece || piece.color !== 'w' || game.turn() !== 'w' || thinking) { event.preventDefault(); return; }
                    event.dataTransfer.setData('text/plain', square);
                    event.dataTransfer.effectAllowed = 'move';
                    setDraggingFrom(square);
                    setSelected(square);
                  }}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    const from = (event.dataTransfer.getData('text/plain') || draggingFrom) as Square | null;
                    if (from) makeMove(from, square);
                  }}
                  onDragEnd={() => setDraggingFrom(null)}
                  onPointerDown={event => {
                    if (event.pointerType === 'touch' && piece?.color === 'w' && game.turn() === 'w' && !thinking) {
                      event.preventDefault();
                      setDraggingFrom(square);
                      setSelected(square);
                    }
                  }}
                  onPointerUp={event => {
                    if (event.pointerType === 'touch' && draggingFrom) {
                      event.preventDefault();
                      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-square]') as HTMLElement | null;
                      const destination = (target?.dataset.square || square) as Square;
                      suppressClick.current = true;
                      window.setTimeout(() => { suppressClick.current = false; }, 350);
                      if (destination !== draggingFrom) makeMove(draggingFrom, destination);
                      setDraggingFrom(null);
                    }
                  }}
                  onClick={() => clickSquare(square)}>
                  {targets.includes(square) && !piece && <span className="target-dot" />}
                  {piece && <PieceArt type={piece.type} color={piece.color} />}
                </button>;
              }))}
            </div>
            
          </div>
          
        </div>

        <div className="board-controls"><div className="game-state"><span className={game.isCheck() ? 'state-dot warning' : 'state-dot'} /> <span>{status}</span></div><div className="board-actions"><button onClick={undoMove} disabled={thinking || game.history().length < 2} aria-label="Отменить ход" title="Отменить ход"><Undo2 size={19} /></button><button onClick={resetGame} aria-label="Новая партия" title="Новая партия"><RotateCcw size={19} /></button></div></div>
      </section>
    </main>
  );
}
