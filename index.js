import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div, input, pre, h2} from '@cycle/dom';
import _ from 'lodash';
import xs from 'xstream';

const ALL_PAIRS = _.uniqBy(
  _.range(200).map(BushingPair),
  JSON.stringify
);

const BUSHING_COLORS = {
  '78a': '#0000FF',
  '81a': '#FF6600',
  '85a': '#FFFF00',
  '87a': '#9900FF',
  '90a': '#FF0000',
  '93a': '#00CC00',
  '95a': '#CCECB8',
  '97a': '#FF00FF'
};

function renderBushing (duro) {
  const style = {
    background: BUSHING_COLORS[duro]
  };

  return (
    div('.bushing', {style}, duro)
  );
}

function renderPair ({roadside, boardside}, i, sliderDirection) {
  let removeX = 3 * 80;
  let startX = -80;

  console.log(sliderDirection);

  if (sliderDirection === 1) {
    removeX = -80;
    startX = 3 * 80;
  }

  const style = {
    opacity: 0,

    delayed: {
      opacity: 1,
      transform: `translateX(${i * 80}px)`
    },

    remove: {
      opacity: 0,
      transform: `translateX(${removeX}px)`
    },

    transform: `translateX(${startX}px)`
  };

  return (
    div('.pair', {style, key: roadside + boardside}, [
      renderBushing(roadside),
      renderBushing(boardside)
    ])
  );
}

function renderBushingPairs (bushingPairs, sliderDirection) {
  const order = ['soft', 'medium', 'hard']

  return (
    div('.bushing-pairs',
      order.map((pairName, i) => renderPair(bushingPairs[pairName], i, sliderDirection))
    )
  );
}

function view ([weight, bushingPairs, sliderDirection]) {
  return (
    div('.bushing-picker', [
      input('.weight', {attrs: {type: 'range', min: 40, max: 120}}),
      div('.recommendations', [
        h2(`Bushings for a ${weight}kg rider:`),
        renderBushingPairs(bushingPairs, sliderDirection)
      ])
    ])
  );
}

function main ({DOM}) {
  const weight$ = DOM
    .select('.weight')
    .events('input')
    .map(event => parseInt(event.target.value, 10))
    .startWith(70)
    .remember();

  const bushingPairs$ = weight$.map(weightToBushingPairs);

  const sliderDirection$ = weight$
    .fold(({last}, current) => ({change: Math.sign(current - last), last: current}), {last: 70, change: 0})
    .map(({change}) => change);

  return {
    DOM: xs.combine(weight$, bushingPairs$, sliderDirection$).map(view)
  };
}

function weightToBushingPairs (weight) {
  const pair = BushingPair(weight);

  const pairIndex = _.findIndex(ALL_PAIRS, otherPair => _.isEqual(pair, otherPair));

  return {
    soft:   ALL_PAIRS[Math.max(0, pairIndex - 1)],
    medium: pair,
    hard:   ALL_PAIRS[Math.min(ALL_PAIRS.length - 1, pairIndex + 1)]
  };
}

function BushingPair (weight) {
  return {
    boardside: weightToDuro(weight, true),
    roadside: weightToDuro(weight, false)
  }
}

function weightToDuro (weight, boardside = true) {
  const bushings = [78, 81, 85, 87, 90, 93, 95, 97];

  if (!boardside) {
    weight -= 5;
  }

  weight -= 40;

  if (weight < 0) {
    weight = 0;
  }

  const approxDuro = Math.pow((weight), 0.66) + 79;

  const duro = _.minBy(bushings, x => Math.abs(x - approxDuro));

  return duro.toString() + 'a';
}

const drivers = {
 DOM: makeDOMDriver('.app', {
    modules: [
      require('snabbdom/modules/class'),
      require('snabbdom/modules/props'),
      require('snabbdom/modules/attributes'),
      require('snabbdom/modules/eventlisteners'),
      require('snabbdom/modules/style'),
      require('snabbdom/modules/hero')
    ]
  }),
};

run(main, drivers);
