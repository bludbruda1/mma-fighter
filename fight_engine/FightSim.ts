// from https://github.com/zengm-games/zengm/blob/master/src/worker/core/GameSim.basketball/index.ts


const ROUND_CLOCK = 300; //5 min rounds, will want this to be customisable in the future

const ROUND_NUMBER = 3 ; //Again customisable as a main event/championship should be 5 rounds

type StrikeType =
	| "punch"
	| "kick";
type Stat =
	| "totalStrikes"
    | "sigStrikes"
    | "knockdowns"
	| "takedowns" 
	| "submissionAttempt" 
	| "submissionReversal";
export type FighterNum = 0 | 1;
type CompositeRating =
	| "blocking"
	| "fouling"
	| "passing"
	| "rebounding"
	| "stealing"
	| "turnovers"
	| "usage"
	| "jumpBall";

    type FighterSim = {
        id: number;
        name: string;
        age: number;
        stikePace: number; // mean number of strikes the fighter throws per fight
        compositeRating: {
            output: number; // Output rating influencing probability of action
            kicking: number; // Kicking ability rating
            striking: number; // Striking (punching) ability rating
        };
        stat: any;
        skills: string[];
        health: number; // Health of the fighter

    };
    
    type EventOutcome =
	| "punchLanded"
    | "punchBlocked"
    | "punchEvaded"
	| "kickLanded"
    | "kickBlocked"
    | "kickEvaded"
	| "endOfRound"
	| "knockout";

    // pick the fighter to do something

    const pickFighter = (
        fighters: FighterSim[],
        lastActionFighter?: FighterNum
    ): FighterNum => {
        let ratios: [number, number] = [fighters[0].compositeRating.output, fighters[1].compositeRating.output];

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

    // Kicks
    export const probKick = (kickingRating: number, strikingRating: number) => {
        const total = kickingRating + strikingRating;
        return kickingRating / total;
    };

    export const doKick = (attacker: FighterSim, opponent: FighterSim) => {
        console.log(`${attacker.name} kicks ${opponent.name}!`);
        opponent.health -= 15;
    }; 

    //punch
    export const probPunch = (kickingRating: number, strikingRating: number) => {
        const total = kickingRating + strikingRating;
        return strikingRating / total;
    };
    
    export const doPunch = (attacker: FighterSim, opponent: FighterSim) => {
        console.log(`${attacker.name} punches ${opponent.name}!`);
        opponent.health -= 10;
    };

    //simulate fight
     const simulateAction = (fighters: FighterSim[], actionFighter: FighterNum): boolean => {
        const opponent: FighterNum = actionFighter === 0 ? 1 : 0;
        const fighter = fighters[actionFighter];
    
        if (Math.random() < probKick(fighter.compositeRating.kicking, fighter.compositeRating.striking)) {
            doKick(fighter, fighters[opponent]);
        } else {
            doPunch(fighter, fighters[opponent]);
        }
    
        if (fighters[opponent].health <= 0) {
            console.log(`${fighters[actionFighter].name} wins!`);
            return true; // Fight over
        }
    
        return false; // Fight continues
    };

    export { pickFighter, simulateAction, FighterSim };
