import type { Bit, Flashcard, Plan, QuizQuestion } from "./types";

const planId = "plan-motion-01";
const createdAt = "2026-10-03T08:00:00.000Z";
const firstStudyDate = new Date("2026-10-04T00:00:00.000Z");

const bitSeeds = [
  {
    title: "Distance and displacement",
    content: "Separate how far something travels from where it ends up. Distance is the total length of the path and is a scalar. Displacement is the straight-line change in position from start to finish, with direction, and is a vector.",
    takeaway: "Distance is path length; displacement is net change in position.",
    estMinutes: 18, weight: 1, topic: "Describing motion",
    cards: [
      ["What is the difference between distance and displacement?", "Distance is the total path length (scalar). Displacement is the straight-line change in position with direction (vector).", "Distance is the total length of the path and is a scalar. Displacement is the straight-line change in position from start to finish, with direction."],
      ["A runner jogs 3 km east, then 3 km back west. What is the displacement?", "0 km. The runner ends where they started.", "Displacement is the straight-line change in position from start to finish, with direction, and is a vector."],
      ["Is distance a scalar or a vector?", "A scalar: it has size but no direction.", "Distance is the total length of the path and is a scalar."],
    ],
    questions: [
      ["mcq", "A student walks 4 m east then 3 m north. What is the magnitude of the displacement?", ["1 m", "5 m", "7 m", "12 m"], "5 m", "The legs are perpendicular, so displacement = √(4² + 3²) = 5 m. The distance walked is 7 m.", "Draw the two legs as a right triangle.", 2],
      ["tf", "Displacement can be zero even if the distance travelled is not zero.", ["True", "False"], "True", "Returning to the starting point gives zero displacement but a nonzero distance.", undefined, 1],
      ["fill", "Displacement is a ____ quantity because it has both size and direction.", undefined, "vector", "A vector has magnitude and direction; displacement is the change in position with direction.", undefined, 1],
      ["short", "Why can the distance travelled never be less than the magnitude of the displacement?", undefined, "A straight line is the shortest path between two points, so any real path is at least as long.", "Displacement is the straight-line separation; a path can only match it or be longer.", undefined, 2],
    ],
  },
  {
    title: "Speed and velocity",
    content: "Describe how fast and in which direction something moves. Average speed is total distance divided by total time. Average velocity is displacement divided by time and includes direction.",
    takeaway: "Speed = distance / time; velocity = displacement / time, with direction.",
    estMinutes: 20, weight: 1, topic: "Describing motion",
    cards: [
      ["What is the formula for average speed?", "Average speed = total distance ÷ total time.", "Average speed is total distance divided by total time."],
      ["A car travels 150 km in 2 hours. What is its average speed?", "75 km/h.", "Average speed is total distance divided by total time: 150 km ÷ 2 h = 75 km/h."],
      ["How does velocity differ from speed?", "Velocity includes direction (vector). Speed is magnitude only (scalar).", "Average velocity is displacement divided by time and includes direction."],
    ],
    questions: [
      ["mcq", "A cyclist rides 36 km in 2 h. What is the average speed?", ["12 km/h", "18 km/h", "36 km/h", "72 km/h"], "18 km/h", "Average speed = distance / time = 36 km / 2 h = 18 km/h.", "Divide distance by time.", 1],
      ["tf", "A car moving at constant speed around a circular track has constant velocity.", ["True", "False"], "False", "Velocity includes direction, which keeps changing on a curve, so velocity changes even though speed does not.", undefined, 2],
      ["fill", "Average velocity is displacement divided by ____.", undefined, "time", "Average velocity = displacement / time.", undefined, 1],
      ["short", "A runner completes one full lap of a track. What is the average velocity for the lap, and why?", undefined, "Zero, because the displacement for a full lap is zero.", "The runner returns to the start, so displacement, and therefore average velocity, is zero.", undefined, 2],
    ],
  },
  {
    title: "Acceleration",
    content: "Acceleration is the rate of change of velocity: a = (v − u) / t. It can speed an object up, slow it down, or change its direction. It is measured in metres per second squared.",
    takeaway: "Acceleration is the change in velocity per unit time: a = (v − u) / t.",
    estMinutes: 20, weight: 2, topic: "Describing motion",
    cards: [
      ["What is the formula for acceleration?", "a = (v − u) / t, where u is initial velocity, v is final velocity, and t is time.", "Acceleration is the rate of change of velocity: a = (v − u) / t."],
      ["What is the SI unit of acceleration?", "Metres per second squared (m/s²).", "It is measured in metres per second squared."],
      ["If velocity is positive and acceleration is negative, what is happening?", "The object is slowing down.", "It can speed an object up, slow it down, or change its direction."],
    ],
    questions: [
      ["mcq", "A car speeds up from 5 m/s to 25 m/s in 4 s. What is its acceleration?", ["2.5 m/s²", "5 m/s²", "6 m/s²", "20 m/s²"], "5 m/s²", "a = (25 − 5) / 4 = 5 m/s².", "Find the change in velocity first.", 1],
      ["tf", "An object moving at constant velocity has zero acceleration.", ["True", "False"], "True", "Acceleration is the rate of change of velocity; if velocity does not change, acceleration is zero.", undefined, 1],
      ["fill", "Acceleration is measured in metres per second ____.", undefined, "squared", "The unit m/s² comes from (m/s) / s.", undefined, 1],
      ["short", "Can an object accelerate while moving at constant speed? Give an example.", undefined, "Yes. Changing direction changes velocity, for example a car going around a bend at steady speed.", "Velocity is a vector, so a change in direction is an acceleration even if speed is constant.", undefined, 3],
    ],
  },
  {
    title: "Position-time graphs",
    content: "Read motion from a position-time graph. The slope of the graph is velocity. A straight sloped line means constant velocity, a horizontal line means the object is at rest, and a curved line means the velocity is changing.",
    takeaway: "On a position-time graph, slope equals velocity.",
    estMinutes: 22, weight: 2, topic: "Motion graphs",
    cards: [
      ["What does the slope of a position-time graph represent?", "Velocity.", "The slope of the graph is velocity."],
      ["What does a horizontal line on a position-time graph mean?", "The object is at rest; its position is not changing.", "A horizontal line means the object is at rest."],
      ["What does a curved line on a position-time graph indicate?", "The velocity is changing, so the object is accelerating.", "A curved line means the velocity is changing."],
    ],
    questions: [
      ["mcq", "A position-time graph is a straight line rising from 0 m at 0 s to 20 m at 5 s. What is the velocity?", ["0.25 m/s", "4 m/s", "15 m/s", "100 m/s"], "4 m/s", "Slope = rise / run = 20 m / 5 s = 4 m/s.", "Slope is rise over run.", 1],
      ["tf", "A steeper line on a position-time graph means a greater speed.", ["True", "False"], "True", "Slope is velocity, so a steeper line means a larger magnitude of velocity.", undefined, 1],
      ["fill", "A horizontal line on a position-time graph means the object is at ____.", undefined, "rest", "Position is not changing, so velocity is zero.", undefined, 1],
      ["short", "A position-time graph curves upward and gets steeper. What is happening to the velocity?", undefined, "It is increasing, so the object is accelerating.", "A steepening slope means velocity is growing.", undefined, 2],
    ],
  },
  {
    title: "Velocity-time graphs",
    content: "Read more from a velocity-time graph. The slope is acceleration, and the area between the line and the time axis is displacement. A horizontal line means constant velocity.",
    takeaway: "On a velocity-time graph, slope is acceleration and area is displacement.",
    estMinutes: 24, weight: 2, topic: "Motion graphs",
    cards: [
      ["What does the slope of a velocity-time graph represent?", "Acceleration.", "The slope is acceleration."],
      ["What does the area under a velocity-time graph represent?", "Displacement (the distance travelled, if the velocity never reverses).", "The area between the line and the time axis is displacement."],
      ["What does a horizontal line on a velocity-time graph show?", "Constant velocity, so zero acceleration.", "A horizontal line means constant velocity."],
    ],
    questions: [
      ["mcq", "A velocity-time graph is a straight line from 0 m/s at 0 s to 12 m/s at 3 s. What is the acceleration?", ["3 m/s²", "4 m/s²", "9 m/s²", "36 m/s²"], "4 m/s²", "Slope = 12 m/s / 3 s = 4 m/s².", "Slope is rise over run.", 1],
      ["tf", "A horizontal line on a velocity-time graph means the object is at rest.", ["True", "False"], "False", "A horizontal line means constant velocity. It means rest only if the line sits at zero velocity.", undefined, 2],
      ["fill", "The area under a velocity-time graph gives the ____.", undefined, "displacement", "Velocity multiplied by time gives displacement.", undefined, 2],
      ["short", "A car moves at a constant 10 m/s for 6 s. What displacement does the area under the graph show?", undefined, "60 m (10 m/s × 6 s).", "The area of the rectangle is velocity × time.", undefined, 2],
    ],
  },
  {
    title: "First equation of motion",
    content: "For motion in a straight line with constant acceleration, the first equation of motion links velocity, time, and acceleration: v = u + at. Here u is the initial velocity and v is the final velocity.",
    takeaway: "Constant acceleration: v = u + at.",
    estMinutes: 22, weight: 2, topic: "Equations of motion",
    cards: [
      ["State the first equation of motion.", "v = u + at.", "The first equation of motion links velocity, time, and acceleration: v = u + at."],
      ["In v = u + at, what do u and v stand for?", "u is the initial velocity and v is the final velocity.", "Here u is the initial velocity and v is the final velocity."],
      ["A bike starts from rest and accelerates at 2 m/s² for 5 s. What is its final velocity?", "10 m/s.", "v = u + at = 0 + (2 m/s²)(5 s) = 10 m/s."],
    ],
    questions: [
      ["mcq", "A ball moving at 4 m/s accelerates at 3 m/s² for 2 s. What is its final velocity?", ["6 m/s", "9 m/s", "10 m/s", "24 m/s"], "10 m/s", "v = u + at = 4 + 3 × 2 = 10 m/s.", "Substitute into v = u + at.", 1],
      ["tf", "The equation v = u + at holds even if the acceleration keeps changing.", ["True", "False"], "False", "It applies only to constant acceleration.", undefined, 2],
      ["fill", "An object starting from ____ has an initial velocity u = 0.", undefined, "rest", "Starting from rest means the initial velocity is zero.", undefined, 1],
      ["short", "A car brakes from 20 m/s with acceleration −4 m/s². How long until it stops?", undefined, "5 s.", "Set v = 0: t = (v − u) / a = (0 − 20) / (−4) = 5 s.", undefined, 3],
    ],
  },
  {
    title: "Second equation of motion",
    content: "The second equation of motion gives displacement under constant acceleration: s = ut + ½at². The first term is the displacement at the initial velocity, and the second term adds the extra displacement caused by acceleration.",
    takeaway: "Constant acceleration: s = ut + ½at².",
    estMinutes: 26, weight: 3, topic: "Equations of motion",
    cards: [
      ["State the second equation of motion.", "s = ut + ½at².", "The second equation of motion gives displacement under constant acceleration: s = ut + ½at²."],
      ["A car starts from rest and accelerates at 2 m/s² for 4 s. How far does it travel?", "16 m.", "s = ut + ½at² = 0 + ½(2)(4²) = 16 m."],
      ["Why does the ut term vanish when an object starts from rest?", "Because u = 0, so there is no initial velocity to carry it forward.", "The first term is the displacement at the initial velocity."],
    ],
    questions: [
      ["mcq", "An object starts from rest and accelerates at 3 m/s² for 4 s. What distance does it travel?", ["12 m", "24 m", "36 m", "48 m"], "24 m", "s = ½at² = ½ × 3 × 16 = 24 m.", "Starting from rest means u = 0.", 2],
      ["tf", "For an object starting from rest, s = ½at².", ["True", "False"], "True", "With u = 0, the ut term is zero.", undefined, 1],
      ["fill", "In s = ut + ½at², the quantity s is the ____.", undefined, "displacement", "s is the displacement over time t.", undefined, 1],
      ["short", "A train at 10 m/s accelerates at 1 m/s² for 6 s. What distance does it cover?", undefined, "78 m.", "s = ut + ½at² = 10 × 6 + ½ × 1 × 36 = 60 + 18 = 78 m.", undefined, 3],
    ],
  },
  {
    title: "Free fall",
    content: "Free fall is motion under gravity alone. Near Earth's surface every freely falling object accelerates downward at about 9.8 m/s², often rounded to 10 m/s², regardless of its mass, when air resistance is negligible.",
    takeaway: "In free fall, all objects accelerate at g ≈ 9.8 m/s² regardless of mass.",
    estMinutes: 24, weight: 2, topic: "Gravity and free fall",
    cards: [
      ["What is the acceleration due to gravity near Earth's surface?", "About 9.8 m/s² downward, often rounded to 10 m/s².", "Every freely falling object accelerates downward at about 9.8 m/s², often rounded to 10 m/s²."],
      ["Do heavier objects fall faster than lighter ones in free fall?", "No. Without air resistance, all objects fall with the same acceleration.", "Objects accelerate at the same rate regardless of mass when air resistance is negligible."],
      ["An object is dropped from rest. Using g = 10 m/s², what is its speed after 3 s?", "30 m/s.", "Using v = u + at with u = 0 and a = g = 10 m/s², v = 30 m/s."],
    ],
    questions: [
      ["mcq", "A stone is dropped from rest. Taking g = 10 m/s², how far does it fall in 2 s?", ["5 m", "10 m", "20 m", "40 m"], "20 m", "s = ½gt² = ½ × 10 × 4 = 20 m.", "Use s = ut + ½at² with u = 0.", 2],
      ["tf", "In a vacuum, a feather and a hammer dropped together land at the same time.", ["True", "False"], "True", "With no air resistance, all objects have the same free-fall acceleration.", undefined, 1],
      ["fill", "Free fall means moving under the influence of ____ alone.", undefined, "gravity", "No other force, such as air resistance, is considered.", undefined, 1],
      ["short", "A ball is thrown straight up. What is its velocity at the highest point, and what is its acceleration?", undefined, "Velocity is zero for an instant; acceleration is still g, about 9.8 m/s² downward.", "Gravity acts throughout the flight, including at the top.", undefined, 3],
    ],
  },
  {
    title: "Projectile motion basics",
    content: "A projectile moves under gravity after being launched. Its horizontal and vertical motions are independent. Horizontal velocity stays constant, ignoring air resistance, while vertical velocity changes with acceleration g downward.",
    takeaway: "Horizontal velocity is constant; vertical motion has acceleration g.",
    estMinutes: 28, weight: 3, topic: "Projectile motion",
    cards: [
      ["What is the horizontal acceleration of a projectile, ignoring air resistance?", "Zero, so horizontal velocity stays constant.", "Horizontal velocity stays constant, ignoring air resistance."],
      ["What is the vertical acceleration of a projectile?", "g, about 9.8 m/s² downward.", "Vertical velocity changes with acceleration g downward."],
      ["One ball is dropped and another is thrown horizontally from the same height at the same time. Which lands first?", "They land together. Both start with zero vertical velocity and share the same vertical acceleration.", "Its horizontal and vertical motions are independent."],
    ],
    questions: [
      ["mcq", "A ball rolls off a table with horizontal speed 3 m/s. Ignoring air resistance, what is its horizontal speed just before landing?", ["0 m/s", "3 m/s", "6 m/s", "10 m/s"], "3 m/s", "Horizontal velocity is constant when air resistance is ignored.", "Which direction has no acceleration?", 2],
      ["tf", "At the top of its path, a projectile has zero acceleration.", ["True", "False"], "False", "Gravity still acts, so acceleration is g downward even where vertical velocity is momentarily zero.", undefined, 3],
      ["fill", "A projectile's horizontal and vertical motions are ____ of each other.", undefined, "independent", "Each direction can be analysed separately.", undefined, 1],
      ["short", "A ball is thrown horizontally at 5 m/s from a cliff and lands after 2 s. How far from the base does it land?", undefined, "10 m (5 m/s × 2 s).", "Horizontal velocity is constant, so distance = speed × time.", undefined, 2],
    ],
  },
  {
    title: "Choosing the right equation",
    content: "Solve motion problems by listing the known and unknown quantities and choosing the equation that links them. When time is not involved, use v² = u² + 2as. Keep units consistent and check that the answer is reasonable.",
    takeaway: "Pick the equation by what you know and what you want, then check units and reasonableness.",
    estMinutes: 28, weight: 3, topic: "Problem solving",
    cards: [
      ["Which equation of motion does not involve time?", "v² = u² + 2as.", "When time is not involved, use v² = u² + 2as."],
      ["What is the first step in solving a motion problem?", "List the known and unknown quantities, with units.", "Solve motion problems by listing the known and unknown quantities."],
      ["What is a useful final check on a motion answer?", "Check units and whether the size and sign are physically reasonable.", "Keep units consistent and check that the answer is reasonable."],
    ],
    questions: [
      ["mcq", "A car at 10 m/s accelerates at 2 m/s² over 24 m. What is its final speed?", ["12 m/s", "14 m/s", "16 m/s", "34 m/s"], "14 m/s", "v² = u² + 2as = 100 + 2 × 2 × 24 = 196, so v = 14 m/s.", "Time is not given, so use v² = u² + 2as.", 3],
      ["tf", "If time is neither given nor asked for, v² = u² + 2as can be the most direct equation.", ["True", "False"], "True", "It links velocity, acceleration, and displacement without time.", undefined, 2],
      ["fill", "Before choosing an equation, list the known and ____ quantities.", undefined, "unknown", "Matching knowns and unknowns to an equation is the core method.", undefined, 1],
      ["short", "A car brakes from 20 m/s to rest in 40 m. What is its acceleration?", undefined, "−5 m/s².", "0 = 20² + 2a(40), so a = −400 / 80 = −5 m/s².", undefined, 3],
    ],
  },
] as const;

