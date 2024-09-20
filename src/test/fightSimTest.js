// to run the test: src/tests/fightSimTest.js

import { simulateFight, FIGHTER_POSITIONS } from '../engine/FightSim.js';
import { 
  doKick, 
  doPunch, 
  doGroundPunch, 
  doTakedown, 
  doGetUp, 
  doSubmission 
} from '../engine/FightSim.js';

// Helper function to create a basic fighter object
const createFighter = (name, attributes) => ({
  name,
  health: { head: 1000, body: 1000, legs: 1000 },
  maxHealth: { head: 1000, body: 1000, legs: 1000 },
  stamina: 1000,
  position: FIGHTER_POSITIONS.STANDING,
  roundsWon: 0,
  Rating: {
    output: 94,
    strength: 91,
    speed: 89,
    cardio: 90,
    toughness: 96,
    chin: 93,
    striking: 94,
    punchPower: 95,
    handSpeed: 91,
    punchAccuracy: 92,
    kicking: 93,
    kickPower: 94,
    kickSpeed: 90,
    kickAccuracy: 91,
    strikingDefence: 85,
    kickDefence: 86,
    headMovement: 84,
    footwork: 88,
    takedownOffence: 73,
    takedownDefence: 87,
    clinchOffence: 88,
    clinchDefence: 87,
    clinchStriking: 92,
    clinchGrappling: 85,
    clinchControl: 86,
    groundOffence: 84,
    groundDefence: 86,
    groundControl: 83,
    groundStriking: 87,
    submissionOffence: 80,
    submissionDefence: 86,
    getUpAbility: 89,
    composure: 92,
    fightIQ: 90
  },
  stats: {},
  Tendency: {
    strikingVsGrappling: 50,
    aggressiveness: 50,
    counterVsInitiator: 50,
    standupPreference: {
      boxing: 20,
      kickBoxing: 20,
      muayThai: 20,
      karate: 20,
      taekwondo: 20
    },
    grapplingPreference: {
      wrestling: 33,
      judo: 33,
      bjj: 34
    }
  }
});

// Test full fight simulation
const testFullFightSimulation = () => {
  console.log("Testing full fight simulation...");
  const fighter1 = createFighter("Fighter 1", { striking: 90, punchPower: 90 });
  const fighter2 = createFighter("Fighter 2", { takedownOffence: 90, groundOffence: 90 });
  
  const result = simulateFight([fighter1, fighter2]);
  
  console.log("Fight Result:", result);
  console.log("Test completed.");
};

// Test individual actions
const testIndividualActions = () => {
  console.log("Testing individual actions...");
  
  const attacker = createFighter("Attacker", { striking: 90, punchPower: 90 });
  const defender = createFighter("Defender", { takedownDefence: 90, submissionDefence: 90 });
  
  // Test kick
  console.log("Testing kick...");
  const kickResult = doKick(attacker, defender, "headKick");
  console.log("Kick Result:", kickResult);
  
  // Test punch
  console.log("Testing punch...");
  const punchResult = doPunch(attacker, defender, "cross");
  console.log("Punch Result:", punchResult);
  
  // Test ground punch
  console.log("Testing ground punch...");
  attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
  defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
  const groundPunchResult = doGroundPunch(attacker, defender);
  console.log("Ground Punch Result:", groundPunchResult);
  
  // Test takedown
  console.log("Testing takedown...");
  attacker.position = FIGHTER_POSITIONS.STANDING;
  defender.position = FIGHTER_POSITIONS.STANDING;
  const takedownResult = doTakedown(attacker, defender);
  console.log("Takedown Result:", takedownResult);
  
  // Test get up
  console.log("Testing get up...");
  attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
  defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
  const getUpResult = doGetUp(attacker, defender);
  console.log("Get Up Result:", getUpResult);
  
  // Test submission
  console.log("Testing submission...");
  attacker.position = FIGHTER_POSITIONS.GROUND_MOUNT_TOP;
  defender.position = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
  const submissionResult = doSubmission(attacker, defender);
  console.log("Submission Result:", submissionResult);
  
  console.log("Individual action tests completed.");
};

// Run tests
const runTests = () => {
  testFullFightSimulation();
  console.log("\n");
  testIndividualActions();
};

runTests();