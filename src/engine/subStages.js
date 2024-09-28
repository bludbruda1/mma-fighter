import { calculateProbability } from "./fightCalculations.js";

// Rear-Naked Choke stages

const doEngageArm = (attacker, defender) => {
    console.log(`${attacker.name} is attempting to get his arm under ${defender.name}'s neck.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully gets his arm under the necks.`);
      return true;
    } else {
      console.log(`${defender.name} fights off the arm.`);
      return false;
    }
  };

  const doLockChoke = (attacker, defender) => {
    console.log(`${attacker.name} attempts to lock in the choke.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    // Slightly lower success probability for this intermediate stage
    const isSuccessful = Math.random() < (successProbability * 0.9);
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully locks in the choke.`);
      return true;
    } else {
      console.log(`${defender.name} prevents the choke from being locked in.`);
      return false;
    }
  };

// Triangle Choke stages
const doIsolateArm = (attacker, defender) => {
    console.log(`${attacker.name} is trying to to isolate ${defender.name}'s arm.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully trapped the arm.`);
      return true;
    } else {
      console.log(`${defender.name} slips his arm out.`);
      return false;
    }
  };

const doLockTriangle = (attacker, defender) => {
    console.log(`${attacker.name} is trying to lock in the choke.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully forms the triangle.`);
      return true;
    } else {
      console.log(`${defender.name} prevents the choke from being locked in.`);
      return false;
    }
  };

  const doApplyPressure = (attacker, defender) => {
    console.log(`The triangle choke is locked in!`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
        console.log(`${defender.name} taps out.`);
        return true;
    } else {
        console.log(`${defender.name} escapes.`);
        return false;
    }
  };

  // Guillotine specific stages
const doTrapHead = (attacker, defender) => {
    console.log(`${attacker.name} is trying to to trap ${defender.name}'s head.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully trapped the head.`);
      return true;
    } else {
      console.log(`${attacker.name} can't lock in the guillotine.`);
      return false;
    }
  };

const doCloseGuard = (attacker, defender) => {
    console.log(`${attacker.name} is trying to lock in the choke.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully applys the guillotine.`);
      return true;
    } else {
      console.log(`${defender.name} slips his head out.`);
      return false;
    }
  };

  // Multi submission stages

  const doApplyChoke = (attacker, defender) => {
    console.log(`${attacker.name} is looking to finish the fight .`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${defender.name} taps out.`);
      return true;
    } else {
      console.log(`${defender.name} escapes the choke attempt.`);
      return false;
    }
  };




export { doEngageArm, doApplyChoke, doLockChoke, doIsolateArm, doLockTriangle, doApplyPressure, doTrapHead, doCloseGuard };