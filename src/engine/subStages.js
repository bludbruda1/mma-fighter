import { calculateProbability } from "./fightCalculations.js";

const doEngageArm = (attacker, defender) => {
    console.log(`${attacker.name} attempts to engage arm for Rear Naked Choke.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully engages arm.`);
      return true;
    } else {
      console.log(`${defender.name} prevents arm engagement.`);
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
  
  const doApplyChoke = (attacker, defender) => {
    console.log(`${attacker.name} attempts to apply the Rear Naked Choke.`);
    
    const successProbability = calculateProbability(
      attacker.Rating.submissionOffence,
      defender.Rating.submissionDefence
    );
  
    const isSuccessful = Math.random() < successProbability;
  
    if (isSuccessful) {
      console.log(`${attacker.name} successfully applies the choke.`);
      return true;
    } else {
      console.log(`${defender.name} escapes the choke attempt.`);
      return false;
    }
  };

export { doEngageArm, doApplyChoke, doLockChoke };