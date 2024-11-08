const FIGHTING_STYLES = {
  POWER_PUNCHER: {
    name: "Power Puncher",
    strength:"Knockout power, aggressive forward pressure",
    weakness:"Sacrifice speed and defense, struggle in longer fights",
    characteristics:"Heavy punches, knockout-focused, forward pressure",
    standing: {
      strikeChance: 1.6,
      takedownChance: 0.7,
      clinchChance: 0.7,
      waitChance: 0.5,
      punchPreference: 1.3,
      punchWeights: [2, 3.5, 4, 3, 4, 1.5, 2], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.2,
        submissionChance: 0.6,
        getUpChance: 1.0,
      },
      defensive: {
        strikeChance: 0.8,
        submissionChance: 0.5,
        sweepChance: 0.7,
        getUpChance: 1.3,
      },
    },clinch: {
      strikeChance: 1.3,
      takedownChance: 0.4,
      exitChance: 1.1,
    },
  },
  COUNTER_PUNCHER: {
    name: "Counter Puncher",
    strength:"Excellent timing, precision, great head movement",
    weakness:"Less aggressive, relies on opponent engaging",
    characteristics:"Wait for opponents' mistakes, counterattack with precision",
    standing: {
      strikeChance: 1.4,
      takedownChance: 0.7,
      clinchChance: 0.6,
      waitChance: 1.0,
      punchPreference: 1.2,
      punchWeights: [3, 4, 3, 3, 2, 1.5, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.2,
        submissionChance: 0.6,
        getUpChance: 1.0,
      },
      defensive: {
        strikeChance: 0.8,
        submissionChance: 0.5,
        sweepChance: 0.7,
        getUpChance: 1.3,
      },
    },
    clinch: {
      strikeChance: 1.3,
      takedownChance: 0.4,
      exitChance: 1.1,
    },
  },
  VOLUME_STRIKER: {
    name: "Volume Striker",
    strength:"High strike output, wears down opponents",
    weakness:"Less knockout power, open to counters",
    characteristics:"Consistent pressure, overwhelms with high volume",
    standing: {
      strikeChance: 1.6,
      takedownChance: 0.7,
      clinchChance: 0.8,
      waitChance: 0.4,
      punchPreference: 1.2,
      punchWeights: [5, 4, 3, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.3,
        submissionChance: 0.5,
        getUpChance: 1.1,
      },
      defensive: {
        strikeChance: 0.9,
        submissionChance: 0.4,
        sweepChance: 0.6,
        getUpChance: 1.4,
      },
    },
    clinch: {
      strikeChance: 1.3,
      takedownChance: 0.4,
      exitChance: 1.2,
    },
  },
  PRESSURE_FIGHTER: {
    name: "Pressure Fighter",
    strength:"Relentless, cuts off cage, aggressive",
    weakness:"Vulnerable to counters, overextension",
    characteristics:"Push forward, force opponents to fight backward",
    standing: {
      strikeChance: 1.6,
      takedownChance: 1.1,
      clinchChance: 1.2,
      waitChance: 0.3,
      punchPreference: 1.2,
      punchWeights: [3, 4, 4, 3, 3, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.3,
        submissionChance: 0.5,
        getUpChance: 1.0,
      },
      defensive: {
        strikeChance: 0.9,
        submissionChance: 0.5,
        sweepChance: 0.6,
        getUpChance: 1.3,
      },
    },
    clinch: {
      strikeChance: 1.3,
      takedownChance: 0.4,
      exitChance: 1.1,
    },
  },
  SWARMER: {
    name: "Swarmer",
    strength:"Effective in close range, heavy combinations",
    weakness:"Struggles with range fighters",
    characteristics:"Smother opponents, body shots and hooks in close quarters",
    standing: {
      strikeChance: 1.6,
      takedownChance: 0.8,
      clinchChance: 1.2,
      waitChance: 0.4,
      punchPreference: 1.2,
      punchWeights: [2, 3, 5, 4, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.3,
        submissionChance: 0.7,
        getUpChance: 0.9,
      },
      defensive: {
        strikeChance: 1.0,
        submissionChance: 0.6,
        sweepChance: 0.8,
        getUpChance: 1.2,
      },
    },
    clinch: {
      strikeChance: 1.3,
      takedownChance: 0.5,
      exitChance: 0.8,
    },
  },
  OUT_BOXER: {
    name: "Out-Boxer",
    strength:"Great movement and distance control",
    weakness:"Struggles against pressure fighters",
    characteristics:"Keeps opponents at range with jabs and straight punches",
    standing: {
      strikeChance: 1.9,
      takedownChance: 0.4,
      clinchChance: 0.4,
      waitChance: 1.2,
      punchPreference: 1.2,
      punchWeights: [5, 4, 2, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.0,
        submissionChance: 0.6,
        getUpChance: 1.3,
      },
      defensive: {
        strikeChance: 0.8,
        submissionChance: 0.5,
        sweepChance: 0.7,
        getUpChance: 1.4,
      },
    },
    clinch: {
      strikeChance: 0.8,
      takedownChance: 0.4,
      exitChance: 1.3,
    },
  },
  DEFENSIVE_BOXER: {
    name: "Defensive Boxer",
    strength:"Excellent defense, difficult to hit cleanly",
    weakness:"Less aggressive, lacks finishing power",
    characteristics:"Focus on head movement, footwork, making opponents miss",
    standing: {
      strikeChance: 1.3,
      takedownChance: 0.6,
      clinchChance: 0.7,
      waitChance: 1.3,
      punchPreference: 1.2,
      punchWeights: [4, 4, 3, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 0.9,
        submissionChance: 0.7,
        getUpChance: 1.2,
      },
      defensive: {
        strikeChance: 0.7,
        submissionChance: 0.6,
        sweepChance: 0.8,
        getUpChance: 1.3,
      },
    },
    clinch: {
      strikeChance: 0.9,
      takedownChance: 0.5,
      exitChance: 1.4,
    },
  },
  SWITCH_HITTER: {
    name: "Switch Hitter",
    strength:"Disrupts opponent timing, creates angles",
    weakness:"May become predictable with stance switching",
    characteristics:"Switch between orthodox and southpaw, open new striking opportunities",
    standing: {
      strikeChance: 1.4,
      takedownChance: 0.9,
      clinchChance: 0.9,
      waitChance: 0.6,
      punchPreference: 1.2,
      punchWeights: [3, 3, 3, 3, 3, 2, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.1,
        submissionChance: 0.9,
        getUpChance: 1.0,
      },
      defensive: {
        strikeChance: 0.9,
        submissionChance: 0.8,
        sweepChance: 0.9,
        getUpChance: 1.1,
      },
    },
    clinch: {
      strikeChance: 1.1,
      takedownChance: 0.5,
      exitChance: 1.0,
    },
  },
  KICKBOXER: {
    name: "Kickboxer",
    strength:"Powerful kicks and punches, versatile striking",
    weakness:"Vulnerable to takedowns if not well-rounded",
    characteristics:"Blends kicks and punches, strong striking variety",
    standing: {
      strikeChance: 1.7,
      takedownChance: 0.6,
      clinchChance: 0.6,
      waitChance: 0.8,
      punchPreference: 0.8,
      punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 3, 2], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.1,
        submissionChance: 0.5,
        getUpChance: 1.3,
      },
      defensive: {
        strikeChance: 0.8,
        submissionChance: 0.4,
        sweepChance: 0.6,
        getUpChance: 1.4,
      },
    },
    clinch: {
      strikeChance: 0.9,
      takedownChance: 0.5,
      exitChance: 1.3,
    },
  },
  MUAY_THAI: {
    name: "Muay Thai Fighter",
    strength:"Elbows, knees, clinch work, multi-limbed striking",
    weakness:"Vulnerable to wrestlers, may rely on clinch",
    characteristics:"Utilizes all limbs, strong in clinch positions",
    standing: {
      strikeChance: 1.5,
      takedownChance: 0.7,
      clinchChance: 1.4,
      waitChance: 0.6,
      punchPreference: 0.8,
      punchWeights: [2, 3, 3, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [4, 3, 2], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.0,
        submissionChance: 0.5,
        getUpChance: 1.3,
      },
      defensive: {
        strikeChance: 0.7,
        submissionChance: 0.4,
        sweepChance: 0.6,
        getUpChance: 1.4,
      },
    },
    clinch: {
      strikeChance: 1.6,
      takedownChance: 0.5,
      exitChance: 0.8,
    },
  },
  WRESTLER: {
    name: "Wrestler",
    strength:"Dominant control, strong takedowns",
    weakness:"May struggle with striking-focused opponents",
    characteristics:"Focus on takedowns, ground control, neutralizes striking",
    standing: {
      strikeChance: 1.1,
      takedownChance: 1.5,
      clinchChance: 0.9,
      waitChance: 0.6,
      punchPreference: 1.0,
      punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 1.2,
        submissionChance: 0.9,
        getUpChance: 0.5,
      },
      defensive: {
        strikeChance: 0.7,
        submissionChance: 0.6,
        sweepChance: 1.1,
        getUpChance: 1.0,
      },
    },
    clinch: {
      strikeChance: 0.9,
      takedownChance: 1.4,
      exitChance: 0.7,
    },
  },
  BRAZILIAN_JIU_JITSU: {
    name: "Brazilian Jiu-Jitsu",
    strength:"Excellent submissions, control on the ground",
    weakness:"Weak in striking, depends on takedowns",
    characteristics:"Focus on submissions, sweeps, and positional control",
    standing: {
      strikeChance: 1.0,
      takedownChance: 1.3,
      clinchChance: 1.1,
      waitChance: 0.8,
      punchPreference: 1.0,
      punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
      kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
    },
    ground: {
      offensive: {
        strikeChance: 0.8,
        submissionChance: 1.5,
        getUpChance: 0.4,
      },
      defensive: {
        strikeChance: 0.6,
        submissionChance: 1.3,
        sweepChance: 1.2,
        getUpChance: 0.7,
      },
    },
    clinch: {
      strikeChance: 0.7,
      takedownChance: 1.2,
      exitChance: 0.8,
    },
  },
  JUDO: {
      name: "Judo",
      strength:"Strong throws and trips, effective in clinch",
      weakness:"Can struggle with strong strikers",
      characteristics:"Throws, trips, transitioning into submissions",
      standing: {
        strikeChance: 1.1,
        takedownChance: 1.4,
        clinchChance: 1.3,
        waitChance: 0.7,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 0.9,
          submissionChance: 1.2,
          getUpChance: 0.7,
        },
        defensive: {
          strikeChance: 0.7,
          submissionChance: 1.0,
          sweepChance: 1.1,
          getUpChance: 0.9,
        },
      },
      clinch: {
        strikeChance: 0.8,
        takedownChance: 1.5,
        exitChance: 0.7,
      },
    },
    KARATE: {
      name: "Karate Fighter",
      strength: "Distance control, fast explosive strikes",
      weakness: "Can be vulnerable to pressure and close-range fighting",
      characteristics: "Wide stance, explosive in-and-out movement, counterstriking",
      standing: {
        strikeChance: 1.6,
        takedownChance: 0.7,
        clinchChance: 0.6,
        waitChance: 0.8,
        punchPreference: 0.7,
        punchWeights: [3, 4, 2, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [3, 4, 3], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 1.0,
          submissionChance: 0.6,
          getUpChance: 1.3,
        },
        defensive: {
          strikeChance: 0.8,
          submissionChance: 0.5,
          sweepChance: 0.7,
          getUpChance: 1.4,
        },
      },
      clinch: {
        strikeChance: 1.0,
        takedownChance: 0.4,
        exitChance: 1.3,
      },
    },
    SAMBO: {
      name: "Sambo Fighter",
      strength: "Strong takedowns, submission game, aggressive ground control",
      weakness: "Can struggle with elite strikers",
      characteristics: "Blends wrestling and judo with submissions, relentless grappling",
      standing: {
        strikeChance: 1.2,
        takedownChance: 1.4,
        clinchChance: 1.3,
        waitChance: 0.6,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [3, 2, 1], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 1.0,
          submissionChance: 1.3,
          getUpChance: 0.6,
        },
        defensive: {
          strikeChance: 0.8,
          submissionChance: 1.1,
          sweepChance: 1.0,
          getUpChance: 0.8,
        },
      },
      clinch: {
        strikeChance: 0.9,
        takedownChance: 1.4,
        exitChance: 0.8,
      },
    },
    TAEKWONDO: {
      name: "Taekwondo Fighter",
      strength: "Fast, high, and spinning kicks",
      weakness: "Lacks striking power with hands, susceptible to takedowns",
      characteristics: "Focus on fast, agile kicks, unpredictable striking style",
      standing: {
        strikeChance: 1.7,
        takedownChance: 0.6,
        clinchChance: 0.5,
        waitChance: 0.8,
        punchPreference: 0.5,
        punchWeights: [3, 3, 2, 2, 1, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [3, 4, 5], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 0.9,
          submissionChance: 0.5,
          getUpChance: 1.4,
        },
        defensive: {
          strikeChance: 0.7,
          submissionChance: 0.4,
          sweepChance: 0.6,
          getUpChance: 1.5,
        },
      },
      clinch: {
        strikeChance: 0.9,
        takedownChance: 0.5,
        exitChance: 1.4,
      },
    },
    GRECO_ROMAN_WRESTLER: {
      name: "Greco-Roman Wrestler",
      strength: "Strong upper-body takedowns, clinch control",
      weakness: "Limited in lower-body attacks",
      characteristics: "Clinch fighting, throws from upper-body control, no leg attacks",
      standing: {
        strikeChance: 1.0,
        takedownChance: 1.5,
        clinchChance: 1.4,
        waitChance: 0.6,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 1.1,
          submissionChance: 0.9,
          getUpChance: 0.5,
        },
        defensive: {
          strikeChance: 0.8,
          submissionChance: 0.7,
          sweepChance: 1.0,
          getUpChance: 0.9,
        },
      },
      clinch: {
        strikeChance: 0.8,
        takedownChance: 1.6,
        exitChance: 0.6,
      },
    },
    CATCH_WRESTLER: {
      name: "Catch Wrestler",
      strength: "Strong submissions, control on the ground",
      weakness: "Less refined in striking",
      characteristics: "Aggressive submission grappling, control focus",
      standing: {
        strikeChance: 1.1,
        takedownChance: 1.4,
        clinchChance: 1.3,
        waitChance: 0.6,
        punchPreference: 1.0,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 1.0,
          submissionChance: 1.3,
          getUpChance: 0.6,
        },
        defensive: {
          strikeChance: 0.8,
          submissionChance: 1.1,
          sweepChance: 1.0,
          getUpChance: 0.8,
        },
      },
      clinch: {
        strikeChance: 0.9,
        takedownChance: 1.4,
        exitChance: 0.8,
      },
    },
    FREESTYLE_WRESTLER: {
      name: "Freestyle Wrestler",
      strength: "Strong in both upper and lower body takedowns",
      weakness: "May struggle in striking exchanges",
      characteristics: "Mix of upper and lower-body takedowns, ground control",
      standing: {
        strikeChance: 1.1,
        takedownChance: 1.6,
        clinchChance: 1.2,
        waitChance: 0.6,
        punchPreference: 0.9,
        punchWeights: [3, 3, 3, 2, 2, 1, 1], // jab, cross, hook, uppercut, overhand, spinningBackfist, supermanPunch
        kickWeights: [2, 2, 1], // legKick, bodyKick, headKick
      },
      ground: {
        offensive: {
          strikeChance: 1.2,
          submissionChance: 0.9,
          getUpChance: 0.5,
        },
        defensive: {
          strikeChance: 0.9,
          submissionChance: 0.7,
          sweepChance: 1.1,
          getUpChance: 0.8,
        },
      },
      clinch: {
        strikeChance: 0.9,
        takedownChance: 1.5,
        exitChance: 0.7,
      },
    },
  };

export { FIGHTING_STYLES };