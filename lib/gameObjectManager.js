export const GameObjectManager = (function () {
    return class GameObjectManager {
        constructor () {
            this.gameObjects = [];
        }

        // clears all gameObjects from the manager
        clear () {
            this.gameObjects = [];
        }
        
        // loads a gameObject into the manager for batch
        // update and render calls
        spawn (gameObject) {
            const index = this.gameObjects.indexOf(gameObject);

            if (index !== -1) {
                console.warn('GameObject already spawned in manager!');
                return;
            }

            this.gameObjects.push(gameObject);
        }
        
        // de-quques a gameObject from the manager
        // returns true if the gameObject was found and removed
        despawn (gameObject) {
            for (let i = 0; i < this.gameObjects.length; i++) {
                if (this.gameObjects[i] === gameObject) {
                    this.gameObjects.splice(i, 1);
                    return true;
                }
            }

            return false;
        }

        // iterates through all gameObjects and calls their
        // update method
        update (deltaTime) {
            const despawned = [];

            for (let i = 0; i < this.gameObjects.length; i++) {
                const object = this.gameObjects[i];
                object.update(deltaTime);

                // incase object internally despawns itself
                if (!object.isSpawned) {
                    despawned.push(object);
                    object.onDespawn();
                    this.gameObjects.splice(i, 1);
                    i--;
                }
            }
            
            // curry out the despawned objects
            return despawned;
        }

        // iterates through all gameObjects and calls their
        // render method
        render (context, offset, scale) {
            const gameObjects = this.gameObjects.sort((a, b) => a.renderPriority - b.renderPriority);

            for (let i = 0; i < gameObjects.length; i++) {
                const object = gameObjects[i];

                if (object.isVisibleOnScreen(offset, scale)){
                    object.render(context, offset, scale);
                }
            }
        }

        // returns an array of gameObjects that match
        // the specified instance type
        getGameObjectsByType (type) {
            const gameObjects = [];

            for (let i = 0; i < this.gameObjects.length; i++) {
                if (this.gameObjects[i] instanceof type) {
                    gameObjects.push(this.gameObjects[i]);
                }
            }

            return gameObjects;
        }

        // returns all the gameObjects that are within
        // the manager
        getGameObjects () {
            return this.gameObjects;
        }
    };
})();