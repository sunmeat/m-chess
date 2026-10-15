import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import { RotateCcw, Undo2 } from 'lucide-react';

type Level = { rating: string; name: string; depth: number; randomness: number };
const level: Level = { rating: '1000', name: 'Любитель', depth: 2, randomness: 0.42 };
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const values: Record<PieceSymbol, number> = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };

const pieceStyles = [
  { id: 'v01', source: 'rhosgfx', name: '01 · RhosGFX Оригинальный', group: 'CC0 1.0', filter: 'none' },
  { id: 'v02', source: 'rhosgfx', name: '02 · RhosGFX Чернильный', group: 'CC0 1.0', filter: 'grayscale(1) contrast(1.35)' },
  { id: 'v03', source: 'rhosgfx', name: '03 · RhosGFX Золотой', group: 'CC0 1.0', filter: 'sepia(.85) saturate(2) hue-rotate(350deg)' },
  { id: 'v04', source: 'rhosgfx', name: '04 · RhosGFX Серебряный', group: 'CC0 1.0', filter: 'grayscale(1) brightness(1.25) contrast(1.1)' },
  { id: 'v05', source: 'rhosgfx', name: '05 · RhosGFX Бронзовый', group: 'CC0 1.0', filter: 'sepia(.8) saturate(1.5)' },
  { id: 'v06', source: 'rhosgfx', name: '06 · RhosGFX Нефритовый', group: 'CC0 1.0', filter: 'sepia(.5) saturate(1.8) hue-rotate(65deg)' },
  { id: 'v07', source: 'rhosgfx', name: '07 · RhosGFX Рубиновый', group: 'CC0 1.0', filter: 'sepia(.8) saturate(3) hue-rotate(300deg)' },
  { id: 'v08', source: 'rhosgfx', name: '08 · RhosGFX Сапфировый', group: 'CC0 1.0', filter: 'sepia(.7) saturate(2.4) hue-rotate(170deg)' },
  { id: 'v09', source: 'rhosgfx', name: '09 · RhosGFX Аметистовый', group: 'CC0 1.0', filter: 'sepia(.4) saturate(2.8) hue-rotate(220deg)' },
  { id: 'v10', source: 'rhosgfx', name: '10 · RhosGFX Медный', group: 'CC0 1.0', filter: 'sepia(.8) saturate(2.1) hue-rotate(330deg)' },
  { id: 'v11', source: 'rhosgfx', name: '11 · RhosGFX Слоновая кость', group: 'CC0 1.0', filter: 'grayscale(1) brightness(1.55) sepia(.3)' },
  { id: 'v12', source: 'rhosgfx', name: '12 · RhosGFX Оникс', group: 'CC0 1.0', filter: 'grayscale(1) brightness(.55) contrast(1.8)' },
  { id: 'v13', source: 'rhosgfx', name: '13 · RhosGFX Розовый кварц', group: 'CC0 1.0', filter: 'sepia(.3) saturate(1.5) hue-rotate(300deg)' },
  { id: 'v14', source: 'rhosgfx', name: '14 · RhosGFX Лёд', group: 'CC0 1.0', filter: 'grayscale(.4) brightness(1.3) hue-rotate(160deg)' },
  { id: 'v15', source: 'rhosgfx', name: '15 · RhosGFX Лесной', group: 'CC0 1.0', filter: 'sepia(.6) saturate(1.7) hue-rotate(60deg)' },
  { id: 'v16', source: 'rhosgfx', name: '16 · RhosGFX Океан', group: 'CC0 1.0', filter: 'sepia(.5) saturate(2) hue-rotate(150deg)' },
  { id: 'v17', source: 'rhosgfx', name: '17 · RhosGFX Закат', group: 'CC0 1.0', filter: 'sepia(.6) saturate(2.4) hue-rotate(330deg)' },
  { id: 'v18', source: 'rhosgfx', name: '18 · RhosGFX Лаванда', group: 'CC0 1.0', filter: 'sepia(.3) saturate(1.8) hue-rotate(220deg)' },
  { id: 'v19', source: 'rhosgfx', name: '19 · RhosGFX Песочный', group: 'CC0 1.0', filter: 'sepia(.8) saturate(.8) brightness(1.1)' },
  { id: 'v20', source: 'rhosgfx', name: '20 · RhosGFX Неон', group: 'CC0 1.0', filter: 'saturate(4) hue-rotate(80deg)' },
  { id: 'v21', source: 'fantasy', name: '21 · Fantasy Оригинальный', group: 'MIT', filter: 'none' },
  { id: 'v22', source: 'fantasy', name: '22 · Fantasy Чернильный', group: 'MIT', filter: 'grayscale(1) contrast(1.35)' },
  { id: 'v23', source: 'fantasy', name: '23 · Fantasy Золотой', group: 'MIT', filter: 'sepia(.85) saturate(2) hue-rotate(350deg)' },
  { id: 'v24', source: 'fantasy', name: '24 · Fantasy Серебряный', group: 'MIT', filter: 'grayscale(1) brightness(1.25) contrast(1.1)' },
  { id: 'v25', source: 'fantasy', name: '25 · Fantasy Бронзовый', group: 'MIT', filter: 'sepia(.8) saturate(1.5)' },
  { id: 'v26', source: 'fantasy', name: '26 · Fantasy Нефритовый', group: 'MIT', filter: 'sepia(.5) saturate(1.8) hue-rotate(65deg)' },
  { id: 'v27', source: 'fantasy', name: '27 · Fantasy Рубиновый', group: 'MIT', filter: 'sepia(.8) saturate(3) hue-rotate(300deg)' },
  { id: 'v28', source: 'fantasy', name: '28 · Fantasy Сапфировый', group: 'MIT', filter: 'sepia(.7) saturate(2.4) hue-rotate(170deg)' },
  { id: 'v29', source: 'fantasy', name: '29 · Fantasy Аметистовый', group: 'MIT', filter: 'sepia(.4) saturate(2.8) hue-rotate(220deg)' },
  { id: 'v30', source: 'fantasy', name: '30 · Fantasy Медный', group: 'MIT', filter: 'sepia(.8) saturate(2.1) hue-rotate(330deg)' },
  { id: 'v31', source: 'fantasy', name: '31 · Fantasy Слоновая кость', group: 'MIT', filter: 'grayscale(1) brightness(1.55) sepia(.3)' },
  { id: 'v32', source: 'fantasy', name: '32 · Fantasy Оникс', group: 'MIT', filter: 'grayscale(1) brightness(.55) contrast(1.8)' },
  { id: 'v33', source: 'fantasy', name: '33 · Fantasy Розовый кварц', group: 'MIT', filter: 'sepia(.3) saturate(1.5) hue-rotate(300deg)' },
  { id: 'v34', source: 'fantasy', name: '34 · Fantasy Лёд', group: 'MIT', filter: 'grayscale(.4) brightness(1.3) hue-rotate(160deg)' },
  { id: 'v35', source: 'fantasy', name: '35 · Fantasy Лесной', group: 'MIT', filter: 'sepia(.6) saturate(1.7) hue-rotate(60deg)' },
  { id: 'v36', source: 'fantasy', name: '36 · Fantasy Океан', group: 'MIT', filter: 'sepia(.5) saturate(2) hue-rotate(150deg)' },
  { id: 'v37', source: 'fantasy', name: '37 · Fantasy Закат', group: 'MIT', filter: 'sepia(.6) saturate(2.4) hue-rotate(330deg)' },
  { id: 'v38', source: 'fantasy', name: '38 · Fantasy Лаванда', group: 'MIT', filter: 'sepia(.3) saturate(1.8) hue-rotate(220deg)' },
  { id: 'v39', source: 'fantasy', name: '39 · Fantasy Песочный', group: 'MIT', filter: 'sepia(.8) saturate(.8) brightness(1.1)' },
  { id: 'v40', source: 'fantasy', name: '40 · Fantasy Неон', group: 'MIT', filter: 'saturate(4) hue-rotate(80deg)' },
  { id: 'v41', source: 'spatial', name: '41 · Spatial Оригинальный', group: 'MIT', filter: 'none' },
  { id: 'v42', source: 'spatial', name: '42 · Spatial Чернильный', group: 'MIT', filter: 'grayscale(1) contrast(1.35)' },
  { id: 'v43', source: 'spatial', name: '43 · Spatial Золотой', group: 'MIT', filter: 'sepia(.85) saturate(2) hue-rotate(350deg)' },
  { id: 'v44', source: 'spatial', name: '44 · Spatial Серебряный', group: 'MIT', filter: 'grayscale(1) brightness(1.25) contrast(1.1)' },
  { id: 'v45', source: 'spatial', name: '45 · Spatial Бронзовый', group: 'MIT', filter: 'sepia(.8) saturate(1.5)' },
  { id: 'v46', source: 'spatial', name: '46 · Spatial Нефритовый', group: 'MIT', filter: 'sepia(.5) saturate(1.8) hue-rotate(65deg)' },
  { id: 'v47', source: 'spatial', name: '47 · Spatial Рубиновый', group: 'MIT', filter: 'sepia(.8) saturate(3) hue-rotate(300deg)' },
  { id: 'v48', source: 'spatial', name: '48 · Spatial Сапфировый', group: 'MIT', filter: 'sepia(.7) saturate(2.4) hue-rotate(170deg)' },
  { id: 'v49', source: 'spatial', name: '49 · Spatial Аметистовый', group: 'MIT', filter: 'sepia(.4) saturate(2.8) hue-rotate(220deg)' },
  { id: 'v50', source: 'spatial', name: '50 · Spatial Медный', group: 'MIT', filter: 'sepia(.8) saturate(2.1) hue-rotate(330deg)' },
  { id: 'v51', source: 'spatial', name: '51 · Spatial Слоновая кость', group: 'MIT', filter: 'grayscale(1) brightness(1.55) sepia(.3)' },
  { id: 'v52', source: 'spatial', name: '52 · Spatial Оникс', group: 'MIT', filter: 'grayscale(1) brightness(.55) contrast(1.8)' },
  { id: 'v53', source: 'spatial', name: '53 · Spatial Розовый кварц', group: 'MIT', filter: 'sepia(.3) saturate(1.5) hue-rotate(300deg)' },
  { id: 'v54', source: 'spatial', name: '54 · Spatial Лёд', group: 'MIT', filter: 'grayscale(.4) brightness(1.3) hue-rotate(160deg)' },
  { id: 'v55', source: 'spatial', name: '55 · Spatial Лесной', group: 'MIT', filter: 'sepia(.6) saturate(1.7) hue-rotate(60deg)' },
  { id: 'v56', source: 'spatial', name: '56 · Spatial Океан', group: 'MIT', filter: 'sepia(.5) saturate(2) hue-rotate(150deg)' },
  { id: 'v57', source: 'spatial', name: '57 · Spatial Закат', group: 'MIT', filter: 'sepia(.6) saturate(2.4) hue-rotate(330deg)' },
  { id: 'v58', source: 'spatial', name: '58 · Spatial Лаванда', group: 'MIT', filter: 'sepia(.3) saturate(1.8) hue-rotate(220deg)' },
  { id: 'v59', source: 'spatial', name: '59 · Spatial Песочный', group: 'MIT', filter: 'sepia(.8) saturate(.8) brightness(1.1)' },
  { id: 'v60', source: 'spatial', name: '60 · Spatial Неон', group: 'MIT', filter: 'saturate(4) hue-rotate(80deg)' },
  { id: 'v61', source: 'celtic', name: '61 · Celtic Оригинальный', group: 'MIT', filter: 'none' },
  { id: 'v62', source: 'celtic', name: '62 · Celtic Чернильный', group: 'MIT', filter: 'grayscale(1) contrast(1.35)' },
  { id: 'v63', source: 'celtic', name: '63 · Celtic Золотой', group: 'MIT', filter: 'sepia(.85) saturate(2) hue-rotate(350deg)' },
  { id: 'v64', source: 'celtic', name: '64 · Celtic Серебряный', group: 'MIT', filter: 'grayscale(1) brightness(1.25) contrast(1.1)' },
  { id: 'v65', source: 'celtic', name: '65 · Celtic Бронзовый', group: 'MIT', filter: 'sepia(.8) saturate(1.5)' },
  { id: 'v66', source: 'celtic', name: '66 · Celtic Нефритовый', group: 'MIT', filter: 'sepia(.5) saturate(1.8) hue-rotate(65deg)' },
  { id: 'v67', source: 'celtic', name: '67 · Celtic Рубиновый', group: 'MIT', filter: 'sepia(.8) saturate(3) hue-rotate(300deg)' },
  { id: 'v68', source: 'celtic', name: '68 · Celtic Сапфировый', group: 'MIT', filter: 'sepia(.7) saturate(2.4) hue-rotate(170deg)' },
  { id: 'v69', source: 'celtic', name: '69 · Celtic Аметистовый', group: 'MIT', filter: 'sepia(.4) saturate(2.8) hue-rotate(220deg)' },
  { id: 'v70', source: 'celtic', name: '70 · Celtic Медный', group: 'MIT', filter: 'sepia(.8) saturate(2.1) hue-rotate(330deg)' },
  { id: 'v71', source: 'celtic', name: '71 · Celtic Слоновая кость', group: 'MIT', filter: 'grayscale(1) brightness(1.55) sepia(.3)' },
  { id: 'v72', source: 'celtic', name: '72 · Celtic Оникс', group: 'MIT', filter: 'grayscale(1) brightness(.55) contrast(1.8)' },
  { id: 'v73', source: 'celtic', name: '73 · Celtic Розовый кварц', group: 'MIT', filter: 'sepia(.3) saturate(1.5) hue-rotate(300deg)' },
  { id: 'v74', source: 'celtic', name: '74 · Celtic Лёд', group: 'MIT', filter: 'grayscale(.4) brightness(1.3) hue-rotate(160deg)' },
  { id: 'v75', source: 'celtic', name: '75 · Celtic Лесной', group: 'MIT', filter: 'sepia(.6) saturate(1.7) hue-rotate(60deg)' },
  { id: 'v76', source: 'celtic', name: '76 · Celtic Океан', group: 'MIT', filter: 'sepia(.5) saturate(2) hue-rotate(150deg)' },
  { id: 'v77', source: 'celtic', name: '77 · Celtic Закат', group: 'MIT', filter: 'sepia(.6) saturate(2.4) hue-rotate(330deg)' },
  { id: 'v78', source: 'celtic', name: '78 · Celtic Лаванда', group: 'MIT', filter: 'sepia(.3) saturate(1.8) hue-rotate(220deg)' },
  { id: 'v79', source: 'celtic', name: '79 · Celtic Песочный', group: 'MIT', filter: 'sepia(.8) saturate(.8) brightness(1.1)' },
  { id: 'v80', source: 'celtic', name: '80 · Celtic Неон', group: 'MIT', filter: 'saturate(4) hue-rotate(80deg)' },
  { id: 'v81', source: 'chessnut', name: '81 · Chessnut Оригинальный', group: 'Apache 2.0', filter: 'none' },
  { id: 'v82', source: 'chessnut', name: '82 · Chessnut Чернильный', group: 'Apache 2.0', filter: 'grayscale(1) contrast(1.35)' },
  { id: 'v83', source: 'chessnut', name: '83 · Chessnut Золотой', group: 'Apache 2.0', filter: 'sepia(.85) saturate(2) hue-rotate(350deg)' },
  { id: 'v84', source: 'chessnut', name: '84 · Chessnut Серебряный', group: 'Apache 2.0', filter: 'grayscale(1) brightness(1.25) contrast(1.1)' },
  { id: 'v85', source: 'chessnut', name: '85 · Chessnut Бронзовый', group: 'Apache 2.0', filter: 'sepia(.8) saturate(1.5)' },
  { id: 'v86', source: 'chessnut', name: '86 · Chessnut Нефритовый', group: 'Apache 2.0', filter: 'sepia(.5) saturate(1.8) hue-rotate(65deg)' },
  { id: 'v87', source: 'chessnut', name: '87 · Chessnut Рубиновый', group: 'Apache 2.0', filter: 'sepia(.8) saturate(3) hue-rotate(300deg)' },
  { id: 'v88', source: 'chessnut', name: '88 · Chessnut Сапфировый', group: 'Apache 2.0', filter: 'sepia(.7) saturate(2.4) hue-rotate(170deg)' },
  { id: 'v89', source: 'chessnut', name: '89 · Chessnut Аметистовый', group: 'Apache 2.0', filter: 'sepia(.4) saturate(2.8) hue-rotate(220deg)' },
  { id: 'v90', source: 'chessnut', name: '90 · Chessnut Медный', group: 'Apache 2.0', filter: 'sepia(.8) saturate(2.1) hue-rotate(330deg)' },
  { id: 'v91', source: 'chessnut', name: '91 · Chessnut Слоновая кость', group: 'Apache 2.0', filter: 'grayscale(1) brightness(1.55) sepia(.3)' },
  { id: 'v92', source: 'chessnut', name: '92 · Chessnut Оникс', group: 'Apache 2.0', filter: 'grayscale(1) brightness(.55) contrast(1.8)' },
  { id: 'v93', source: 'chessnut', name: '93 · Chessnut Розовый кварц', group: 'Apache 2.0', filter: 'sepia(.3) saturate(1.5) hue-rotate(300deg)' },
  { id: 'v94', source: 'chessnut', name: '94 · Chessnut Лёд', group: 'Apache 2.0', filter: 'grayscale(.4) brightness(1.3) hue-rotate(160deg)' },
  { id: 'v95', source: 'chessnut', name: '95 · Chessnut Лесной', group: 'Apache 2.0', filter: 'sepia(.6) saturate(1.7) hue-rotate(60deg)' },
  { id: 'v96', source: 'chessnut', name: '96 · Chessnut Океан', group: 'Apache 2.0', filter: 'sepia(.5) saturate(2) hue-rotate(150deg)' },
  { id: 'v97', source: 'chessnut', name: '97 · Chessnut Закат', group: 'Apache 2.0', filter: 'sepia(.6) saturate(2.4) hue-rotate(330deg)' },
  { id: 'v98', source: 'chessnut', name: '98 · Chessnut Лаванда', group: 'Apache 2.0', filter: 'sepia(.3) saturate(1.8) hue-rotate(220deg)' },
  { id: 'v99', source: 'chessnut', name: '99 · Chessnut Песочный', group: 'Apache 2.0', filter: 'sepia(.8) saturate(.8) brightness(1.1)' },
] as const;

