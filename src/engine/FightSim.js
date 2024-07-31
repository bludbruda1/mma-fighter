"use strict";
// from https://github.com/zengm-games/zengm/blob/master/src/worker/core/GameSim.basketball/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateAction =
  exports.pickFighter =
  exports.doPunch =
  exports.probPunch =
  exports.doKick =
  exports.probKick =
    void 0;
const ROUND_CLOCK = 300; //5 min rounds, will want this to be customisable in the future
const ROUND_NUMBER = 3; //Again customisable as a main event/championship should be 5 rounds
// pick the fighter to do something
const pickFighter = (fighters, lastActionFighter) => {
  let ratios = [
    fighters[0].compositeRating.output,
    fighters[1].compositeRating.output,
  ];
  // If lastActionFighter is provided, slightly decrease their chance of being picked again
  if (lastActionFighter !== undefined) {
    ratios[lastActionFighter] *= 0.9;
  }
  const sum = ratios[0] + ratios[1];
  // Special case for both fighters having 0 ratio - randomly pick one
  if (sum === 0) {
    return Math.random() < 0.5 ? 0 : 1;
  }
  const rand = Math.random() * sum;
  // If rand is less than the ratio of fighter 0, pick fighter 0, otherwise pick fighter 1
  return rand < ratios[0] ? 0 : 1;
};
exports.pickFighter = pickFighter;
// Kicks
const probKick = (kickingRating, strikingRating) => {
  const total = kickingRating + strikingRating;
  return kickingRating / total;
};
exports.probKick = probKick;
const doKick = (attacker, opponent, events) => {
  opponent.health -= 15;
  const event = `${attacker.name} kicks ${opponent.name}! ${opponent.name}'s health: ${opponent.health}`;
  console.log(event);
  events.push(event);
};
exports.doKick = doKick;
//punch
const probPunch = (kickingRating, strikingRating) => {
  const total = kickingRating + strikingRating;
  return strikingRating / total;
};
exports.probPunch = probPunch;
const doPunch = (attacker, opponent, events) => {
  opponent.health -= 10;
  const event = `${attacker.name} punches ${opponent.name}! ${opponent.name}'s health: ${opponent.health}`;
  console.log(event);
  events.push(event);
};
exports.doPunch = doPunch;
//simulate fight
const simulateAction = (fighters, actionFighter, events) => {
  const opponent = actionFighter === 0 ? 1 : 0;
  const fighter = fighters[actionFighter];
  if (
    Math.random() <
    (0, exports.probKick)(
      fighter.compositeRating.kicking,
      fighter.compositeRating.striking
    )
  ) {
    (0, exports.doKick)(fighter, fighters[opponent], events);
  } else {
    (0, exports.doPunch)(fighter, fighters[opponent], events);
  }
  if (fighters[opponent].health <= 0) {
    const event = `${fighters[actionFighter].name} wins! ${fighters[actionFighter].name}'s health: ${fighters[actionFighter].health}`;
    console.log(event);
    events.push(event);
    return true; // Fight over
  }
  return false; // Fight continues
};
exports.simulateAction = simulateAction;
