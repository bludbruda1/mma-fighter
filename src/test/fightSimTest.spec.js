import { simulateFight, FIGHTER_POSITIONS } from "../engine/FightSim.js";
import {
  doKick,
  doPunch,
  doGroundStrike,
  doTakedown,
  doGetUp,
  doRearNakedChoke,
  doTriangleChoke,
  doGuillotine,
  doArmbar
} from "../engine/FightSim.js";
import fightPlayByPlayLogger from '../engine/fightPlayByPlayLogger.js';
import { FIGHTING_STYLES } from '../engine/mmaStyles.js';

const createFighter = (name, attributes = {}) => ({
  personid: attributes.personid || Math.floor(Math.random() * 10000),
  firstname: name.split(' ')[0],
  lastname: name.split(' ')[1] || '',
  name: name,
  hometown: attributes.hometown || "Test City",
  nationality: attributes.nationality || "Test Nation 🏴",
  wins: attributes.wins || 0,
  losses: attributes.losses || 0,
  image: attributes.image || "/assets/images/test.png",
  weightClass: attributes.weightClass || "Lightweight",
  fightingStyle: attributes.fightingStyle || "FIGHTING_STYLES.POWER_PUNCHER",
  maxHealth: {
    head: attributes.maxHealth?.head || 100,
    body: attributes.maxHealth?.body || 100,
    legs: attributes.maxHealth?.legs || 100
  },
  health: {
    head: attributes.health?.head || 100,
    body: attributes.health?.body || 100,
    legs: attributes.health?.legs || 100
  },
  stamina: attributes.stamina || 1000,
  position: FIGHTER_POSITIONS.STANDING,
  Rating: {
    output: 80,
    strength: 82,
    speed: 85,
    cardio: 75,
    toughness: 83,
    chin: 88,
    striking: 89,
    punchPower: 88,
    handSpeed: 87,
    punchAccuracy: 86,
    kicking: 84,
    kickPower: 85,
    kickSpeed: 84,
    kickAccuracy: 83,
    strikingDefence: 80,
    kickDefence: 76,
    headMovement: 82,
    footwork: 85,
    takedownOffence: 66,
    takedownDefence: 74,
    clinchStriking: 81,
    clinchTakedown: 62,
    clinchControl: 71,
    clinchDefence: 76,
    groundOffence: 72,
    groundDefence: 70,
    groundControl: 71,
    groundStriking: 75,
    submissionOffence: 68,
    submissionDefence: 75,
    getUpAbility: 80,
    composure: 82,
    fightIQ: 84,
    ...attributes.Rating,
  },
  stats: {
    totalStrikesThrown: 0,
    totalStrikesLanded: 0,
    punchsThrown: 0,
    punchsLanded: 0,
    punchsBlocked: 0,
    punchsEvaded: 0,
    punchsMissed: 0,
    jabsThrown: 0,
    jabsLanded: 0,
    jabsBlocked: 0,
    jabsEvaded: 0,
    jabsMissed: 0,
    crosssThrown: 0,
    crosssLanded: 0,
    crosssBlocked: 0,
    crosssEvaded: 0,
    crosssMissed: 0,
    hooksThrown: 0,
    hooksLanded: 0,
    hooksBlocked: 0,
    hooksEvaded: 0,
    hooksMissed: 0,
    uppercutsThrown: 0,
    uppercutsLanded: 0,
    uppercutsBlocked: 0,
    uppercutsEvaded: 0,
    uppercutsMissed: 0,
    spinningBackfistsThrown: 0,
    spinningBackfistsLanded: 0,
    spinningBackfistsBlocked: 0,
    spinningBackfistsEvaded: 0,
    spinningBackfistsMissed: 0,
    supermanPunchsLanded: 0,
    supermanPunchsBlocked: 0,
    supermanPunchsEvaded: 0,
    supermanPunchsMissed: 0,
    bodyPunchsThrown: 0,
    bodyPunchsLanded: 0,
    bodyPunchsBlocked: 0,
    bodyPunchsEvaded: 0,
    bodyPunchsMissed: 0,
    kicksThrown: 0,
    kicksLanded: 0,
    kicksBlocked: 0,
    kicksEvaded: 0,
    kicksMissed: 0,
    headKicksThrown: 0,
    headKicksLanded: 0,
    headKicksBlocked: 0,
    headKicksEvaded: 0,
    headKicksMissed: 0,
    bodyKicksThrown: 0,
    bodyKicksLanded: 0,
    bodyKicksBlocked: 0,
    bodyKicksEvaded: 0,
    bodyKicksMissed: 0,
    legKicksThrown: 0,
    legKicksLanded: 0,
    legKicksBlocked: 0,
    legKicksEvaded: 0,
    legKicksMissed: 0,
    clinchsAttempted: 0,
    clinchsSuccessful: 0,
    clinchsDefended: 0,
    tripsAttempted: 0,
    throwsAttempted: 0,
    tripsDefended: 0,
    throwsDefended: 0,
    clinchStrikesThrown: 0,
    clinchStrikesLanded: 0,
    clinchStrikesBlocked: 0,
    clinchStrikesEvaded: 0,
    clinchStrikesMissed: 0,
    takedownsAttempted: 0,
    takedownsSuccessful: 0,
    takedownsDefended: 0,
    singleLegAttempted: 0,
    singleLegSuccessful: 0,
    singleLegDefended: 0,
    groundPunchsLanded: 0,
    groundPunchsBlocked: 0,
    submissionsAttempted: 0,
    submissionsSuccessful: 0,
    submissionsDefended: 0,
    armbarsAttempted: 0,
    armbarsSuccessful: 0,
    armbarsDefended: 0,
    triangleChokesAttempted: 0,
    triangleChokesSuccessful: 0,
    triangleChokesDefended: 0,
    rearNakedChokesAttempted: 0,
    rearNakedChokesSuccessful: 0,
    rearNakedChokesDefended: 0,
    legLocksAttempted: 0,
    legLocksSuccessful: 0,
    legLocksDefended: 0,
    guillotinesAttempted: 0,
    guillotinesSuccessful: 0,
    guillotinesDefended: 0,
    ...attributes.stats
  },
  fightHistory: attributes.fightHistory || [],
  roundsWon: 0
});

