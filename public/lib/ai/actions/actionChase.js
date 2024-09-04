import { Behavior } from "../behaviors/behavior.js";
import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { Constants } from "../../misc/constants.js";

export const ActionChase = (function () {
    // action class store more specialized complex actions
    // which can be included into behaviors, in this case
    // the chase action is used to chase the player

    return class ActionChase extends Behavior {

        constructor (host, entropy, chaseRelaseDistance) {
            super(host);
            this.ledge = null; // the ledge the host wants to jump from
            this.body = this.host.body;
            this.searching = false; // is the host searching for the target
            this.ledgeRunningStart = false; // did the host get a start position for the ledge run

            this.leftBranchChecked = false;
            this.rightBranchChecked = false;
            
            this.chaseRelaseDistance = chaseRelaseDistance;
            this.entropy = entropy;
        }

        // runs a ledge jump if the host has a target ledge
        ledgeJump (targetPosition, hostPosition) {
            if (this.ledge === null) {
                return;
            }

            if (this.ledge.position.subtract(hostPosition).magnitude() > Constants.TILE_SIZE * 3) {
                // got too far away from the ledge
                this.ledge = null;
                return;
            }

            this.debugger.setPrimaryState('LEDGE_JUMP');

            const isLeftJump = this.ledge.position.x < targetPosition.x;

            const runningStartTargetPosition = isLeftJump ? this.ledge.position.x : this.body.position.x + Constants.TILE_SIZE;
            const jumpTargetPosition = isLeftJump ? this.ledge.position.x + Constants.TILE_SIZE: this.body.position.x;
            
            if (this.ledgeRunningStart) {
                const distanceFromJump = Math.abs(jumpTargetPosition - hostPosition.x);

                this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);

                if (distanceFromJump < 4 && this.host.body.floored) {
                    this.host.motionJump();
                    this.ledge = null;
                    this.ledgeRunningStart = false;
                }
            } else  {
                const distanceFromStart = Math.abs(runningStartTargetPosition - hostPosition.x);

                this.host.motionWalk(runningStartTargetPosition < hostPosition.x ? -1 : 1);

                if (distanceFromStart < 4) {
                    this.ledgeRunningStart = true;
                }
            }
        }

        // runs when horizontal distance is exceeded
        horizontalChase (targetPosition, hostPosition) {
            if (this.searching) {
                return;
            }

            this.debugger.setPrimaryState('HORIZONTAL_CHASE');

            if (targetPosition.x < hostPosition.x) {
                this.host.motionWalk(-1);

                const tileLeft = this.raycast(hostPosition, new Vector2(-1, 0), Constants.TILE_SIZE / 4);

                if (tileLeft) {
                    this.host.motionJump();
                }
            } else if (targetPosition.x > hostPosition.x) {
                this.host.motionWalk(1);

                const tileRight = this.raycast(hostPosition, Vector2.xAxis, Constants.TILE_SIZE / 4);

                if (tileRight) {
                    this.host.motionJump();
                }
            }
        }

        // runs while the host is doing climbing actions
        climbingChase (targetPosition, targetBody, hostPosition, ladderBody, horizontalDistance, verticalDistance) {
            if (verticalDistance < Constants.TILE_SIZE && horizontalDistance < Constants.TILE_SIZE) {
                this.debugger.addState('climb stopped; within distance.');
                this.host.isClimbing = false;
                
                if (targetBody.floored && !this.host.body.floored) {
                    this.debugger.addState('looking for stable flooring');
                    this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                }

                return;
            }

            const ladderDistanceX = Math.abs(hostPosition.x - ladderBody.getCenter().x);
            
            this.debugger.setPrimaryState('CLIMBING_CHASE');

            if (this.searching && this.walkingDirection !== 0) {
                if (ladderDistanceX > 20) {
                    this.host.motionWalk(ladderBody.getCenter().x < hostPosition.x ? -1 : 1);
                } else {
                    this.host.haltMovement();
                }
            }

            // try to climb up to the target
            const upRayCast = this.raycast(hostPosition, new Vector2(0, -1), Constants.TILE_SIZE * 2, (body) => body.getTag('climbable'));

            this.debugger.addState(`ladder distanceX ${ladderDistanceX | 0}`);
            this.debugger.addState(`upRayCast ${upRayCast !== null}`);

            if (ladderDistanceX < 20 && upRayCast === null) {
                // reached top of ladder
                
                let bottomLeftTile = this.raycast(hostPosition, new Vector2(-1, 1), Constants.TILE_SIZE*2);
                let bottomRightTile = this.raycast(hostPosition, new Vector2(1, 1), Constants.TILE_SIZE*2);

                
                const target = bottomLeftTile || bottomRightTile;
                
                if (target) {
                    if (target.position.y !== targetPosition.y + targetBody.getSize().y / 2 && targetBody.floored) {
                        this.ledge = target;
                        this.ledgeRunningStart = false;
                    } else {
                        // just walk to it
                        this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                        this.searching = false;
                        this.leftBranchChecked = false;
                        this.rightBranchChecked = false;
                    }
                } else {
                    this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                    this.searching = false;
                    this.leftBranchChecked = false;
                    this.rightBranchChecked = false;
                }
            }
        }

        // runs when the target is above the host
        verticalChase (targetPosition, hostPosition, horizontalDistance, verticalDistance, target) {
            const ladderBody = this.host.touchingClimbable();

            if ((this.host.motionClimb() || this.host.isClimbing) && ladderBody !== null){
                this.climbingChase(targetPosition, target.body, hostPosition, ladderBody, horizontalDistance, verticalDistance);
                return;
            }

            this.debugger.setPrimaryState('VERTICAL_CHASE');

            if (verticalDistance > Constants.TILE_SIZE * 4 && target.body.velocity.y === 0) {
                // target is too high up and standing,
                // lets look for a way to reach them
                
                const filter = (body) => body.solid || body.getTag('climbable');

                let leftClimbable = this.raycast(hostPosition, new Vector2(-1, 0.1), Constants.TILE_SIZE * 5, filter);
                let rightClimbable = this.raycast(hostPosition, new Vector2(1, 0.1), Constants.TILE_SIZE * 5, filter);

                const climbable = (!leftClimbable?.solid && leftClimbable) || (!rightClimbable?.solid && rightClimbable);

                this.debugger.addState(`climbable: ${climbable !== null}`);

                if (climbable) {
                    this.searching = true;
                    this.host.motionWalk(climbable.getCenter().x < hostPosition.x ? -1 : 1);
                } else {
                    // no climbable tiles found, lets see if we can gain height
                    const spaceAbovePosition = (body) => {
                        if (body === null) {
                            return false;
                        }

                        let availableJump = Constants.TILE_SIZE * 3;
                        let current = body;
                        
                        do {
                            let previous = current;

                            current = this.raycast(current.getCenter(), new Vector2(0, -1), Constants.TILE_SIZE, (other) =>{
                                return other !== current && (other.solid || other.semiSolid);
                            });

                            if (current !== null) {
                                availableJump -= previous.position.y - current.position.y;
                            }
                        } while (availableJump > 0 && current !== null);

                        return availableJump > 0;
                    }
                    
                    let solidTileLeft = this.raycast(hostPosition, new Vector2(-1, 0), Constants.TILE_SIZE * 10);
                    let solidTileRight = this.raycast(hostPosition, new Vector2(1, 0), Constants.TILE_SIZE * 10);

                    // solidTileLeft = solidTileLeft !== null && spaceAbovePosition(solidTileLeft) ? solidTileLeft : null;
                    // solidTileRight = solidTileRight !== null && spaceAbovePosition(solidTileRight) ? solidTileRight : null;

                    const solid = (spaceAbovePosition(solidTileLeft) && solidTileLeft) || (spaceAbovePosition(solidTileRight) && solidTileRight);

                    if (solid) {
                        // found a solid tile, lets try to jump up to it
                        this.searching = true;
                        this.host.motionWalk(solid.position.x < hostPosition.x ? -1 : 1);

                        if (Math.abs(solid.position.subtract(hostPosition).x) < Constants.TILE_SIZE * 2) {
                            this.host.motionJump();
                        }
                    } else {
                        // let shouldCheckLeft = targetPosition.x < hostPosition.x;

                        if (!this.leftBranchChecked) {
                            this.host.motionWalk(-1);
                            this.leftBranchChecked = this.host.body.velocity.x === 0;
                            this.debugger.setPrimaryState('BRANCH_CHECK_LEFT');
                        } else if (!this.rightBranchChecked) {
                            this.host.motionWalk(1);
                            this.rightBranchChecked = this.host.body.velocity.x === 0;
                            this.debugger.setPrimaryState('BRANCH_CHECK_RIGHT');
                        } else if (this.leftBranchChecked && this.rightBranchChecked) {
                            this.rightBranchChecked = false;
                            this.leftBranchChecked = false;
                        }
                        
                    }
                }

            } else {
                const bottom = this.raycast(hostPosition, Vector2.yAxis, Constants.TILE_SIZE * 5);
                
                if (!this.body.floored  && bottom === null && horizontalDistance < Constants.TILE_SIZE) {
                    // falling look for nearby flooring
                    const bottomLeft = this.raycast(hostPosition, new Vector2(-1, 1), Constants.TILE_SIZE * 5);
                    const bottomRight = this.raycast(hostPosition, new Vector2(1, 1), Constants.TILE_SIZE * 5);

                    const flooring = bottomLeft || bottomRight;

                    if (flooring !== null) {
                        this.host.motionWalk(flooring.getCenter().x < hostPosition.x ? -1 : 1);
                    }
                } else if (target.body.floored) {
                    if (horizontalDistance > Constants.TILE_SIZE / 2) {
                        // standing on something so also move to them
                        this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                    } else {
                        this.debugger.setPrimaryState('HALT');
                        this.host.haltMovement();
                    }
                }

            }
            // try to jump up to the target
            if (this.host.walkingDirection === -1) {
                let leftWall = this.raycast(hostPosition, new Vector2(-1, 0.1), Constants.TILE_SIZE * 2, (b) => b.solid);
                let leftPit = this.raycast(hostPosition, new Vector2(-1, 1), Constants.TILE_SIZE * 2);

                this.debugger.addState(`jump?: ${leftWall !== null || leftPit === null}`);

                if (leftWall !== null || leftPit === null) {
                    this.host.motionJump();
                }
            } else if (this.host.walkingDirection === 1) {
                let rightWall = this.raycast(hostPosition, new Vector2(1, 0.1), Constants.TILE_SIZE * 2, (b) => b.solid);
                let rightPit = this.raycast(hostPosition, new Vector2(1, 1), Constants.TILE_SIZE * 2);
                
                this.debugger.addState(`jump?: ${rightWall !== null || rightPit === null}`);

                if (rightWall !== null || rightPit === null) {
                    this.host.motionJump();
                }
            } else {
                const above = this.raycast(hostPosition, new Vector2(0, -1), Constants.TILE_SIZE * 3);

                if (verticalDistance < Constants.TILE_SIZE * 3 && above && above.semiSolid) {
                    this.host.motionJump();
                } else {
                    let topLeft = this.raycast(hostPosition, new Vector2(-1, -1), Constants.TILE_SIZE * 2);
                    let topRight = this.raycast(hostPosition, new Vector2(1, -1), Constants.TILE_SIZE * 2);

                    // this.ledge = topLeft || topRight
                }

                if (this.searching) {
                    this.searching =  false;
                }
            }

            this.debugger.addState(`searching: ${this.searching}`);
            this.debugger.addState(`leftBranchChecked: ${this.leftBranchChecked}`);
            this.debugger.addState(`rightBranchChecked: ${this.rightBranchChecked}`);
        }
        
        // causes the host to chase the given target
        perform (target){
            const targetPosition = target.body.getCenter();
            const hostPosition = this.host.body.getCenter();

            if (this.ledge !== null) {
                this.ledgeJump(targetPosition, hostPosition);
                return;
            }

            const tileMap = this.getTileMap();

            const targetLower = tileMap ? this.raycast(targetPosition, Vector2.yAxis, Constants.TILE_SIZE * 5) : null;
            const hostLower = tileMap ? this.raycast(hostPosition, Vector2.yAxis, Constants.TILE_SIZE * 5) : null;

            const horizontalDistance = Math.abs(hostPosition.x - targetPosition.x);
            const verticalDistance = Math.abs(hostPosition.y - targetPosition.y);

            if (horizontalDistance > this.chaseRelaseDistance) {
                // walk towards the target
                this.horizontalChase(targetPosition, hostPosition);
            } else if (this.host.walkingDirection !== 0) {
                if (!this.searching) {
                    // target is close enough, stop walking
                    this.host.haltMovement();
                    this.debugger.setPrimaryState('HALT');
                }
                
                if (verticalDistance < Constants.TILE_SIZE * 2) {
                    this.searching = false;
                    this.leftBranchChecked = false;
                    this.rightBranchChecked = false;
                }
            }

            if (targetPosition.y < hostPosition.y) {
                this.verticalChase(targetPosition, hostPosition, horizontalDistance, verticalDistance, target);
            } else {
                if (verticalDistance > Constants.TILE_SIZE * 2) {
                    this.host.disableSemiSolids();
                }
            }
        }

        update (deltaTime, target) {
            super.update(deltaTime);
            this.perform(target);
        }
    }
})();