export const mockPlan: Plan = {
  id: planId,
  examDate: "2026-10-14",
  dailyMinutes: 25,
  createdAt,
};

export const mockBits: Bit[] = bitSeeds.map((seed, index) => {
  const scheduledDate = new Date(firstStudyDate);
  scheduledDate.setUTCDate(firstStudyDate.getUTCDate() + index);
  return {
    id: `bit-motion-${String(index + 1).padStart(2, "0")}`,
    planId,
    order: index + 1,
    title: seed.title,
    content: seed.content,
    takeaway: seed.takeaway,
    estMinutes: seed.estMinutes,
    weight: seed.weight,
    scheduledDate: scheduledDate.toISOString().slice(0, 10),
    status: index === 0 ? "done" : "todo",
  };
});

export const mockFlashcards: Flashcard[] = bitSeeds.flatMap((seed, bitIndex) => seed.cards.map(([front, back, sourceSnippet], cardIndex) => ({
  id: `card-motion-${bitIndex + 1}-${cardIndex + 1}`,
  bitId: mockBits[bitIndex].id,
  front,
  back,
  sourceSnippet,
  srs: {
    state: bitIndex === 0 ? "review" : "new",
    ease: 2.5,
    intervalDays: bitIndex === 0 ? 2 : 0,
    due: bitIndex === 0 ? "2026-10-05" : mockBits[bitIndex].scheduledDate,
    reps: bitIndex === 0 ? 2 : 0,
    lapses: 0,
  },
})));

export const mockQuestions: QuizQuestion[] = bitSeeds.flatMap((seed, bitIndex) => seed.questions.map(([type, prompt, options, answer, explanation, hint, difficulty], questionIndex) => ({
  id: `question-motion-${bitIndex + 1}-${questionIndex + 1}`,
  bitId: mockBits[bitIndex].id,
  type,
  prompt,
  options,
  answer,
  explanation,
  hint,
  difficulty,
  topic: seed.topic,
  flagged: false,
})));

export const mockData = {
  plan: mockPlan,
  bits: mockBits,
  cards: mockFlashcards,
  questions: mockQuestions,
};