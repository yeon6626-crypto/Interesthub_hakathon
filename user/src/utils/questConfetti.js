import confetti from 'canvas-confetti'

export function fireQuestConfetti() {
  const duration = 2800
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#f4c430', '#4a7754', '#ffffff', '#e8a317'],
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#f4c430', '#4a7754', '#ffffff', '#e8a317'],
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.55 },
    colors: ['#f4c430', '#4caf50', '#fff8ea', '#4a90d9'],
  })

  frame()
}