function PieceArt({ type, color, styleId }: { type: PieceSymbol; color: Color; styleId: string }) {
  const [failed, setFailed] = useState(false);
  const style = pieceStyles.find(item => item.id === styleId) ?? pieceStyles[3];
  useEffect(() => setFailed(false), [styleId, type, color]);
  const symbols: Record<PieceSymbol, string> = color === 'w'
    ? { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }
    : { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
  const key = color + type.toUpperCase();
  if (failed) return <span className={`piece-fallback ${color === 'w' ? 'piece-white' : 'piece-black'}`} aria-hidden="true">{symbols[type]}</span>;
  return <img className={`piece-art ${color === 'w' ? 'piece-white' : 'piece-black'}`} style={{ filter: style.filter }} src={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${style.source}/${key}.svg`} alt="" draggable={false} onError={() => setFailed(true)} />;
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
  const [styleId, setStyleId] = useState('v04');
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
      <header className="topbar"><a className="brand" href="#" onClick={event => event.preventDefault()} aria-label="Munchess"><span className="brand-icon">♞</span><span className="brand-name">m<span>·</span>chess</span></a><div className="topbar-right"><button className="styles-toggle" onClick={() => setShowStyles(value => !value)}>{showStyles ? "Скрыть стили" : "99 вариантов фигур"}</button><span className="rating-pill">1000 ELO</span><button className="round-button" onClick={() => setFlipped(value => !value)} title="Перевернуть доску" aria-label="Перевернуть доску"><RotateCcw size={18} /></button></div></header>

      {showStyles && <section className="style-picker" aria-label="Выбор шахматных фигур"><div className="style-picker-heading"><div><span className="eyebrow">PIECE GALLERY</span><h1>Найди свой стиль</h1><p>99 визуальных вариантов на основе наборов с разрешительными лицензиями. Нажми на карточку, чтобы примерить фигуры.</p></div><span className="style-count">{pieceStyles.length} вариантов</span></div><div className="style-grid">{pieceStyles.map((style, index) => <button key={index} className={`style-card ${styleId === style.id ? "active" : ""}`} onClick={() => setStyleId(style.id)} aria-pressed={styleId === style.id}><span className="style-preview">{(['wK', 'bN', 'wQ'] as const).map(piece => <img key={piece} src={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${style.source}/${piece}.svg`} alt="" loading="lazy" style={{ filter: style.filter }} onError={event => { event.currentTarget.style.display = "none"; }} />)}</span><span className="style-card-name">{style.name}</span><span className="style-card-group">{style.group}</span>{styleId === style.id && <span className="style-selected">Выбран</span>}</button>)}</div><p className="license-note">Источники: RhosGFX (CC0), Fantasy/Spatial/Celtic (MIT), Chessnut (Apache-2.0). Фильтры создают цветовые варианты из этих наборов. Сохрани лицензии и уведомления авторов в проекте; это не юридическая гарантия и не заменяет проверку условий конкретного набора.</p></section>}

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
