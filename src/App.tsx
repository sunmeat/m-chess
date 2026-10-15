import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import { RotateCcw, Undo2 } from 'lucide-react';

type Level = { rating: string; name: string; depth: number; randomness: number };
const level: Level = { rating: '1000', name: 'Любитель', depth: 2, randomness: 0.42 };
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const values: Record<PieceSymbol, number> = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };

const pieceStyles = [
  { id: 'cburnett', name: '01 · Классика Lichess', group: 'Классика' },
  { id: 'merida', name: '02 · Merida', group: 'Классика' },
  { id: 'alpha', name: '03 · Alpha', group: 'Классика' },
  { id: 'staunty', name: '04 · Staunty', group: 'Классика' },
  { id: 'maestro', name: '05 · Maestro', group: 'Классика' },
  { id: 'caliente', name: '06 · Caliente', group: 'Классика' },
  { id: 'gioco', name: '07 · Gioco', group: 'Классика' },
  { id: 'california', name: '08 · California', group: 'Классика' },
  { id: 'fantasy', name: '09 · Fantasy', group: 'Иллюстративные' },
  { id: 'chessnut', name: '10 · Chessnut', group: 'Минимализм' },
  { id: 'pixel', name: '11 · Pixel', group: 'Пиксельные' },
  { id: 'horsey', name: '12 · Horsey', group: 'Иллюстративные' },
  { id: 'anarcandy', name: '13 · Anarcandy', group: 'Иллюстративные' },
  { id: 'cardinal', name: '14 · Cardinal', group: 'Классика' },
  { id: 'dubrovny', name: '15 · Dubrovny', group: 'Классика' },
  { id: 'fresca', name: '16 · Fresca', group: 'Иллюстративные' },
  { id: 'icpieces', name: '17 · IC Pieces', group: 'Классика' },
  { id: 'tatiana', name: '18 · Tatiana', group: 'Классика' },
  { id: 'mono', name: '19 · Mono', group: 'Минимализм' },
  { id: 'letter', name: '20 · Letter', group: 'Минимализм' },
  { id: 'pirouetti', name: '21 · Pirouetti', group: 'Иллюстративные' },
  { id: 'shapes', name: '22 · Shapes', group: 'Минимализм' },
  { id: 'spatial', name: '23 · Spatial', group: 'Минимализм' },
  { id: 'celtic', name: '24 · Celtic', group: 'Декоративные' },
  { id: 'rhosgfx', name: '25 · RhosGFX', group: 'Классика' },
  { id: 'firi', name: '26 · Firi', group: 'Мягкие' },
  { id: 'kiwen-suwi', name: '27 · Kiwen-Suwi', group: 'Декоративные' },
  { id: 'mpchess', name: '28 · MP Chess', group: 'Классика' },
  { id: 'chess7', name: '29 · Chess7', group: 'Классика' },
  { id: 'companion', name: '30 · Companion', group: 'Классика' },
  { id: 'disguised', name: '31 · Disguised', group: 'Иллюстративные' },
  { id: 'governor', name: '32 · Governor', group: 'Классика' },
  { id: 'libra', name: '33 · Libra', group: 'Классика' },
  { id: 'leipzig', name: '34 · Leipzig', group: 'Декоративные' },
  { id: 'reillycraig', name: '35 · ReillyCraig', group: 'Классика' },
  { id: 'riohacha', name: '36 · Riohacha', group: 'Классика' },
  { id: 'cooke', name: '37 · Cooke', group: 'Классика' },
  { id: 'papercut', name: '38 · Papercut', group: 'Декоративные' },
  { id: 'totoy', name: '39 · Totoy', group: 'Декоративные' },
  { id: 'shahi-ivory-brown', name: '40 · Shahi Ivory', group: 'Классика' },
  { id: 'california', name: '41 · California Soft', group: 'Мягкие' },
  { id: 'maestro', name: '42 · Maestro Bold', group: 'Классика' },
  { id: 'fantasy', name: '43 · Fantasy Light', group: 'Иллюстративные' },
  { id: 'chessnut', name: '44 · Chessnut Clean', group: 'Минимализм' },
  { id: 'rhosgfx', name: '45 · RhosGFX Flat', group: 'Минимализм' },
  { id: 'spatial', name: '46 · Spatial Soft', group: 'Минимализм' },
  { id: 'celtic', name: '47 · Celtic Ornament', group: 'Декоративные' },
  { id: 'kiwen-suwi', name: '48 · Kiwen-Suwi Round', group: 'Мягкие' },
  { id: 'firi', name: '49 · Firi Rounded', group: 'Мягкие' },
  { id: 'cburnett', name: '50 · Cburnett Classic+', group: 'Классика' },
] as const;

function PieceArt({ type, color, styleId }: { type: PieceSymbol; color: Color; styleId: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [styleId, type, color]);
  const symbols: Record<PieceSymbol, string> = color === 'w'
    ? { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }
    : { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  const key = color + type.toUpperCase();
  if (failed) return <span className={`piece-fallback ${color === 'w' ? 'piece-white' : 'piece-black'}`} aria-hidden="true">{symbols[type]}</span>;
  return <img className={`piece-art ${color === 'w' ? 'piece-white' : 'piece-black'}`} src={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${styleId}/${key}.svg`} alt="" draggable={false} onError={() => setFailed(true)} />;
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
  const [styleId, setStyleId] = useState('cburnett');
  const [showStyles, setShowStyles] = useState(true);
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
      <header className="topbar"><a className="brand" href="#" onClick={event => event.preventDefault()} aria-label="Munchess"><span className="brand-icon">♞</span><span className="brand-name">m<span>·</span>chess</span></a><div className="topbar-right"><button className="styles-toggle" onClick={() => setShowStyles(value => !value)}>{showStyles ? "Скрыть стили" : "50 стилей фигур"}</button><span className="rating-pill">1000 ELO</span><button className="round-button" onClick={() => setFlipped(value => !value)} title="Перевернуть доску" aria-label="Перевернуть доску"><RotateCcw size={18} /></button></div></header>

      {showStyles && <section className="style-picker" aria-label="Выбор шахматных фигур"><div className="style-picker-heading"><div><span className="eyebrow">PIECE GALLERY</span><h1>Найди свой стиль</h1><p>50 вариантов оформления. Нажми на карточку, чтобы сразу примерить фигуры на доске.</p></div><span className="style-count">{pieceStyles.length} стилей</span></div><div className="style-grid">{pieceStyles.map((style, index) => <button key={index} className={`style-card ${styleId === style.id ? "active" : ""}`} onClick={() => setStyleId(style.id)} aria-pressed={styleId === style.id}><span className="style-preview"><img src={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${style.id}/wK.svg`} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} /><img src={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${style.id}/bN.svg`} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} /><img src={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${style.id}/wQ.svg`} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} /></span><span className="style-card-name">{style.name}</span><span className="style-card-group">{style.group}</span>{styleId === style.id && <span className="style-selected">Выбран</span>}</button>)}</div><p className="license-note">Иллюстрации загружаются из открытой коллекции Lichess. У отдельных наборов разные лицензии, поэтому перед коммерческим распространением проверь лицензию выбранного набора.</p></section>}

      <section className="play-area">
        <div className="board-side">
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
                  {piece && <PieceArt type={piece.type} color={piece.color} styleId={styleId} />}
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
