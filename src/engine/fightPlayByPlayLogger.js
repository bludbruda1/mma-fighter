import { formatFightIntroduction } from './fightEventFormatter.js';
import { formatTime } from './helper.js';
import { formatNameWithNickname, formatBasicName } from '../utils/nameUtils.js';  // Add this import


/**
 * Logger class for recording and displaying fight events with improved data handling
 */
class fightPlayByPlayLogger {
  constructor(active) {
    this.active = active;
    this.playByPlay = [];
    this.currentRound = 1;
    this.roundTime = 300; // 5 minutes in seconds
    this.elapsedTime = 0;
    this.introductionLogged = false;
  }

  /**
   * Format and add event to play-by-play log
   * @param {Object} event - Event data to log
   */
  logEvent(event) {
    if (!this.active) return;

    // For introduction events, set special timing values
    if (event.type === "introduction") {
      const formattedEvent = {
        ...event,
        round: 'introduction',
        timeElapsed: 0,
        formattedTime: 'PRE-FIGHT'
      };
      this.playByPlay.push(formattedEvent);
    } else {
      // Handle regular fight events
      const formattedEvent = {
        ...event,
        round: this.currentRound,
        timeElapsed: this.elapsedTime,
        formattedTime: event.clock ? formatTime(event.clock) : formatTime(0)
      };
      this.playByPlay.push(formattedEvent);
    }
  }

  /**
   * Helper to safely get fighter name
   * @param {Object} fighter - Fighter object
   * @returns {string} Fighter's full name with nickname if available
   */
  getFighterName(fighter) {
    if (!fighter) return "Unknown Fighter";
    if (fighter.name) return fighter.name;
    if (fighter.firstname && fighter.lastname) {
      return formatNameWithNickname({
        firstname: fighter.firstname,
        lastname: fighter.lastname,
        nickname: fighter.nickname,
        nicknamePlacement: fighter.nicknamePlacement
      });
    }
    return `Fighter ${fighter.id || fighter.personid || 'Unknown'}`;
  }

  /**
   * Helper to safely get fighter ID
   * @param {Object} fighter - Fighter object
   * @returns {number|string} Fighter's ID
   */
  getFighterId(fighter) {
    return fighter?.id || fighter?.personid;
  }

  /**
   * Helper to safely get fighter data
   * @param {Object} fighter - Fighter object
   * @returns {Object} Complete fighter data
   */
  getFighterData(fighter) {
    if (!fighter) return null;
    return {
      firstname: fighter.firstname,
      lastname: fighter.lastname,
      nickname: fighter.nickname,
      nicknamePlacement: fighter.nicknamePlacement,
      weightClass: fighter.weightClass,
      wins: fighter.wins,
      losses: fighter.losses,
      hometown: fighter.hometown,
      fightingStyle: fighter.fightingStyle,
      personid: fighter.personid || fighter.id
    };
  }

  /**
   * Log fight initialization with introduction sequence
   * @param {Object[]} fighters - Array of fighter objects
   */
  logFightStart(fighters) {
    if (!fighters?.[0] || !fighters?.[1]) {
      console.warn('Invalid fighter data in logFightStart');
      return;
    }

    if (this.introductionLogged) return;

    // Get complete fighter data
    const completeData = fighters.map(fighter => this.getFighterData(fighter));

    // Generate and log introduction sequence
    const introLines = formatFightIntroduction(completeData[0], completeData[1]);
    introLines.forEach(line => this.logEvent(line));

    this.introductionLogged = true;
  }

  /**
   * Log the actual start of fighting action
   * @param {Object} fighter - The fighter initiating the action
   * @param {Object} opponent - The opponent fighter
   * @param {string} message - The fight start message
   * @param {number} currentTime - Current fight time
   */
  logFightStartAction(fighter, opponent, message, currentTime) {
    if (!this.active) return;

    this.logEvent({
      type: "fightStart",
      message: message,
      fighterId: this.getFighterId(fighter),
      fighterName: this.getFighterName(fighter),
      opponentId: this.getFighterId(opponent),
      opponentName: this.getFighterName(opponent),
      clock: currentTime
    });
  }

  /**
   * Log round start
   * @param {number} round - Round number
   */
  logRoundStart(round) {
    this.currentRound = round;
    this.elapsedTime = 0;
    
    this.logEvent({
      type: "roundStart",
      message: `Round ${round} begins!`,
      clock: this.roundTime
    });
  }

  /**
   * Log round end
   * @param {number} round - Round number
   * @param {Object} stats - Round statistics
   * @param {number} currentTime - Current fight time
   */
  logRoundEnd(round, stats, currentTime) {
    this.logEvent({
      type: "roundEnd",
      message: `Round ${round} ends!`,
      stats,
      clock: currentTime
    });
  }

