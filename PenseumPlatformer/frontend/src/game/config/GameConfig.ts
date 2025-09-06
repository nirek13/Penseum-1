/**
 * Centralized game configuration for physics, movement, and platform generation
 */
export class GameConfig {
  // Physics constants
  static readonly GRAVITY = 300;
  static readonly PLAYER_HORIZONTAL_SPEED = 200;
  
  // Jump configuration - easily tweakable
  static readonly JUMP_VELOCITY = 1000;
  static readonly DOUBLE_JUMP_VELOCITY = 800;
  static readonly JETPACK_VELOCITY = 600;
  static readonly TRAMPOLINE_JUMP_VELOCITY = 1400;
  
  // Platform generation configuration
  static readonly PLATFORM_REACH_PERCENTAGE = 0.5; // Use 80% of max jump capability
  static readonly PLATFORM_SAFETY_MARGIN = 30; // Extra safety margin in pixels
  static readonly MIN_PLATFORM_WIDTH = 150;
  static readonly MAX_PLATFORM_WIDTH = 200;
  static readonly PLATFORM_HEIGHT = 30;
  
  // Screen boundaries
  static readonly MIN_PLATFORM_EDGE_DISTANCE = 50;
  
  /**
   * Calculate maximum jump height based on jump velocity and gravity
   */
  static getMaxJumpHeight(): number {
    return Math.floor((this.JUMP_VELOCITY * this.JUMP_VELOCITY) / (2 * this.GRAVITY));
  }
  
  /**
   * Calculate time to reach peak of jump
   */
  static getJumpTimeToPeak(): number {
    return this.JUMP_VELOCITY / this.GRAVITY;
  }
  
  /**
   * Calculate maximum horizontal distance during a jump
   */
  static getMaxHorizontalJumpDistance(): number {
    return Math.floor(this.PLAYER_HORIZONTAL_SPEED * this.getJumpTimeToPeak() * 2);
  }
  
  /**
   * Calculate safe jump height (using configured reach percentage)
   */
  static getSafeJumpHeight(): number {
    return Math.floor(this.getMaxJumpHeight() * this.PLATFORM_REACH_PERCENTAGE);
  }
  
  /**
   * Calculate safe horizontal jump distance (using configured reach percentage)
   */
  static getSafeHorizontalDistance(): number {
    return Math.floor(this.getMaxHorizontalJumpDistance() * this.PLATFORM_REACH_PERCENTAGE);
  }
  
  /**
   * Calculate optimal vertical gap between platforms
   * Ensures platforms are within reach but challenging
   */
  static getOptimalVerticalGap(minGap: number = 40): number {
    const maxGap = this.getSafeJumpHeight() - this.PLATFORM_SAFETY_MARGIN;
    return Math.max(minGap, Math.floor(maxGap * 0.7)); // Use 70% of safe height for good gameplay
  }
  
  /**
   * Calculate if a platform position is reachable from another position
   */
  static isPlatformReachable(
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number,
    fromPlatformWidth: number = 0,
    toPlatformWidth: number = 0
  ): boolean {
    // Calculate effective horizontal distance (center to center)
    const horizontalDistance = Math.abs(toX + toPlatformWidth/2 - (fromX + fromPlatformWidth/2));
    
    // Calculate vertical distance (negative if going up)
    const verticalDistance = toY - fromY;
    
    // Check horizontal reachability
    const maxHorizontalReach = this.getSafeHorizontalDistance();
    if (horizontalDistance > maxHorizontalReach) {
      return false;
    }
    
    // Check vertical reachability
    const maxVerticalReach = this.getSafeJumpHeight();
    
    // If going up, check if within jump height
    if (verticalDistance < 0 && Math.abs(verticalDistance) > maxVerticalReach) {
      return false;
    }
    
    // If going down, it's always reachable (gravity helps)
    return true;
  }
  
  /**
   * Get debug information about jump physics
   */
  static getJumpPhysicsInfo() {
    return {
      gravity: this.GRAVITY,
      jumpVelocity: this.JUMP_VELOCITY,
      maxJumpHeight: this.getMaxJumpHeight(),
      maxHorizontalDistance: this.getMaxHorizontalJumpDistance(),
      safeJumpHeight: this.getSafeJumpHeight(),
      safeHorizontalDistance: this.getSafeHorizontalDistance(),
      reachPercentage: this.PLATFORM_REACH_PERCENTAGE * 100,
      timeToPeak: this.getJumpTimeToPeak().toFixed(2)
    };
  }
}