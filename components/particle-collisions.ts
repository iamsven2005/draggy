import type { Particle, ParticleSystemState } from "../types/particle"

export function handleParticleCollisions(particles: Particle[], systemState: ParticleSystemState): void {
  const collisionForce = systemState.isCircleFormation ? 0.1 : 0.5

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i]
      const p2 = particles[j]

      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minDistance = p1.size + p2.size + 5

      if (distance < minDistance && distance > 0) {
        const overlap = minDistance - distance
        const separationForce = overlap * collisionForce

        const normalX = dx / distance
        const normalY = dy / distance

        p1.vx -= normalX * separationForce
        p1.vy -= normalY * separationForce
        p2.vx += normalX * separationForce
        p2.vy += normalY * separationForce

        const separationDistance = overlap * collisionForce
        p1.x -= normalX * separationDistance
        p1.y -= normalY * separationDistance
        p2.x += normalX * separationDistance
        p2.y += normalY * separationDistance
      }
    }
  }
}

export function checkParticleCollision(particle: Particle, particles: Particle[]): boolean {
  for (let j = 0; j < particles.length; j++) {
    const other = particles[j]
    if (other === particle) continue

    const dx = other.x - particle.x
    const dy = other.y - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = particle.size + other.size + 5

    if (distance < minDistance) {
      return true
    }
  }
  return false
}