  /**
   * Log a strike attempt
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
   * @param {string} strikeType - Type of strike
   * @param {string} outcome - Result of the strike
   * @param {Object} damageResult - Damage information
   * @param {number} currentTime - Current fight time
   */
  logStrike(attacker, defender, strikeType, outcome, damageResult, currentTime) {
    if (!attacker || !defender) return;

    this.logEvent({
      type: "strike",
      strikeType,
      attackerId: this.getFighterId(attacker),
      attackerName: this.getFighterName(attacker),
      defenderId: this.getFighterId(defender),
      defenderName: this.getFighterName(defender),
      outcome,
      damage: damageResult?.damage,
      target: damageResult?.target,
      clock: currentTime
    });
  }

  /**
   * Log a takedown attempt
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
   * @param {string} takedownType - Type of takedown
   * @param {string} outcome - Result of the takedown
   * @param {number} currentTime - Current fight time
   */
  logTakedown(attacker, defender, takedownType, outcome, currentTime) {
    if (!attacker || !defender) return;

    this.logEvent({
      type: "takedown",
      takedownType,
      attackerId: this.getFighterId(attacker),
      attackerName: this.getFighterName(attacker),
      defenderId: this.getFighterId(defender),
      defenderName: this.getFighterName(defender),
      outcome,
      clock: currentTime
    });
  }

  /**
   * Log a clinch attempt
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
   * @param {string} outcome - Result of clinch attempt
   * @param {number} currentTime - Current fight time
   */
  logClinch(attacker, defender, outcome, currentTime) {
    if (!attacker || !defender) return;

    this.logEvent({
      type: "clinch",
      attackerId: this.getFighterId(attacker),
      attackerName: this.getFighterName(attacker),
      defenderId: this.getFighterId(defender),
      defenderName: this.getFighterName(defender),
      outcome,
      clock: currentTime
    });
  }

  /**
   * Log a submission attempt
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
   * @param {string} submissionType - Type of submission
   * @param {string} stage - Current stage of submission
   * @param {number} currentTime - Current fight time
   */
  logSubmission(attacker, defender, submissionType, stage, currentTime) {
    if (!attacker || !defender) return;

    this.logEvent({
      type: "submission",
      submissionType,
      stage,
      attackerId: this.getFighterId(attacker),
      attackerName: this.getFighterName(attacker),
      defenderId: this.getFighterId(defender),
      defenderName: this.getFighterName(defender),
      clock: currentTime
    });
  }

  /**
   * Log a position change
   * @param {Object} attacker - Attacking fighter
   * @param {Object} defender - Defending fighter
 * @param {string} outcome - Outcome of the position change attempt
   * @param {number} currentTime - Current fight time
   */
  logPositionChange(attacker, defender, outcome, currentTime) {
    if (!attacker || !defender) return;

    this.logEvent({
      type: "position",
      attackerId: this.getFighterId(attacker),
      attackerName: this.getFighterName(attacker),
      defenderId: this.getFighterId(defender),
      defenderName: this.getFighterName(defender),
      attackerPosition: attacker.position,
      defenderPosition: defender.position,
      outcome,
      clock: currentTime
    });
  }

  /**
   * Log fighter state changes
   * @param {Object} fighter - Fighter object
   * @param {number} currentTime - Current fight time
   */
  logFighterState(fighter, currentTime) {
    if (!fighter) return;
    
    const fighterId = this.getFighterId(fighter);
    const fighterName = this.getFighterName(fighter);
    
    if (!fighterName || !fighterId) {
      console.warn('Invalid fighter data in logFighterState:', fighter);
      return;
    }

    this.logEvent({
      type: "fighterState",
      fighterId,
      name: fighterName,
      stamina: fighter.stamina,
      health: fighter.health,
      position: fighter.position,
      clock: currentTime
    });
  }

  /**
   * Log fighter recovery
   * @param {Object} fighter - Fighter object
   * @param {Object} previousHealth - Previous health values
   * @param {Object} newHealth - New health values
   * @param {number} currentTime - Current fight time
   */
  logRecovery(fighter, previousHealth, newHealth, currentTime) {
    if (!fighter) return;

    const fighterId = this.getFighterId(fighter);
    const fighterName = this.getFighterName(fighter);
    
    if (!fighterName || !fighterId) {
      console.warn('Invalid fighter data in logRecovery:', fighter);
      return;
    }

    this.logEvent({
      type: "recovery",
      fighterId,
      name: fighterName,
      previousHealth,
      newHealth,
      clock: currentTime
    });
  }

  /**
   * Log fight end
   * @param {Object} fightResult - Fight result data
   * @param {number} currentTime - Current fight time
   */
  logFightEnd(fightResult, currentTime) {
    this.logEvent({
      type: "fightEnd",
      winner: fightResult.winner,
      winnerName: fightResult.winnerName,
      loserName: fightResult.loserName,
      method: fightResult.method,
      submissionType: fightResult.submissionType,
      round: fightResult.round,
      clock: currentTime
    });
  }

  /**
   * Get complete fight play-by-play
   * @returns {Object[]} Array of all fight events
   */
  getFightPlayByPlay() {
    return this.playByPlay;
  }

  /**
   * Reset logger for new fight
   */
  reset() {
    this.playByPlay = [];
    this.currentRound = 1;
    this.elapsedTime = 0;
    this.introductionLogged = false;
  }
}

export default fightPlayByPlayLogger;