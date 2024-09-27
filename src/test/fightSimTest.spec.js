const { simulateFight, FIGHTER_POSITIONS } = require("../engine/FightSim.js");
const {
  doKick,
  doPunch,
  doGroundPunch,
  doTakedown,
  doGetUp,
  doSubmission,
} = require("../engine/FightSim.js");
const {FIGHTING_STYLES} = require('../engine/mmaStyles.js');


// Helper function to create a basic fighter object
const createFighter = (name, attributes) => ({
  name,
  health: attributes.health || { head: 100, body: 100, legs: 100 },
  maxHealth: attributes.maxHealth ||
    attributes.health || { head: 100, body: 100, legs: 100 },
  stamina: 1000,
  position: FIGHTER_POSITIONS.STANDING,
  fightingStyle: attributes.fightingStyle || "POWER_PUNCHER", // Add this line
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
    clinchStriking: 88,
    clinchTakedown: 87,
    clinchControl: 92,
    clinchDefence: 85,
    groundOffence: 84,
    groundDefence: 86,
    groundControl: 83,
    groundStriking: 87,
    submissionOffence: 80,
    submissionDefence: 86,
    getUpAbility: 89,
    composure: 92,
    fightIQ: 90,
    ...attributes.Rating,
  },
  stats: {},
  Tendency: FIGHTING_STYLES[attributes.fightingStyle || "POWER_PUNCHER"].Tendency, // Update this line
});

describe("FightSim Tests", () => {
  // Test full fight simulation
  test("Full Fight Simulation", () => {
    const fighter1 = createFighter("Fighter 1", {
      striking: 90,
      punchPower: 90,
    });
    const fighter2 = createFighter("Fighter 2", {
      takedownOffence: 90,
      groundOffence: 90,
    });

    const result = simulateFight([fighter1, fighter2]);

    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("method");
    console.log("Fight Result:", result);
  });

  // Test individual actions
  describe("Individual Actions", () => {
    let attacker, defender;

    beforeEach(() => {
      attacker = createFighter("Attacker", { striking: 90, punchPower: 90 });
      defender = createFighter("Defender", {
        takedownDefence: 90,
        submissionDefence: 90,
      });
    });

    test("Kick Action", () => {
      const kickResult = doKick(attacker, defender, "headKick");
      expect(kickResult).toBeDefined();
      console.log("Kick Result:", kickResult);
    });

    test("Punch Action", () => {
      const punchResult = doPunch(attacker, defender, "cross");
      expect(punchResult).toBeDefined();
      console.log("Punch Result:", punchResult);
    });

    test("Ground Punch Action", () => {
      attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
      defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
      const groundPunchResult = doGroundPunch(attacker, defender);
      expect(groundPunchResult).toBeDefined();
      console.log("Ground Punch Result:", groundPunchResult);
    });

    test("Takedown Action", () => {
      attacker.position = FIGHTER_POSITIONS.STANDING;
      defender.position = FIGHTER_POSITIONS.STANDING;
      const takedownResult = doTakedown(attacker, defender);
      expect(takedownResult).toBeDefined();
      console.log("Takedown Result:", takedownResult);
    });

    test("Get Up Action", () => {
      attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
      defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
      const getUpResult = doGetUp(attacker, defender);
      expect(getUpResult).toBeDefined();
      console.log("Get Up Result:", getUpResult);
    });

    test("Submission Action", () => {
      attacker.position = FIGHTER_POSITIONS.GROUND_MOUNT_TOP;
      defender.position = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
      const submissionResult = doSubmission(attacker, defender);
      expect(submissionResult).toBeDefined();
      console.log("Submission Result:", submissionResult);
    });
  });

  // Test knockout scenario
  test("Knockout Scenario", () => {
    const fighter1 = createFighter("Fighter 1", {
      health: { head: 1, body: 1, legs: 1 },
      striking: 100,
      punchPower: 100,
    });
    const fighter2 = createFighter("Fighter 2", {
      health: { head: 1, body: 1, legs: 1 },
    });

    const result = simulateFight([fighter1, fighter2]);

    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("method", "Knockout"); // Expect method to be 'KO'
    console.log("Fight Result:", result);
  });

  // Test submission scenario
  test("Submission Scenario", () => {
    const fighter1 = createFighter("Fighter 1", {
      Rating: { submissionOffence: 100 },
    });
    const fighter2 = createFighter("Fighter 2", {
      Rating: { submissionDefence: 0 },
    });

    console.log(fighter1.Rating.submissionOffence);
    fighter1.position = FIGHTER_POSITIONS.GROUND_MOUNT_TOP;
    fighter2.position = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
    const submissionResult = doSubmission(fighter1, fighter2);
    console.log("Submission Result:", submissionResult);
    expect(submissionResult).toContain("submissionSuccessful");
  });
});
