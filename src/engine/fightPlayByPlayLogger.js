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
  }

  /**
   * Format time for display (M:SS format)
   * @param {number} clock - Time in seconds
   * @returns {string} Formatted time
   */
  formatEventTime(clock) {
    const minutes = Math.floor(clock / 60);
    const seconds = clock % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format round display
   * @param {number} round - Round number
   * @returns {string} Formatted round
   */
  formatRound(round) {
    return `R${round}`;
  }

  /**
   * Helper to safely get fighter name
   * @param {Object} fighter - Fighter object
   * @returns {string} Fighter's full name
   */
  getFighterName(fighter) {
    if (!fighter) return "Unknown Fighter";
    if (fighter.name) return fighter.name;
    if (fighter.firstname && fighter.lastname) {
      return `${fighter.firstname} ${fighter.lastname}`;
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
   * Log a generic fight event
   * @param {Object} event - Event data to log
   */
  logEvent(event) {
    if (!this.active) return;

    const formattedEvent = {
      ...event,
      round: this.currentRound,
      timeElapsed: this.elapsedTime,
      formattedTime: this.formatEventTime(event.clock)
    };

    console.log(`[${this.formatRound(this.currentRound)} ${this.formatEventTime(event.clock)}] ${JSON.stringify(formattedEvent)}`);
    this.playByPlay.push(formattedEvent);
  }

  /**
   * Log fight initialization
   * @param {Object[]} fighters - Array of fighter objects
   */
  logFightStart(fighters) {
    if (!fighters?.[0] || !fighters?.[1]) {
      console.warn('Invalid fighter data in logFightStart');
      return;
    }

    const fighter1Name = this.getFighterName(fighters[0]);
    const fighter2Name = this.getFighterName(fighters[1]);

    this.logEvent({
      type: "fightStart",
      fighter1: {
        name: fighter1Name,
        record: `${fighters[0].wins}-${fighters[0].losses}`,
        weightClass: fighters[0].weightClass
      },
      fighter2: {
        name: fighter2Name,
        record: `${fighters[1].wins}-${fighters[1].losses}`,
        weightClass: fighters[1].weightClass
      },
      clock: this.roundTime
    });

    // Log initial matchup
    console.log(`\nFight Starting: ${fighter1Name} vs ${fighter2Name}`);
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
   * @param {string} newPosition - New position
   * @param {number} currentTime - Current fight time
   */
  logPositionChange(attacker, defender, newPosition, currentTime) {
    if (!attacker || !defender) return;

    this.logEvent({
      type: "position",
      attackerId: this.getFighterId(attacker),
      attackerName: this.getFighterName(attacker),
      defenderId: this.getFighterId(defender),
      defenderName: this.getFighterName(defender),
      newPosition,
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
  }
}

export default fightPlayByPlayLogger;