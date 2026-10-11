import { useMemo, useState } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import { Bot, DoorOpen, FlaskConical, Shield, Sparkles, RotateCcw, Trophy, Swords } from 'lucide-react';

type CardKind = 'dash' | 'transmute' | 'armor' | 'spark' | 'trap';
type DoorCard = { id: number; kind: CardKind; name: string; subtitle: string; description: string; icon: string; tone: string };
type ActiveEffect = { kind: CardKind; color: Color; target?: Square; turns: number; cardName: string };

const cardTemplates: Omit<DoorCard, 'id'>[] = [
  { kind: 'dash', name: 'Зелье рывка', subtitle: 'ЗЕЛЬЕ · РЕДКОЕ', description: 'Выбери свою пешку. В следующий ход она может пройти вперёд до 3 клеток, если путь свободен.', icon: '🧪', tone: 'violet' },
  { kind: 'transmute', name: 'Зелье превращения', subtitle: 'ЗЕЛЬЕ · МАГИЯ', description: 'Выбери своего коня. В следующий ход он движется как ферзь, но не перепрыгивает фигуры.', icon: '✨', tone: 'blue' },
  { kind: 'armor', name: 'Кольчуга на удачу', subtitle: 'БРОНЯ · СНАРЯЖЕНИЕ', description: 'Выбери свою фигуру. Первое вражеское взятие по ней будет отменено, а броня исчезнет.', icon: '🛡️', tone: 'gold' },
  { kind: 'spark', name: 'Искра вдохновения', subtitle: 'БЛАГОСЛОВЕНИЕ', description: 'Сними усталость: получи ещё одну карту двери после следующего хода.', icon: '⚡', tone: 'green' },
  { kind: 'trap', name: 'Проклятая дверь', subtitle: 'ПРОКЛЯТИЕ', description: 'Компьютер получает случайную фигуру под защитой до своего следующего хода. Да, дверь с характером.', icon: '🕯️', tone: 'red' },
];

const pieceGlyph: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

function freshGame() { return new Chess(); }
function createCard(id: number): DoorCard {
  const template = cardTemplates[Math.floor(Math.random() * cardTemplates.length)];
  return { ...template, id };
}
function squareColor(square: Square) {
  const file = files.indexOf(square[0]);
  const rank = Number(square[1]);
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
}
function fenRows(fen: string) { return fen.split(' '); }
function rawMove(chess: Chess, from: Square, to: Square, color: Color): boolean {
  const board = chess.board();
  const moving = board.flat().find(p => p?.square === from);
  if (!moving || moving.color !== color) return false;
  const target = board.flat().find(p => p?.square === to);
  if (target?.color === color || target?.type === 'k') return false;
  const parts = fenRows(chess.fen());
  const rows = parts[0].split('/');
  const matrix = rows.map(row => {
    const expanded: string[] = [];
    for (const char of row) {
      if (/\d/.test(char)) expanded.push(...Array(Number(char)).fill(''));
      else expanded.push(char);
    }
    return expanded;
  });
  const idx = (sq: Square) => ({ r: 8 - Number(sq[1]), c: files.indexOf(sq[0]) });
  const a = idx(from), b = idx(to);
  matrix[a.r][a.c] = '';
  matrix[b.r][b.c] = moving.color === 'w' ? moving.type.toUpperCase() : moving.type;
  parts[0] = matrix.map(row => {
    let out = '', empty = 0;
    for (const cell of row) {
      if (!cell) empty++;
      else { if (empty) out += empty; out += cell; empty = 0; }
    }
    if (empty) out += empty;
    return out;
  }).join('/');
  parts[1] = color === 'w' ? 'b' : 'w';
  parts[3] = '-';
  parts[4] = '0';
  if (color === 'b') parts[5] = String(Number(parts[5] || '1') + 1);
  try {
    chess.load(parts.join(' '));
    if (chess.isCheck()) return false;
    return true;
  } catch {
    return false;
  }
}
function lineIsClear(chess: Chess, from: Square, to: Square) {
  const dx = files.indexOf(to[0]) - files.indexOf(from[0]);
  const dy = Number(to[1]) - Number(from[1]);
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (!steps) return false;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  for (let i = 1; i < steps; i++) {
    const sq = `${files[files.indexOf(from[0]) + sx * i]}${Number(from[1]) + sy * i}` as Square;
    if (chess.get(sq)) return false;
  }
  return true;
}
function customMove(chess: Chess, from: Square, to: Square, kind: CardKind, color: Color) {
  const piece = chess.get(from);
  if (!piece || piece.color !== color) return false;
  const dx = Math.abs(files.indexOf(to[0]) - files.indexOf(from[0]));
  const dy = Math.abs(Number(to[1]) - Number(from[1]));
  if (kind === 'dash') {
    const forward = color === 'w' ? 1 : -1;
    const distance = Number(to[1]) - Number(from[1]);
    if (piece.type !== 'p' || dx !== 0 || distance * forward < 1 || distance * forward > 3 || chess.get(to)) return false;
    for (let step = 1; step <= distance * forward; step++) {
      const sq = `${from[0]}${Number(from[1]) + forward * step}` as Square;
      if (chess.get(sq)) return false;
    }
    if (Number(to[1]) === (color === 'w' ? 8 : 1)) return false;
    return rawMove(chess, from, to, color);
  }
  if (kind === 'transmute') {
    if (piece.type !== 'n' || chess.get(to)) return false;
    if (!(dx === 0 || dy === 0 || dx === dy) || !lineIsClear(chess, from, to)) return false;
    return rawMove(chess, from, to, color);
  }
  return false;
}