describe("FightSim Tests", () => {
  let logger;

  beforeEach(() => {
    logger = new fightPlayByPlayLogger(true);
  });

  test("Full Fight Simulation", () => {
    const fighter1 = createFighter("Fighter One", {
      fightingStyle: "FIGHTING_STYLES.POWER_PUNCHER",
      Rating: { 
        striking: 89,
        punchPower: 88,
        handSpeed: 87,
        punchAccuracy: 86
      }
    });

    const fighter2 = createFighter("Fighter Two", {
      fightingStyle: "FIGHTING_STYLES.PRESSURE_FIGHTER",
      Rating: {
        striking: 92,
        punchPower: 88,
        handSpeed: 90,
        punchAccuracy: 91
      }
    });

    const result = simulateFight([fighter1, fighter2], logger);
    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("method");
  });

  describe("Individual Actions", () => {
    let attacker, defender;

    beforeEach(() => {
      attacker = createFighter("Attacker", { 
        fightingStyle: "FIGHTING_STYLES.POWER_PUNCHER",
        Rating: { 
          striking: 89,
          punchPower: 88,
          handSpeed: 87,
          punchAccuracy: 86
        }
      });

      defender = createFighter("Defender", {
        fightingStyle: "FIGHTING_STYLES.PRESSURE_FIGHTER",
        Rating: {
          strikingDefence: 88,
          kickDefence: 86,
          headMovement: 87,
          footwork: 88
        }
      });
    });

    test("Kick Action", () => {
      const currentTime = 300;
      const kickResult = doKick(attacker, defender, "headKick", 0, currentTime, logger);
      expect(kickResult).toBeDefined();
      
      const events = logger.getFightPlayByPlay();
      expect(events.find(e => e.type === "strike" && e.strikeType === "headKick")).toBeTruthy();
    });

    test("Punch Action", () => {
      const currentTime = 300;
      const punchResult = doPunch(attacker, defender, "cross", 0, currentTime, logger);
      expect(punchResult).toBeDefined();
      
      const events = logger.getFightPlayByPlay();
      expect(events.find(e => e.type === "strike" && e.strikeType === "cross")).toBeTruthy();
    });

    test("Ground Strike Action", () => {
      attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
      defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
      const currentTime = 300;
      const groundStrikeResult = doGroundStrike(attacker, defender, "groundPunch", currentTime, logger);
      expect(groundStrikeResult[0]).toBeDefined();

      const events = logger.getFightPlayByPlay();
      expect(events.find(e => e.type === "strike" && e.strikeType === "groundPunch")).toBeTruthy();
    });

    test("Takedown Action", () => {
      attacker.position = FIGHTER_POSITIONS.STANDING;
      defender.position = FIGHTER_POSITIONS.STANDING;
      const currentTime = 300;
      const takedownResult = doTakedown(attacker, defender, "singleLegTakedown", currentTime, logger);
      expect(takedownResult).toBeDefined();

      const events = logger.getFightPlayByPlay();
      expect(events.find(e => e.type === "takedown")).toBeTruthy();
    });

    test("Get Up Action", () => {
      attacker.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_BOTTOM;
      defender.position = FIGHTER_POSITIONS.GROUND_FULL_GUARD_TOP;
      const currentTime = 300;
      const getUpResult = doGetUp(attacker, defender, currentTime, logger);
      expect(getUpResult).toBeDefined();

      const events = logger.getFightPlayByPlay();
      expect(events.find(e => e.type === "position")).toBeTruthy();
    });

    test("Submission Actions", () => {
      attacker.position = FIGHTER_POSITIONS.GROUND_BACK_CONTROL_OFFENCE;
      defender.position = FIGHTER_POSITIONS.GROUND_BACK_CONTROL_DEFENCE;
      const currentTime = 300;

      const submissions = [
        { func: doRearNakedChoke, name: "rearNakedChoke" },
        { func: doTriangleChoke, name: "triangleChoke" },
        { func: doGuillotine, name: "guillotine" },
        { func: doArmbar, name: "armbar" }
      ];

      submissions.forEach(sub => {
        logger.reset();
        const result = sub.func(attacker, defender, currentTime, logger);
        expect(result).toBeDefined();
        
        const events = logger.getFightPlayByPlay();
        expect(events.find(e => e.type === "submission" && e.submissionType === sub.name)).toBeTruthy();
      });
    });
  });

  test("Knockout Scenario", () => {
    const fighter1 = createFighter("Fighter One", {
      health: { head: 1, body: 1, legs: 1 },
      Rating: { striking: 100, punchPower: 100 },
      fightingStyle: FIGHTING_STYLES.POWER_PUNCHER,
    });
    const fighter2 = createFighter("Fighter Two", {
      health: { head: 1, body: 1, legs: 1 },
      fightingStyle: FIGHTING_STYLES.POWER_PUNCHER,
    });
    const result = simulateFight([fighter1, fighter2], logger);
    expect(result).toHaveProperty("winner");
    expect(result).toHaveProperty("method", "Knockout");
  });

  test("Submission Scenario", () => {
    const fighter1 = createFighter("Grappler", {
      fightingStyle: FIGHTING_STYLES.BRAZILIAN_JIU_JITSU,
      Rating: { 
        submissionOffence: 100,
        groundControl: 100
      }
    });
    const fighter2 = createFighter("Opponent", {
      fightingStyle: FIGHTING_STYLES.STRIKER,
      Rating: { 
        submissionDefence: 0,
        groundDefence: 0
      }
    });

    fighter1.position = FIGHTER_POSITIONS.GROUND_MOUNT_TOP;
    fighter2.position = FIGHTER_POSITIONS.GROUND_MOUNT_BOTTOM;
    
    const currentTime = 300;
    const submissionResult = doArmbar(fighter1, fighter2, currentTime, logger);
    
    expect(submissionResult[0]).toBe("submissionSuccessful");
  });
});