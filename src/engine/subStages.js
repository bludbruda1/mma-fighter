import { calculateSubmissionProbability } from "./fightCalculations.js";

// Rear-Naked Choke stages

const doEngageArm = (attacker, defender) => {
    console.log(`${attacker.name} is attempting to get his arm under ${defender.name}'s neck.`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
 
    if (random < successChance) {
      console.log(`${attacker.name} successfully gets his arm under the necks.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${defender.name} fights off the arm.`);
      return false;
    }
  };

  const doLockChoke = (attacker, defender) => {
    console.log(`${attacker.name} attempts to lock in the choke.`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();  

    if (random < successChance) {
      console.log(`${attacker.name} successfully locks in the choke.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${defender.name} prevents the choke from being locked in.`);
      return false;
    }
  };

// Triangle Choke stages
const doLockTriangle = (attacker, defender) => {
    console.log(`${attacker.name} is trying to lock in the choke.`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
    
    if (random < successChance) {
      console.log(`${attacker.name} successfully forms the triangle.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${defender.name} prevents the choke from being locked in.`);
      return false;
    }
  };

  // Guillotine specific stages
const doTrapHead = (attacker, defender) => {
    console.log(`${attacker.name} is trying to to trap ${defender.name}'s head.`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
  
    if (random < successChance) {
      console.log(`${attacker.name} successfully trapped the head.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${attacker.name} can't lock in the guillotine.`);
      return false;
    }
  };

const doCloseGuard = (attacker, defender) => {
    console.log(`${attacker.name} is trying to lock in the choke.`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
    
    if (random < successChance) {
      console.log(`${attacker.name} successfully applys the guillotine.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${defender.name} slips his head out.`);
      return false;
    }
  };

  // Multi submission stages

  const doApplyChoke = (attacker, defender) => {
    console.log(`${attacker.name} is looking to finish the fight .`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
    
    if (random < successChance) {
      console.log(`${defender.name} taps out.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${defender.name} escapes the choke attempt.`);
      return false;
    }
  };

// Triangle choke and armbar - might seperate at some point
  const doIsolateArm = (attacker, defender) => {
    console.log(`${attacker.name} is trying to to isolate ${defender.name}'s arm.`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
    
    if (random < successChance) {
      console.log(`${attacker.name} successfully trapped the arm.`);
      return true;
    } else if (random < successChance + failChance) {
      console.log(`${defender.name} slips his arm out.`);
      return false;
    }
  };

  // Triangle choke and armbar - might seperate at some point
  const doApplyPressure = (attacker, defender) => {
    console.log(`The submission is locked in!`);
    
    const { successChance, failChance } = calculateSubmissionProbability(attacker, defender);
    const random = Math.random();
    
    if (random < successChance) {
      console.log(`${defender.name} taps out.`);
        return true;
      } else if (random < successChance + failChance) {
        console.log(`${defender.name} escapes.`);
        return false;
    }
  };

export { 
doEngageArm,
doApplyChoke,
doLockChoke,
doIsolateArm,
doLockTriangle,
doApplyPressure,
doTrapHead,
doCloseGuard 
};