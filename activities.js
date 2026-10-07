// Break activities, shared by the background worker, break page, popup and settings.
//   kind:   "micro" (20–30 seconds, at your desk) or "move" (about 1–2 minutes)
//   office: suits an open office      home: suits working from home
// Step types:
//   timed:   { text, hint, seconds, orb: "big" | "small" | "mid" }
//   confirm: { text, hint, confirm: "button label" }

function breathSteps(rounds, inSec, outSec, holds) {
  const steps = [];
  for (let i = 0; i < rounds; i++) {
    steps.push({ text: "Breathe in", hint: "Slowly, through your nose.", seconds: inSec, orb: "big" });
    if (holds) steps.push({ text: "Hold", hint: "Stay soft. No straining.", seconds: holds, orb: "big" });
    steps.push({ text: "Breathe out", hint: "Long and slow, through your mouth.", seconds: outSec, orb: "small" });
    if (holds) steps.push({ text: "Hold", hint: "Rest at the bottom of the breath.", seconds: holds, orb: "small" });
  }
  return steps;
}

const ACTIVITIES = [
  // ---------- micro-breaks ----------
  {
    id: "eyes", kind: "micro", office: true, home: true, emoji: "👀",
    title: "Rest your eyes",
    nudge: "Look at something far away for 20 seconds.",
    intro: "Screens hold your eyes at one distance all day. Twenty seconds of looking far away resets them.",
    done: "Eyes reset. Try to blink a little more as you get back to it.",
    steps: [
      { text: "Look far away", hint: "Out of a window or across the room, at least 6 metres away.", seconds: 20, orb: "small" },
      { text: "Blink slowly", hint: "A few slow, full blinks.", seconds: 8, orb: "mid" }
    ]
  },
  {
    id: "posture", kind: "micro", office: true, home: true, emoji: "🪑",
    title: "Posture check",
    nudge: "Twenty seconds to reset how you're sitting.",
    intro: "A quick top-to-bottom check. Adjust as you go.",
    done: "Reset. Your back will notice by the end of the day.",
    steps: [
      { text: "Feet flat", hint: "Both feet on the floor, knees roughly level with hips.", seconds: 5, orb: "mid" },
      { text: "Sit back", hint: "Use the backrest. Let your shoulders drop.", seconds: 6, orb: "mid" },
      { text: "Screen check", hint: "Top of the screen near eye level, about an arm's length away.", seconds: 6, orb: "mid" },
      { text: "Unclench", hint: "Relax your jaw and your forehead.", seconds: 5, orb: "small" }
    ]
  },
  {
    id: "wrists", kind: "micro", office: true, home: true, emoji: "🤲",
    title: "Loosen your wrists",
    nudge: "Thirty seconds for the hands that type all day.",
    intro: "Gentle movements for your hands and wrists. Stop if anything hurts.",
    done: "Hands loosened. Back to the keyboard.",
    steps: [
      { text: "Circle your wrists", hint: "Slow circles, both directions.", seconds: 10, orb: "mid" },
      { text: "Open and close", hint: "Spread your fingers wide, then make a soft fist. Repeat.", seconds: 10, orb: "mid" },
      { text: "Gentle stretch", hint: "Arm out, palm forward, gently ease the fingers back. Switch halfway.", seconds: 12, orb: "big" }
    ]
  },
  {
    id: "breaths", kind: "micro", office: true, home: true, emoji: "🌬️",
    title: "Three slow breaths",
    nudge: "Three slow breaths. That's all.",
    intro: "Breathing out longer than you breathe in is one of the quickest ways to settle down.",
    done: "Calmer already. Carry that into the next task.",
    steps: breathSteps(3, 4, 6, 0)
  },

  // ---------- movement breaks ----------
  {
    id: "water", kind: "move", office: true, home: true, emoji: "💧",
    title: "Drink a glass of water",
    nudge: "Get up, fill a glass, and drink it slowly.",
    intro: "Most of us forget to drink while we work. This one gets you off the chair too.",
    done: "Hydrated and moving. Easy win.",
    steps: [
      { text: "Go get a glass", hint: "Walk to the kitchen or the water cooler. Leave your phone behind.", confirm: "I've got my water" },
      { text: "Drink it slowly", hint: "Small sips. No rush.", seconds: 30, orb: "mid" }
    ]
  },
  {
    id: "stretch", kind: "move", office: true, home: true, emoji: "🙆",
    title: "Stand and stretch",
    nudge: "Stand up and give your back a one-minute stretch.",
    intro: "Five gentle moves next to your desk. Go only as far as feels good.",
    done: "Your back thanks you. Sitting is easier after a stretch.",
    steps: [
      { text: "Stand up", hint: "Feet hip-width apart, knees soft.", seconds: 5, orb: "mid" },
      { text: "Reach up high", hint: "Arms overhead, stretch tall through your fingertips.", seconds: 15, orb: "big" },
      { text: "Lean left", hint: "Keep reaching, bend gently to the left.", seconds: 10, orb: "mid" },
      { text: "Lean right", hint: "Now gently to the right.", seconds: 10, orb: "mid" },
      { text: "Roll down and up", hint: "Knees soft, let your arms hang toward the floor, then roll up slowly.", seconds: 15, orb: "small" }
    ]
  },
  {
    id: "walk", kind: "move", office: true, home: true, emoji: "🚶",
    title: "Take a 2-minute walk",
    nudge: "Get up and walk for two minutes: a corridor, a balcony, around the floor.",
    intro: "Walk anywhere. Leave your phone behind if you can.",
    done: "Two minutes of moving clears the head better than two minutes of scrolling.",
    steps: [
      { text: "Walk around", hint: "Easy pace. Look at things that aren't screens.", seconds: 120, orb: "mid" }
    ]
  },
  {
    id: "stairs", kind: "move", office: true, home: true, emoji: "🪜",
    title: "Take the stairs",
    nudge: "Walk up and down one flight of stairs.",
    intro: "One flight up, one flight down, at whatever pace suits you. Hold the rail.",
    done: "Heart rate up, head clearer. Nicely done.",
    steps: [
      { text: "One flight up and down", hint: "Steady pace. Hold the handrail.", confirm: "Done" },
      { text: "Catch your breath", hint: "Stand tall, breathe easy.", seconds: 10, orb: "mid" }
    ]
  },
  {
    id: "colleague", kind: "move", office: true, home: false, emoji: "🗣️",
    title: "Walk, don't message",
    nudge: "Walk over to a colleague instead of sending a message.",
    intro: "Got a quick question for someone nearby? Walk over and ask in person. No question? Go say hello.",
    done: "A few steps and a real conversation. Better than another chat message.",
    steps: [
      { text: "Go and talk to someone", hint: "A quick question, a hello, or a coffee invite.", confirm: "I'm back" }
    ]
  },
  {
    id: "shoulders", kind: "move", office: true, home: true, emoji: "🧘",
    title: "Loosen your neck and shoulders",
    nudge: "A one-minute release for the tension that builds up at a desk.",
    intro: "Slow, gentle movements only. Never force your neck.",
    done: "Less tension up top. Check your posture as you sit back down.",
    steps: [
      { text: "Roll shoulders back", hint: "Big slow circles, backwards.", seconds: 15, orb: "mid" },
      { text: "Roll shoulders forward", hint: "Now the other way.", seconds: 15, orb: "mid" },
      { text: "Look left", hint: "Turn your head slowly to the left and hold.", seconds: 10, orb: "small" },
      { text: "Look right", hint: "Slowly to the right and hold.", seconds: 10, orb: "small" }
    ]
  },
  {
    id: "twist", kind: "move", office: true, home: true, emoji: "🔄",
    title: "Seated back release",
    nudge: "Forty seconds of gentle twists without leaving your chair.",
    intro: "Sit tall near the front of your chair. Move slowly.",
    done: "Spine loosened. Sit tall as you get back to it.",
    steps: [
      { text: "Twist left", hint: "Hand on the left armrest or chair back, turn gently.", seconds: 12, orb: "mid" },
      { text: "Twist right", hint: "Now the other side.", seconds: 12, orb: "mid" },
      { text: "Arch and round", hint: "Hands on knees. Arch your back, then round it. Slowly repeat.", seconds: 15, orb: "big" }
    ]
  },
  {
    id: "breathe", kind: "move", office: true, home: true, emoji: "🫁",
    title: "Breathe for a minute",
    nudge: "Sit back and follow a slow breathing circle for about a minute.",
    intro: "Follow the circle: in for 4, hold for 4, out for 4, hold for 4. Four rounds.",
    done: "Your shoulders probably dropped a little. Carry that back with you.",
    steps: breathSteps(4, 4, 4, 4)
  },
  {
    id: "pushups", kind: "move", office: false, home: true, emoji: "💪",
    title: "Do 10 push-ups",
    nudge: "Ten push-ups: on the floor, on your knees, or against a wall.",
    intro: "Floor, knees, or wall push-ups all count. Pick what feels right today, and skip anything that hurts.",
    done: "Ten done. Blood's moving and your brain just got a boost.",
    steps: [
      { text: "10 push-ups", hint: "Your pace. Wall push-ups are completely fine.", confirm: "Done, all 10" },
      { text: "Shake it out", hint: "Roll your wrists and shoulders, breathe normally.", seconds: 10, orb: "mid" }
    ]
  },
  {
    id: "squats", kind: "move", office: false, home: true, emoji: "🦵",
    title: "Do 10 slow squats",
    nudge: "Stand up and do 10 slow squats. Hold a chair if you like.",
    intro: "Slow and controlled beats fast. Hold the back of a chair for balance if you want.",
    done: "Legs awake. That's the biggest muscles in your body, done in a minute.",
    steps: [
      { text: "10 slow squats", hint: "Sit back like there's a chair, then stand tall.", confirm: "Done, all 10" },
      { text: "Stand tall", hint: "Shoulders back, a couple of easy breaths.", seconds: 10, orb: "mid" }
    ]
  }
];

// Which activities can come up for these settings.
function availableActivities(settings, kind) {
  const place = settings.workplace === "home" ? "home" : "office";
  const enabled = (settings && settings.activities) || {};
  return ACTIVITIES.filter((a) =>
    (!kind || a.kind === kind) && a[place] && enabled[a.id] !== false
  );
}
