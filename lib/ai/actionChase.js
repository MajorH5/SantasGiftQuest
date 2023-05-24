import { Behavior } from "./behavior.js";
import { Vector2 } from "../PhysicsJS2D/src/vector2.js";
import { Constants } from "../constants.js";

export const ActionChase = (function () {
    // action class store more specialized complex actions
    // which can be included into behaviors, in this case
    // the chase action is used to chase the player

    return class ActionChase extends Behavior {

        constructor (host, entropy, chaseRelaseDistance) {
            super(host);
            this.ledge = null; // the ledge the host wants to jump from
            this.searching = false; // is the host searching for the target
            this.jumpNecesary = true; // is a jump required to reach the target
            this.ledgeRunningStart = false; // did the host get a start position for the ledge run
            
            this.chaseRelaseDistance = chaseRelaseDistance;
            this.entropy = entropy;
        }

        // runs a ledge jump if the host has a target ledge
        ledgeJump (targetPosition, hostPosition) {
            if (this.ledge === null) {
                return;
            }

            if (this.ledge.body.position.subtract(hostPosition).magnitude() > Constants.TILE_SIZE * 3) {
                // got too far away from the ledge
                this.ledge = null;
                return;
            }

            const isLeftJump = this.ledge.body.position.x < targetPosition.x;

            const runningStartTargetPosition = isLeftJump ? this.ledge.body.position.x : this.ledge.body.position.x + Constants.TILE_SIZE;
            const jumpTargetPosition = isLeftJump ? this.ledge.body.position.x + Constants.TILE_SIZE: this.ledge.body.position.x;
            
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

            const tileMap = this.getTileMap();

            if (targetPosition.x < hostPosition.x) {
                this.host.motionWalk(-1);

                const tileLeft = tileMap.rayCast(hostPosition, new Vector2(-1, 0), Constants.TILE_SIZE / 4);

                if (tileLeft) {
                    this.host.motionJump();
                }
            } else if (targetPosition.x > hostPosition.x) {
                this.host.motionWalk(1);

                const tileRight = tileMap.rayCast(hostPosition, Vector2.xAxis, Constants.TILE_SIZE / 4);

                if (tileRight) {
                    this.host.motionJump();
                }
            }
        }

        // runs while the host is doing climbing actions
        climbingChase (targetPosition, targetBody, hostPosition, ladderBody) {
            const ladderDistanceX = Math.abs(hostPosition.x - ladderBody.getCenter().x);
            const tileMap = this.getTileMap();

            if (this.searching && this.walkingDirection !== 0) {
                if (ladderDistanceX > 20) {
                    this.host.motionWalk(ladderBody.getCenter().x < hostPosition.x ? -1 : 1);
                } else {
                    this.host.haltMovement();
                }
            }

            // try to climb up to the target
            const upRayCast = tileMap.rayCast(hostPosition, new Vector2(0, -1), Constants.TILE_SIZE, (tile) => tile.body.getTag('climbable'));

            if (ladderDistanceX < 10 && upRayCast === null) {
                // reached top of ladder
                
                let bottomLeftTile = tileMap.rayCast(hostPosition, new Vector2(-1, 1), Constants.TILE_SIZE*2);
                let bottomRightTile = tileMap.rayCast(hostPosition, new Vector2(1, 1), Constants.TILE_SIZE*2);
                
                const target = bottomLeftTile || bottomRightTile;

                if (target) {
                    if (target.body.position.y !== targetPosition.y + targetBody.getSize().y / 2 && targetBody.floored) {
                        this.ledge = target;
                        this.ledgeRunningStart = false;
                    } else {
                        // just walk to it
                        this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                        this.searching = false;
                    }
                } else {
                    this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                    this.searching = false;
                }
            }
        }

        // runs when the target is above the host
        verticalChase (targetPosition, hostPosition, horizontalDistance, verticalDistance, target) {
            const tileMap = this.getTileMap();
            const ladderBody = this.host.touchingClimbable();

            if (horizontalDistance > Constants.TILE_SIZE * 3 && (this.host.motionClimb() || this.host.isClimbing) && ladderBody !== null){
                this.climbingChase(targetPosition, target.body, hostPosition, ladderBody);
                return;
            }

            if (verticalDistance > Constants.TILE_SIZE * 4 && target.body.velocity.y === 0) {
                // target is too high up and standing,
                // lets look for a way to reach them
                
                const filter = (tile) => tile.body.getTag('climbable');

                let leftClimbableTile = tileMap.rayCast(hostPosition, new Vector2(-1, 0), Constants.TILE_SIZE * 5, filter);
                let rightClimbableTile = tileMap.rayCast(hostPosition, new Vector2(1, 0), Constants.TILE_SIZE * 5, filter);

                const climbTile = leftClimbableTile || rightClimbableTile;

                if (climbTile) {
                    this.searching = true;
                    this.host.motionWalk(climbTile.body.position.x < hostPosition.x ? -1 : 1);
                } else {
                    // no climbable tiles found, lets see if we can gain height
                    const spaceAbovePosition = (tile) => {
                        const spaceAbove = tileMap.rayCast(tile.body.getCenter(), new Vector2(0, -1), Constants.TILE_SIZE * 3, (other) =>{
                            return other !== tile && (other.body.solid || other.body.semiSolid);
                        });
                        return spaceAbove === null;
                    }
                    
                    let solidTileLeft = tileMap.rayCast(hostPosition, new Vector2(-1, 0), Constants.TILE_SIZE * 10);
                    let solidTileRight = tileMap.rayCast(hostPosition, new Vector2(1, 0), Constants.TILE_SIZE * 10);

                    // solidTileLeft = solidTileLeft !== null && spaceAbovePosition(solidTileLeft) ? solidTileLeft : null;
                    // solidTileRight = solidTileRight !== null && spaceAbovePosition(solidTileRight) ? solidTileRight : null;

                    const solidTile = solidTileLeft || solidTileRight;

                    if (solidTile) {
                        // found a solid tile, lets try to jump up to it
                        this.searching = true;
                        this.host.motionWalk(solidTile.body.position.x < hostPosition.x ? -1 : 1);

                        if (Math.abs(solidTile.body.position.subtract(hostPosition).x) < Constants.TILE_SIZE * 2) {
                            this.host.motionJump();
                        }
                    }
                }

            } else {
                if (this.jumpNecesary) {
                    // try to jump up to the target
                    this.host.motionJump();

                    if (target.body.floored) {
                        // standing on something so also move to them
                        this.host.motionWalk(targetPosition.x < hostPosition.x ? -1 : 1);
                    }
                }

                if (this.searching) {
                    this.searching =  false;
                }
            }
        }
        
        // causes the host to chase the given target
        perform (target){
            const targetPosition = target.body.getCenter();
            const hostPosition = this.host.body.getCenter();

            if (this.ledge !== null) {
                this.ledgeJump(targetPosition, hostPosition);
                return;
            }

            this.jumpNecesary = true;

            const tileMap = this.getTileMap();

            const targetLowerTile = tileMap ? tileMap.rayCast(targetPosition, Vector2.yAxis, Constants.TILE_SIZE * 5) : null;
            const hostLowerTile = tileMap ? tileMap.rayCast(hostPosition, Vector2.yAxis, Constants.TILE_SIZE * 5) : null;

            const horizontalDistance = Math.abs(hostPosition.x - targetPosition.x);
            const verticalDistance = Math.abs(hostPosition.y - targetPosition.y);

            // check under the target and host
            // if both are on same level, don't jump
            if (targetLowerTile && hostLowerTile) {
                const pBody = targetLowerTile.body,
                      hBody = hostLowerTile.body;

                if (pBody.position.y === hBody.position.y) {
                    this.jumpNecesary = false;
                }
            }

            if (horizontalDistance > this.chaseRelaseDistance) {
                // walk towards the target
                this.horizontalChase(targetPosition, hostPosition);
            } else if (this.host.walkingDirection !== 0) {
                if (!this.searching) {
                    // target is close enough, stop walking
                    this.host.haltMovement();
                }
                
                if (verticalDistance < Constants.TILE_SIZE * 2) {
                    this.searching = false;
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
    }
})();