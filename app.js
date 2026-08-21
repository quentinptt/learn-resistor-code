const colors = [
  { name: 'black', value: 0, hex: '#25272a' }, { name: 'brown', value: 1, hex: '#70452e' },
  { name: 'red', value: 2, hex: '#c4473d' }, { name: 'orange', value: 3, hex: '#df772d' },
  { name: 'yellow', value: 4, hex: '#dfba3b' }, { name: 'green', value: 5, hex: '#4f8b53' },
  { name: 'blue', value: 6, hex: '#4776a5' }, { name: 'violet', value: 7, hex: '#795a9b' },
  { name: 'grey', value: 8, hex: '#8a8b87' }, { name: 'white', value: 9, hex: '#f0ede3' },
  { name: 'gold', value: null, hex: '#c9a443' }, { name: 'silver', value: null, hex: '#a9aaa4' }
];
const tolerances = [{name:'brown', text:'±1%'}, {name:'red', text:'±2%'}, {name:'green', text:'±0.5%'}, {name:'blue', text:'±0.25%'}, {name:'violet', text:'±0.1%'}, {name:'gold', text:'±5%'}, {name:'silver', text:'±10%'}];
const tempcos = [{name:'brown', text:'100 ppm/K'}, {name:'red', text:'50 ppm/K'}, {name:'orange', text:'15 ppm/K'}, {name:'yellow', text:'25 ppm/K'}, {name:'blue', text:'10 ppm/K'}, {name:'violet', text:'5 ppm/K'}];
const digitColors = colors.slice(0, 10);
const multiplierColors = colors.slice(0, 8);
let round = 0, score = 0, streak = 0, bestStreak = 0, current = null, checked = false;
const $ = id => document.getElementById(id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function formatOhms(value) { if (value >= 1000000) return `${+(value/1000000).toFixed(2)} MΩ`; if (value >= 1000) return `${+(value/1000).toFixed(2)} kΩ`; return `${value} Ω`; }
function createQuestion() {
  const bandCount = 3 + Math.floor(Math.random() * 4), digits = bandCount >= 5 ? 3 : 2;
  const digitBands = Array.from({length:digits}, (_, i) => pick(digitColors.filter(c => !(i === 0 && c.value === 0))));
  const multiplierBand = pick(multiplierColors);
  const tolerance = pick(tolerances), tempco = pick(tempcos);
  // The first 2–3 bands form the significant number; the next band is a power of ten.
  // For example: blue (6), yellow (4), brown (×10) = 64 × 10 = 640 Ω.
  const significantValue = digitBands.reduce((total, band) => total * 10 + band.value, 0);
  const raw = significantValue * Math.pow(10, multiplierBand.value);
  return { bandCount, bands:[...digitBands, multiplierBand, ...(bandCount >= 4 ? [colors.find(c=>c.name===tolerance.name)] : []), ...(bandCount === 6 ? [colors.find(c=>c.name===tempco.name)] : [])], value:raw, tolerance, tempco };
}
function renderQuestion() {
  current = createQuestion(); checked = false;
  $('round-label').textContent = `ROUND ${String(round + 1).padStart(2,'0')} / 10`;
  $('progress-bar').style.width = `${(round / 10) * 100}%`;
  $('band-count').textContent = current.bandCount;
  $('band-hint').textContent = current.bandCount === 3 ? '• digits + multiplier' : current.bandCount === 6 ? '• includes temp. coefficient' : '• first bands are digits';
  $('bands').innerHTML = current.bands.map(c => `<span class="band" title="${c.name}" style="background:${c.hex}"></span>`).join('');
  const roles = current.bandCount === 3
    ? ['digit 1', 'digit 2', 'multiplier']
    : current.bandCount === 4
      ? ['digit 1', 'digit 2', 'multiplier', 'tolerance']
      : current.bandCount === 5
        ? ['digit 1', 'digit 2', 'digit 3', 'multiplier', 'tolerance']
        : ['digit 1', 'digit 2', 'digit 3', 'multiplier', 'tolerance', 'temperature coefficient'];
  const labels = current.bands.map((c,i) => `<span class="legend-item"><i class="legend-dot" style="background:${c.hex}"></i>${roles[i] === 'tolerance' ? current.tolerance.text : roles[i]}</span>`);
  $('band-legend').innerHTML = labels.join('');
  $('answer').value = ''; $('answer').disabled = false; $('unit').disabled = false; $('unit').value = '1'; $('answer').focus(); $('check-button').classList.remove('hidden'); $('feedback').className = 'feedback hidden';
  $('streak-label').textContent = `STREAK ${streak}`;
}
function parseAnswer(input) { return parseFloat(input.replace(/,/g, '.')) * Number($('unit').value); }
function showFeedback(correct) {
  checked = true; $('answer').disabled = true; $('unit').disabled = true; $('check-button').classList.add('hidden'); const f = $('feedback'); f.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
  f.innerHTML = `<strong>${correct ? 'Correct — nice reading.' : 'Not quite this time.'}</strong>${correct ? `That resistor is ${formatOhms(current.value)}.` : `The correct value is ${formatOhms(current.value)}.`}<button id="next-button" type="button">${round === 9 ? 'See score →' : 'Next resistor →'}</button>`;
  $('next-button').addEventListener('click', nextRound);
}
function nextRound() { round++; if (round >= 10) showResult(); else renderQuestion(); }
function showResult() { $('game-screen').classList.add('hidden'); $('result-screen').classList.remove('hidden'); $('final-score').textContent = score; $('accuracy').textContent = `${score * 10}%`; $('best-streak').textContent = bestStreak; $('total-bands').textContent = window.totalBands; $('result-title').textContent = score >= 8 ? 'Excellent work.' : score >= 5 ? 'Nice work.' : 'Keep practicing.'; }
function startGame() { round=0; score=0; streak=0; bestStreak=0; window.totalBands=0; $('start-screen').classList.add('hidden'); $('result-screen').classList.add('hidden'); $('game-screen').classList.remove('hidden'); renderQuestion(); }
$('start-button').addEventListener('click', startGame); $('again-button').addEventListener('click', startGame);
$('answer-form').addEventListener('submit', e => { e.preventDefault(); if (checked) return; const value = parseAnswer($('answer').value); if (!Number.isFinite(value)) return $('answer').focus(); const correct = Math.abs(value - current.value) < 0.001; window.totalBands += current.bandCount; if (correct) { score++; streak++; bestStreak=Math.max(bestStreak,streak); } else streak=0; $('score').textContent=score; $('streak-label').textContent=`STREAK ${streak}`; showFeedback(correct); });
