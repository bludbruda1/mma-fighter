
export const FIGHTING_STYLES = {
    POWER_PUNCHER: {
      name: "Power Puncher",
      strength:"Knockout power, aggressive forward pressure",
      weakness:"Sacrifice speed and defense, struggle in longer fights",
      characteristics:"Heavy punches, knockout-focused, forward pressure",
      strikeChance: 1.2,
      takedownChance: 0.7,
      clinchChance: 0.7,
      waitChance: 0.8,
      punchPreference: 1.2,
      punchWeights: [2, 3.5, 4, 3, 4, 1.5, 2], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    COUNTER_PUNCHER: {
      name: "Counter Puncher",
      strength:"Excellent timing, precision, great head movement",
      weakness:"Less aggressive, relies on opponent engaging",
      characteristics:"Wait for opponents' mistakes, counterattack with precision",
      strikeChance: 0.9,
      takedownChance: 0.7,
      clinchChance: 0.6,
      waitChance: 1.3,
      punchPreference: 1.2,
      punchWeights: [3, 4, 3, 3, 2, 1.5, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    VOLUME_STRIKER: {
      name: "Volume Striker",
      strength:"High strike output, wears down opponents",
      weakness:"Less knockout power, open to counters",
      characteristics:"Consistent pressure, overwhelms with high volume",
      strikeChance: 1.3,
      takedownChance: 0.7,
      clinchChance: 0.8,
      waitChance: 0.7,
      punchPreference: 1.2,
      punchWeights: [5, 4, 3, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    PRESSURE_FIGHTER: {
      name: "Pressure Fighter",
      strength:"Relentless, cuts off cage, aggressive",
      weakness:"Vulnerable to counters, overextension",
      characteristics:"Push forward, force opponents to fight backward",
      strikeChance: 1.3,
      takedownChance: 1.1,
      clinchChance: 1.2,
      waitChance: 0.6,
      punchPreference: 1.2,
      punchWeights: [3, 4, 4, 3, 3, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    SWARMER: {
      name: "Swarmer",
      strength:"Effective in close range, heavy combinations",
      weakness:"Struggles with range fighters",
      characteristics:"Smother opponents, body shots and hooks in close quarters",
      strikeChance: 1.3,
      takedownChance: 0.8,
      clinchChance: 1.2,
      waitChance: 0.7,
      punchPreference: 1.2,
      punchWeights: [2, 3, 5, 4, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    OUT_BOXER: {
      name: "Out-Boxer",
      strength:"Great movement and distance control",
      weakness:"Struggles against pressure fighters",
      characteristics:"Keeps opponents at range with jabs and straight punches",
      strikeChance: 1.1,
      takedownChance: 0.8,
      clinchChance: 0.6,
      waitChance: 1.1,
      punchPreference: 1.2,
      punchWeights: [5, 4, 2, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    DEFENSIVE_BOXER: {
      name: "Defensive Boxer",
      strength:"Excellent defense, difficult to hit cleanly",
      weakness:"Less aggressive, lacks finishing power",
      characteristics:"Focus on head movement, footwork, making opponents miss",
      strikeChance: 0.9,
      takedownChance: 0.8,
      clinchChance: 0.7,
      waitChance: 1.3,
      punchPreference: 1.2,
      punchWeights: [4, 4, 3, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    SWITCH_HITTER: {
      name: "Switch Hitter",
      strength:"Disrupts opponent timing, creates angles",
      weakness:"May become predictable with stance switching",
      characteristics:"Switch between orthodox and southpaw, open new striking opportunities",
      strikeChance: 1.1,
      takedownChance: 0.9,
      clinchChance: 0.9,
      waitChance: 0.9,
      punchPreference: 1.2,
      punchWeights: [3, 3, 3, 3, 3, 2, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    KICKBOXER: {
      name: "Kickboxer",
      strength:"Powerful kicks and punches, versatile striking",
      weakness:"Vulnerable to takedowns if not well-rounded",
      characteristics:"Blends kicks and punches, strong striking variety",
      strikeChance: 1.2,
      takedownChance: 0.8,
      clinchChance: 0.8,
      waitChance: 0.9,
      punchPreference: 0.8,
      punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 3, 2], // legKick, bodyKick, headKick
    },
    MUAY_THAI: {
      name: "Muay Thai Fighter",
      strength:"Elbows, knees, clinch work, multi-limbed striking",
      weakness:"Vulnerable to wrestlers, may rely on clinch",
      characteristics:"Utilizes all limbs, strong in clinch positions",
      strikeChance: 1.2,
      takedownChance: 0.7,
      clinchChance: 1.4,
      waitChance: 0.9,
      punchPreference: 0.8,
      punchWeights: [2, 3, 3, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [4, 3, 2], // legKick, bodyKick, headKick
    },
    WRESTLER: {
      name: "Wrestler",
      strength:"Dominant control, strong takedowns",
      weakness:"May struggle with striking-focused opponents",
      characteristics:"Focus on takedowns, ground control, neutralizes striking",
      strikeChance: 0.8,
      takedownChance: 1.5,
      clinchChance: 1.3,
      waitChance: 0.9,
      punchPreference: 1.0,
      punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    BJJ: {
      name: "Brazilian Jiu-Jitsu",
      strength:"Excellent submissions, control on the ground",
      weakness:"Weak in striking, depends on takedowns",
      characteristics:"Focus on submissions, sweeps, and positional control",
      strikeChance: 0.7,
      takedownChance: 1.3,
      clinchChance: 1.1,
      waitChance: 1.1,
      punchPreference: 1.0,
      punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    JUDO: {
        name: "Judo",
        strength:"Strong throws and trips, effective in clinch",
        weakness:"Can struggle with strong strikers",
        characteristics:"Throws, trips, transitioning into submissions",
        strikeChance: 0.8,
        takedownChance: 1.4,
        clinchChance: 1.5,
        waitChance: 1.0,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      KARATE: {
        name: "Karate Fighter",
        strength: "Distance control, fast explosive strikes",
        weakness: "Can be vulnerable to pressure and close-range fighting",
        characteristics: "Wide stance, explosive in-and-out movement, counterstriking",
        strikeChance: 1.3,
        takedownChance: 0.7,
        clinchChance: 0.6,
        waitChance: 1.1,
        punchPreference: 0.7,
        punchWeights: [3, 4, 2, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [3, 4, 3], // legKick, bodyKick, headKick
      },
      SAMBO: {
        name: "Sambo Fighter",
        strength: "Strong takedowns, submission game, aggressive ground control",
        weakness: "Can struggle with elite strikers",
        characteristics: "Blends wrestling and judo with submissions, relentless grappling",
        strikeChance: 0.9,
        takedownChance: 1.4,
        clinchChance: 1.3,
        waitChance: 0.9,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
      },
      TAEKWONDO: {
        name: "Taekwondo Fighter",
        strength: "Fast, high, and spinning kicks",
        weakness: "Lacks striking power with hands, susceptible to takedowns",
        characteristics: "Focus on fast, agile kicks, unpredictable striking style",
        strikeChance: 1.4,
        takedownChance: 0.6,
        clinchChance: 0.5,
        waitChance: 1.1,
        punchPreference: 0.5,
        punchWeights: [3, 3, 2, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [3, 4, 5], // legKick, bodyKick, headKick
      },
      GRECO_ROMAN_WRESTLER: {
        name: "Greco-Roman Wrestler",
        strength: "Strong upper-body takedowns, clinch control",
        weakness: "Limited in lower-body attacks",
        characteristics: "Clinch fighting, throws from upper-body control, no leg attacks",
        strikeChance: 0.7,
        takedownChance: 1.5,
        clinchChance: 1.6,
        waitChance: 0.9,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      CATCH_WRESTLER: {
        name: "Catch Wrestler",
        strength: "Strong submissions, control on the ground",
        weakness: "Less refined in striking",
        characteristics: "Aggressive submission grappling, control focus",
        strikeChance: 0.8,
        takedownChance: 1.4,
        clinchChance: 1.3,
        waitChance: 0.9,
        punchPreference: 1.0,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      FREESTYLE_WRESTLER: {
        name: "Freestyle Wrestler",
        strength: "Strong in both upper and lower body takedowns",
        weakness: "May struggle in striking exchanges",
        characteristics: "Mix of upper and lower-body takedowns, ground control",
        strikeChance: 0.8,
        takedownChance: 1.6,
        clinchChance: 1.2,
        waitChance: 0.9,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
  };