export default function App() {
  const [game, setGame] = useState<Chess>(() => freshGame());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [hand, setHand] = useState<DoorCard[]>(() => [createCard(1), createCard(2), createCard(3)]);
  const [nextCardId, setNextCardId] = useState(4);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [chosenCard, setChosenCard] = useState<DoorCard | null>(null);
  const [log, setLog] = useState<string[]>(['Добро пожаловать в таверну. Компьютер уже точит пешки.']);
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{from: Square; to: Square} | null>(null);
  const [extraDraw, setExtraDraw] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const board = game.board();
  const currentTurn = game.turn();
  const gameOver = game.isGameOver();
  const status = game.isCheckmate() ? (currentTurn === 'w' ? 'Мат. Компьютер победил.' : 'Мат! Ты победил.') :
    game.isDraw() ? 'Ничья. Даже магия не помогла.' :
    currentTurn === 'w' ? 'Твой ход' : 'Ход компьютера';
  const playerEffects = activeEffects.filter(e => e.color === 'w');
  const armorSquares = new Set(activeEffects.filter(e => e.kind === 'armor').map(e => e.target));
  const selectedEffect = chosenCard?.kind === 'dash' || chosenCard?.kind === 'transmute' ? chosenCard.kind : null;

  const addLog = (message: string) => setLog(old => [message, ...old].slice(0, 5));
  const addDoor = (count = 1) => {
    setHand(old => [...old, ...Array.from({ length: count }, (_, i) => createCard(nextCardId + i))]);
    setNextCardId(id => id + count);
  };
  const drawAfterMove = (mover: Color) => {
    const card = createCard(nextCardId);
    setNextCardId(id => id + 1);
    if (mover === 'w') {
      setHand(old => [...old, card]);
      addLog(`🚪 Дверь открыта: «${card.name}».`);
      if (extraDraw) { setHand(old => [...old, createCard(nextCardId + 1)]); setNextCardId(id => id + 1); setExtraDraw(false); addLog('⚡ Искра дала ещё одну карту!'); }
    } else {
      addLog(`🤖 Компьютер открыл дверь: «${card.name}».`);
      if (card.kind === 'armor' || card.kind === 'dash' || card.kind === 'transmute') {
        const own = game.board().flat().filter(p => p?.color === 'b' && (card.kind !== 'dash' || p.type === 'p') && (card.kind !== 'transmute' || p.type === 'n'));
        if (own.length) {
          const target = own[Math.floor(Math.random() * own.length)]!.square;
          setActiveEffects(old => [...old, { kind: card.kind, color: 'b', target, turns: 1, cardName: card.name }]);
          addLog(`🤖 Компьютер усиливает ${target} картой «${card.name}».`);
        }
      }
    }
  };
  const runComputer = (position: Chess) => {
    if (position.isGameOver()) { setThinking(false); return; }
    setThinking(true);
    window.setTimeout(() => {
      const moves = position.moves({ verbose: true });
      if (!moves.length) { setThinking(false); return; }
      const captures = moves.filter(m => m.captured);
      const checks = moves.filter(m => m.san.includes('+') || m.san.includes('#'));
      const pool = checks.length ? checks : captures.length ? captures : moves;
      const move = pool[Math.floor(Math.random() * pool.length)];
      const before = position.fen();
      try {
        position.move(move);
        const next = new Chess(position.fen());
        setGame(next);
        setLastMove({ from: move.from, to: move.to });
        setSelected(null); setLegalTargets([]);
        const capturedPiece = move.captured ? ' Взятие!' : '';
        addLog(`🤖 Компьютер: ${move.san}.${capturedPiece}`);
        setActiveEffects(old => old.filter(e => !(e.color === 'b' && e.turns <= 1)));
        drawAfterMove('b');
        setTurnCount(c => c + 1);
      } catch { position.load(before); }
      setThinking(false);
    }, 500);
  };

  const finishPlayerMove = (next: Chess, from: Square, to: Square, label?: string) => {
    setGame(next);
    setLastMove({ from, to });
    setSelected(null); setLegalTargets([]); setChosenCard(null);
    addLog(`♟️ Ты: ${from} → ${to}${label ? ` · ${label}` : ''}.`);
    drawAfterMove('w');
    setTurnCount(c => c + 1);
    setActiveEffects(old => old.filter(e => !(e.color === 'w' && e.turns <= 1)));
    if (!next.isGameOver()) runComputer(new Chess(next.fen()));
  };

  const onSquareClick = (square: Square) => {
    if (currentTurn !== 'w' || thinking || gameOver) return;
    const piece = game.get(square);
    if (chosenCard) {
      if (chosenCard.kind === 'spark') {
        setExtraDraw(true);
        setHand(old => old.filter(c => c.id !== chosenCard.id));
        setChosenCard(null);
        addLog('⚡ Искра вдохновения: следующая дверь даст дополнительную карту.');
        return;
      }
      if (chosenCard.kind === 'trap') {
        setActiveEffects(old => [...old, { kind: 'trap', color: 'b', target: square, turns: 1, cardName: chosenCard.name }]);
        setHand(old => old.filter(c => c.id !== chosenCard.id));
        setChosenCard(null);
        addLog('🕯️ Проклятие наложено на компьютерную фигуру.');
        return;
      }
      if (chosenCard.kind === 'armor') {
        if (!piece || piece.color !== 'w') { addLog('Выбери свою фигуру, чтобы надеть броню.'); return; }
        setActiveEffects(old => [...old.filter(e => !(e.kind === 'armor' && e.target === square)), { kind: 'armor', color: 'w', target: square, turns: 99, cardName: chosenCard.name }]);
        setHand(old => old.filter(c => c.id !== chosenCard.id));
        setChosenCard(null);
        addLog(`🛡️ ${square}: броня готова принять первый удар.`);
        return;
      }
      if (selectedEffect && piece?.color === 'w' && piece.type === (selectedEffect === 'dash' ? 'p' : 'n')) {
        setActiveEffects(old => [...old.filter(e => !(e.kind === selectedEffect && e.color === 'w')), { kind: selectedEffect, color: 'w', target: square, turns: 1, cardName: chosenCard.name }]);
        setHand(old => old.filter(c => c.id !== chosenCard.id));
        setChosenCard(null); setSelected(square);
        addLog(`✨ ${square}: ${chosenCard.name}. Эффект готов к следующему ходу этой фигуры.`);
        return;
      }
      addLog('Выбери подходящую свою фигуру.');
      return;
    }
    if (selected) {
      const effect = activeEffects.find(e => e.color === 'w' && e.target === selected && (e.kind === 'dash' || e.kind === 'transmute'));
      if (effect && (effect.kind === 'dash' || effect.kind === 'transmute')) {
        const next = new Chess(game.fen());
        if (customMove(next, selected, square, effect.kind, 'w')) {
          finishPlayerMove(next, selected, square, effect.cardName);
          return;
        }
      }
      try {
        const next = new Chess(game.fen());
        const target = next.get(square);
        if (target && target.color === 'b' && armorSquares.has(square)) {
          setActiveEffects(old => old.filter(e => !(e.kind === 'armor' && e.target === square)));
          setSelected(null); setLegalTargets([]);
          addLog(`🛡️ Броня на ${square} поглотила удар! Фигура выстояла.`);
          return;
        }
        const move = next.move({ from: selected, to: square, promotion: 'q' });
        finishPlayerMove(next, selected, square, move.san);
        return;
      } catch { /* invalid move, allow selecting another piece */ }
    }
    if (piece?.color === 'w') {
      setSelected(square);
      const moves = game.moves({ square, verbose: true }).map(m => m.to as Square);
      const effect = activeEffects.find(e => e.color === 'w' && e.target === square && (e.kind === 'dash' || e.kind === 'transmute'));
      if (effect) {
        for (const target of files.flatMap(f => ranks.map(r => `${f}${r}` as Square))) {
          if (customMove(new Chess(game.fen()), square, target, effect.kind, 'w')) moves.push(target);
        }
      }
      setLegalTargets([...new Set(moves)]);
    } else {
      setSelected(null); setLegalTargets([]);
    }
  };

  const useCard = (card: DoorCard) => {
    if (thinking || currentTurn !== 'w' || gameOver) return;
    if (chosenCard?.id === card.id) { setChosenCard(null); return; }
    setChosenCard(card);
    addLog(`Выбрана карта «${card.name}». ${card.kind === 'spark' ? 'Нажми на карту ещё раз или на доску, чтобы применить.' : 'Теперь выбери цель на доске.'}`);
  };

  const resetGame = () => {
    setGame(freshGame()); setSelected(null); setLegalTargets([]); setHand([createCard(1), createCard(2), createCard(3)]);
    setNextCardId(4); setActiveEffects([]); setChosenCard(null); setLog(['Новая партия! Двери снова закрыты.']); setThinking(false); setLastMove(null); setExtraDraw(false); setTurnCount(0);
  };

  const pieceCount = useMemo(() => board.flat().filter(Boolean).length, [board]);
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={e => e.preventDefault()}><span className="brand-mark">M</span><span>M-CHESS<small>CARDS & CHECKMATE</small></span></a>
        <div className="top-status"><span className="live-dot" /> ЛОКАЛЬНАЯ ПАРТИЯ <span className="top-divider">/</span> БЕЗ СЕРВЕРА</div>
        <button className="icon-button" onClick={resetGame} title="Начать заново" aria-label="Начать заново"><RotateCcw size={17} /></button>
      </header>

      <section className="hero-row">
        <div><div className="eyebrow"><Sparkles size={13} /> ШАХМАТЫ С ХАРАКТЕРОМ</div><h1>Открой дверь.<br /><em>Измени правила.</em></h1><p>Обычные шахматы? Только пока дверь закрыта.</p></div>
        <div className="match-card"><div className="match-avatars"><span className="avatar player-avatar">♙</span><span className="versus">VS</span><span className="avatar bot-avatar"><Bot size={20} /></span></div><div className="match-info"><strong>Ты <span>против</span> Компьютера</strong><small>Партия #{String(turnCount + 1).padStart(3, '0')} · {pieceCount} фигур на доске</small></div><div className="match-badge"><span /> LIVE</div></div>
      </section>

      <div className="game-layout">
        <section className="board-column">
          <div className="section-heading"><div><span className="section-index">01</span><h2>Поле битвы</h2></div><div className={currentTurn === 'w' ? 'turn-pill your-turn' : 'turn-pill'}><span className="turn-dot" />{thinking ? 'КОМПЬЮТЕР ДУМАЕТ' : status.toUpperCase()}</div></div>
          <div className="board-frame">
            <div className="board-coordinates left-coords">{ranks.map(r => <span key={r}>{r}</span>)}</div>
            <div className="chessboard" role="grid" aria-label="Шахматная доска">
              {ranks.map((rank, row) => files.map((file, col) => {
                const square = `${file}${rank}` as Square;
                const piece = game.get(square);
                const isSelected = selected === square;
                const isTarget = legalTargets.includes(square);
                const isLast = lastMove?.from === square || lastMove?.to === square;
                const isProtected = armorSquares.has(square);
                return <button key={square} role="gridcell" aria-label={`${square}${piece ? `, ${piece.color === 'w' ? 'белая' : 'чёрная'} ${piece.type}` : ''}`} className={`square ${squareColor(square)} ${isSelected ? 'selected' : ''} ${isLast ? 'last-move' : ''} ${isTarget ? (piece ? 'capture-target' : 'move-target') : ''} ${isProtected ? 'armored' : ''}`} onClick={() => onSquareClick(square)}>
                  {isTarget && !piece && <span className="target-dot" />}
                  {piece && <span className={`piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}>{pieceGlyph[piece.color + piece.type.toUpperCase()]}</span>}
                  {isProtected && <span className="armor-mark">✦</span>}
                  {col === 0 && <span className="rank-label">{rank}</span>}
                  {row === 7 && <span className="file-label">{file}</span>}
                </button>;
              }))}
            </div>
            <div className="board-coordinates right-coords">{ranks.map(r => <span key={r}>{r}</span>)}</div>
          </div>
          <div className="board-footer"><div className="legend"><span><i className="legend-dot legal" /> Возможный ход</span><span><i className="legend-dot shield" /> Броня</span></div><span className="board-note"><Swords size={13} /> КОРОЛЬ ПОКА ПОД ЗАЩИТОЙ</span></div>
        </section>

        <aside className="side-column">
          <section className="door-panel">
            <div className="panel-top"><div className="eyebrow"><DoorOpen size={13} /> СЛУЧАЙНОСТЬ ЖДЁТ</div><span className="door-count">∞</span></div>
            <div className="door-art"><div className="door-halo" /><div className="door-emoji">🚪</div><div className="door-glow" /></div>
            <h3>Дверь закрыта</h3><p>Сделай ход, чтобы узнать, что за ней.</p>
            <div className="door-rule"><span className="rule-symbol">↳</span><span>Каждый ход открывает <b>1 карту двери</b></span></div>
          </section>
          <section className="effects-panel">
            <div className="mini-heading"><h3>Активные эффекты</h3><span>{playerEffects.length}</span></div>
            {playerEffects.length === 0 ? <div className="empty-effects"><Sparkles size={15} /><span>Пока никаких чар.<br /><small>Карты меняют правила игры.</small></span></div> : playerEffects.map((effect, i) => <div className="effect-row" key={i}><span className="effect-icon">{effect.kind === 'armor' ? '🛡️' : effect.kind === 'dash' ? '🧪' : '✨'}</span><span><b>{effect.cardName}</b><small>Фигура {effect.target} · временный эффект</small></span></div>)}
          </section>
          <section className="log-panel"><div className="mini-heading"><h3>Хроника партии</h3><span>LIVE</span></div><div className="log-list">{log.map((item, i) => <div className={`log-entry ${i === 0 ? 'new-log' : ''}`} key={i}><span className="log-line" />{item}</div>)}</div></section>
        </aside>
      </div>

      <section className="cards-section">
        <div className="section-heading cards-heading"><div><span className="section-index">02</span><h2>Твоя рука</h2><span className="hand-count">{hand.length} КАРТ</span></div><span className="cards-hint"><FlaskConical size={14} /> Выбери карту, затем цель на доске</span></div>
        <div className="cards-row">
          {hand.map(card => <button key={card.id} className={`door-card ${card.tone} ${chosenCard?.id === card.id ? 'card-chosen' : ''}`} onClick={() => useCard(card)}>
            <span className="card-topline"><span>{card.subtitle}</span><span className="card-number">#{String(card.id).padStart(2, '0')}</span></span>
            <span className="card-art"><span className="card-art-ring" /><span className="card-emoji">{card.icon}</span><span className="card-spark spark-one">✦</span><span className="card-spark spark-two">✧</span></span>
            <span className="card-name">{card.name}</span><span className="card-description">{card.description}</span>
            <span className="card-action">{chosenCard?.id === card.id ? 'ВЫБРАНА ✓' : card.kind === 'spark' ? 'ИГРАТЬ КАРТУ' : 'ВЫБРАТЬ ЦЕЛЬ'} <span>↗</span></span>
          </button>)}
          <div className="deck-card"><div className="deck-pattern"><span>✦</span><b>M</b><span>✦</span></div><div className="deck-bottom"><span>КОЛОДА ДВЕРЕЙ</span><small>ТЯНИ ПОСЛЕ ХОДА</small></div></div>
        </div>
        {chosenCard && <div className="selected-card-note"><Sparkles size={15} /><span><b>{chosenCard.name}:</b> {chosenCard.kind === 'spark' ? 'нажми на карту повторно, чтобы сыграть её.' : chosenCard.kind === 'trap' ? 'выбери клетку с чёрной фигурой.' : 'выбери подходящую фигуру на доске.'}</span><button onClick={() => setChosenCard(null)}>Отмена</button></div>}
      </section>

      <footer className="footer"><span>♟ M-CHESS <i>·</i> ПРОТОТИП 0.1</span><span>СДЕЛАНО ДЛЯ ТЕХ, КОМУ ОБЫЧНЫХ ШАХМАТ МАЛО.</span><button onClick={resetGame}><Trophy size={13} /> НОВАЯ ПАРТИЯ</button></footer>
    </main>
  );
}