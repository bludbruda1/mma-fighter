import { formatTime } from './helper';

/**
 * Class to log and replay fight events in sequence
 * @class fightPlayByPlayLogger
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
    * Format the current time for display
    * @param {number} clock - Time in seconds
    * @returns {string} Formatted time string
    */
    formatEventTime(clock) {
      return formatTime(clock);
    }
  
    /**
     * Log a generic fight event
     */
    logEvent(event) {
      if (!this.active) return;
  
      if (event.type === "roundStart") {
        this.currentRound = event.round;
        this.elapsedTime = 0;
      } else if (event.type === "roundEnd") {
        this.elapsedTime = this.roundTime;
      } else {
        this.elapsedTime = this.roundTime - event.clock;
      }
  
      const fullEvent = {
        ...event,
        round: this.currentRound,
        timeElapsed: this.elapsedTime,
        formattedTime: this.formatEventTime(event.clock)
      };
  
      this.playByPlay.push(fullEvent);
    }
  
    /**
     * Log a punch event
     */
    logPunch(attacker, defender, punchType, outcome, damageResult, currentTime) {
      this.logEvent({
        type: "strike",
        subtype: "punch",
        strikeType: punchType,
        attackerId: attacker.id,
        defenderId: defender.id,
        outcome: outcome,
        damage: damageResult?.damage,
        target: damageResult?.target,
        isKnockout: damageResult?.isKnockout,
        isStun: damageResult?.isStun,
        clock: currentTime
      });
    }
  
    /**
     * Log a kick event
     */
    logKick(attacker, defender, kickType, outcome, damageResult, currentTime) {
      this.logEvent({
        type: "strike",
        subtype: "kick",
        strikeType: kickType,
        attackerId: attacker.id,
        defenderId: defender.id,
        outcome: outcome,
        damage: damageResult?.damage,
        target: damageResult?.target,
        isKnockout: damageResult?.isKnockout,
        isStun: damageResult?.isStun,
        clock: currentTime
      });
    }
  
    /**
     * Log a takedown event
     */
    logTakedown(attacker, defender, takedownType, outcome, currentTime) {
      this.logEvent({
        type: "takedown",
        takedownType: takedownType,
        attackerId: attacker.id,
        defenderId: defender.id,
        outcome: outcome,
        clock: currentTime
      });
    }
  
    /**
     * Log a submission event
     */
    logSubmission(attacker, defender, submissionType, stage, currentTime) {
      this.logEvent({
        type: "submission",
        submissionType: submissionType,
        attackerId: attacker.id,
        defenderId: defender.id,
        stage: stage,
        clock: currentTime
      });
    }
  
    /**
     * Log a position change
     */
    logPositionChange(attacker, defender, newPosition, currentTime) {
      this.logEvent({
        type: "position",
        attackerId: attacker.id,
        defenderId: defender.id,
        newPosition: newPosition,
        clock: currentTime
      });
    }
  
    /**
     * Log round start
     */
    logRoundStart(round, currentTime) {
      this.logEvent({
        type: "roundStart",
        round: round,
        clock: currentTime
      });
    }
  
    /**
     * Log round end
     */
    logRoundEnd(round, stats, currentTime) {
      this.logEvent({
        type: "roundEnd",
        round: round,
        stats: stats,
        clock: currentTime
      });
    }
  
    /**
     * Log fighter state update
     */
    logFighterState(fighter, currentTime) {
      this.logEvent({
        type: "fighterState",
        fighterId: fighter.id,
        stamina: fighter.stamina,
        health: { ...fighter.health },
        position: fighter.position,
        clock: currentTime
      });
    }
  
    /**
     * Log fight start
     */
    logFightStart(fighters, currentTime) {
      this.logEvent({
        type: "fightStart",
        fighters: fighters.map(f => f.name),
        clock: currentTime
      });
    }
  
    /**
     * Log fight end
     */
    logFightEnd(fightResult, currentTime) {
      this.logEvent({
        type: "fightEnd",
        winnerId: fightResult.winner,
        winnerName: fightResult.winnerName,
        loserName: fightResult.loserName,
        method: fightResult.method,
        submissionType: fightResult.submissionType,
        round: fightResult.round,
        finalHealth: fightResult.finalHealth,
        clock: currentTime
      });
    }
  
    /**
     * Log recovery event
     */
    logRecovery(fighter, previousHealth, newHealth, currentTime) {
      this.logEvent({
        type: "recovery",
        fighterId: fighter.id,
        previousHealth: previousHealth,
        newHealth: newHealth,
        clock: currentTime
      });
    }
  
    /**
     * Get all fight events including initial fight state
     */
    getFightPlayByPlay(fighters, fightStats) {
      if (!this.active) return;
  
      return [
        {
          type: "init",
          fighters,
          fightStats,
        },
        ...this.playByPlay,
      ];
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