const fs = require('fs');
const etabsData = JSON.parse(fs.readFileSync('etabs_beam_data.json', 'utf8'));
const jsCode = fs.readFileSync('etabs_hub_test.js', 'utf8');

const elements = {};
const calls = [];

function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      style: {},
      className: '',
      classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false },
      getBoundingClientRect: () => ({ width: 920, height: 370 }),
      parentElement: { clientWidth: 920 },
      dataset: {},
      options: [{ value: '2D16', selected: true, dataset: { area: '4.02' } }],
      selectedIndex: 0,
      appendChild: ()=>{},
      addEventListener: ()=>{}
    };
  }
  return elements[id];
}

const canvas = getEl('brmDrawingCanvas');
canvas.getContext = () => new Proxy({}, {
  get(t, prop) {
    if (prop === 'fillText') return (txt, x, y) => calls.push({ op: 'fillText', txt, x: Math.round(x), y: Math.round(y) });
    if (prop === 'fillRect') return (x, y, w, h) => calls.push({ op: 'fillRect', x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    return () => {};
  },
  set: () => true
});

global.document = { getElementById: getEl, createElement: getEl, addEventListener: ()=>{} };
global.window = { devicePixelRatio: 1 };
global.etabsData = etabsData;

const vm = require('vm');
const context = vm.createContext({
  console, document: global.document, window: global.window, etabsData, setTimeout: fn=>fn(),
  THREE: { Raycaster: function(){}, Vector2: function(){}, Scene: function(){}, Color: function(){} }
});

vm.runInContext(jsCode, context);
const beamB9 = etabsData.beams.find(b => b.label === 'B9' && b.story === 'T3');
context.openBeamRebarModal(beamB9);

console.log('Total drawing operations:', calls.length);
console.log('Sample text operations:', calls.filter(c => c.op === 'fillText').slice(0, 10));
console.log('Any NaNs?', calls.filter(c => Object.values(c).some(v => typeof v === 'number' && isNaN(v))));

