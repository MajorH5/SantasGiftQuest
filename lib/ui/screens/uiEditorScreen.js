import { Vector2 } from "../../PhysicsJS2D/src/vector2.js";
import { TileMap } from "../../tiles/tilemap.js";
import { Sounds } from "../../sounds/sounds.js";
import { Tile } from "../../tiles/tile.js";
import { UIBase } from "../uiBase.js";
import { Constants } from "../../misc/constants.js";
import { UIText } from "../uiText.js";

export const UIEditorScreen = (function () {
    return class UIEditorScreen extends UIBase {
        static DEFAULT_GRID_SIZE = new Vector2(20, 20);
        static DEFAULT_MAP_SCALE = 30;

        static MIN_MAP_SCALE = 5;
        static MAX_MAP_SCALE = 100;

        // creates a new ui editor class for creation
        // of maps
        constructor () {
            super({
                sizeScale: new Vector2(1, 1),
                backgroundColor: "#48529D",
                transparency: 1,
                backgroundEnabled: true
            });

            this.mapWindow = new UIBase({
                size: new Vector2(500, 500),
                pivot: new Vector2(0.5, 0.5),
                positionScale: new Vector2(0.5, 0.5),
                backgroundEnabled: true,
                backgroundColor: '#879CE1'
            });

            this.mapWindow.preChildRender.listen((context, screenSize) => {
                // TODO: Find a more sensible approach to this render layer issue
                // perhaps create a separate class for UI-based tilemap rendering
                const screenPosition = this.mapWindow.getScreenPosition(screenSize);

                this.tilemap.render(context, screenPosition.scale(2), (1 / Constants.TILE_SIZE) * this.mapScale)
            })

            this.mapWindow.mouseMove.listen(this.onMapMouseMoved.bind(this));
            this.mapWindow.mouseLeave.listen(() => {
                this.tileHighlight.visible = false;
            });
            this.mapWindow.mouseEnter.listen(() => {
                this.tileHighlight.visible = true;
            });
            
            this.gridLineContainer = new UIBase({
                sizeScale: new Vector2(1, 1)
            });
            this.gridLineContainer.parentTo(this.mapWindow);

            this.tileHighlight = new UIBase({
                borderColor: '#000000',
                transparency: 0.5,
                borderSize: 3,
                pivot: new Vector2(0.5, 0.5),
                position: Vector2.one.scale(UIEditorScreen.DEFAULT_MAP_SCALE).scale(0.5),
                size: Vector2.one.scale(UIEditorScreen.DEFAULT_MAP_SCALE)
            });
            this.tileHighlight.parentTo(this.mapWindow);
            this.mapWindow.parentTo(this);
            
            this.tileSelector = new UIBase({
                backgroundEnabled: true,
                backgroundColor: '#45538F',
                borderSize: 5,
                borderColor: '#6575BE',
                pivot: new Vector2(0.5, 1),
                sizeScale: new Vector2(0.8, 0),
                size: new Vector2(0, 100),
                positionScale: new Vector2(0.5, 1),
                position: new Vector2(0, -30),
                zIndex: 2
            });
            this.tileSelector.parentTo(this);

            this.editorState = new UIText('IDLE', {
                fontColor: '#ffffff',
                fontSize: 32,
                font: 'Gotham',
                sizeScale: new Vector2(1, 0),
                size: new Vector2(0, 50)                
            });
            this.editorState.parentTo(this);

            this.scrolled.listen((direction) => {
                let scale = this.mapScale + direction * 5;

                scale = Math.max(UIEditorScreen.MIN_MAP_SCALE, scale);
                scale = Math.min(scale, UIEditorScreen.MAX_MAP_SCALE);

                this.setMapScale(scale)
            });

            this.gridSize = UIEditorScreen.DEFAULT_GRID_SIZE;
            this.mapScale = UIEditorScreen.DEFAULT_MAP_SCALE;
            this.selectedTile = Vector2.zero;
            this.tileHighlightOffset = 0;
            this.editorElapsedTime = 0;
            this.lastMousePosition = Vector2.zero;
            this.spaceIsHeld = false;
            this.mapIsHeld = false;
            
            document.addEventListener('keydown', (event) => {
                if (event.key === ' ') this.spaceIsHeld = true;
            });
            document.addEventListener('keyup', (event) => {
                if (event.key === ' ') this.spaceIsHeld = false;
            });
            this.mapWindow.mouseDown.listen(() => this.mapIsHeld = true);
            this.mapWindow.mouseUp.listen(() => this.mapIsHeld = false);
            this.mouseMove.listen(this.onGlobalMouseMoved.bind(this));

            this.tilemap = new TileMap();
            this.tilemap.setSize(this.gridSize);
            this.tilemap.setTile(0, 0, new Tile(0, true, Vector2.zero));
            
            this.setMapScale(this.mapScale);
            this.redrawGridLines(this.gridSize);
        }

        selectTile (goalTile) {
            this.selectedTile = goalTile;
            const tileSize = Vector2.one.scale(this.mapScale)
            const tilePosition = goalTile.multiply(tileSize).add(tileSize.scale(0.5));
            
            this.tileHighlight.positionAbsolute = tilePosition;
        }

        onGlobalMouseMoved (position) {
            if (this.spaceIsHeld && this.mapIsHeld) {
                const offset = position.subtract(this.lastMousePosition);
    
                this.mapWindow.positionAbsolute = this.mapWindow.positionAbsolute.add(offset);
            } else if (this.mapIsHeld) {
                const mapWindowPosition = this.mapWindow.getScreenPosition();
                const localPosition = position.subtract(mapWindowPosition);
                const tilePosition = this.convertLocalToTile(localPosition);
                // console.log('doin', tilePosition)

                this.tilemap.setTile(tilePosition.x, tilePosition.y, new Tile(0, true, tilePosition.scale(this.mapScale*2)));
            }

            this.lastMousePosition = position.clone();
        }

        onMapMouseMoved (position) {
            const mapWindowPosition = this.mapWindow.getScreenPosition();
            const localPosition = position.subtract(mapWindowPosition);
            const tilePosition = this.convertLocalToTile(localPosition);

            this.selectTile(tilePosition);
        }

        convertLocalToTile (localPosition) {
            return localPosition.div(this.mapScale).floor();
        }

        redrawGridLines (gridSize) {
            this.gridLineContainer.clearChildren();

            for (let y = 0; y <= gridSize.y; y++) {
                const row = new UIBase({
                    sizeScale: new Vector2(1, 0),
                    size: new Vector2(0, 1),
                    pivot: new Vector2(0, 0.5),
                    positionScale: new Vector2(0, y / gridSize.y),
                    backgroundEnabled: true,
                    backgroundColor: '#ffffff'
                });
                row.parentTo(this.gridLineContainer);
                
                for (let x = 0; x <= gridSize.x; x++) {
                    const column = new UIBase({
                        sizeScale: new Vector2(0, 1),
                        size: new Vector2(1, 0),
                        pivot: new Vector2(0.5, 0),
                        positionScale: new Vector2(x / gridSize.x, 0),
                        backgroundEnabled: true,
                        backgroundColor: '#ffffff'
                    });
                    column.parentTo(this.gridLineContainer);
                }
            }
        }

        setGridSize (gridSize) {
            this.gridSize = gridSize;
            this.redrawGridLines(gridSize);
        }

        setMapScale (mapScale) {
            this.mapScale = mapScale;
            this.mapWindow.sizeAbsolute = this.gridSize.scale(mapScale);
            this.selectTile(this.selectedTile);
        }

        reset () {
            this.setGridSize(UIEditorScreen.DEFAULT_GRID_SIZE);
            this.setMapScale(UIEditorScreen.DEFAULT_MAP_SCALE);
        }

        update (deltaTime) {
            super.update(deltaTime);

            this.editorElapsedTime += deltaTime;
            this.tileHighlightOffset = ((1 + Math.sin(this.editorElapsedTime / 100)) / 2);

            const defaultSize = Vector2.one.scale(this.mapScale);
            const offset = Vector2.one.scale(this.tileHighlightOffset * this.mapScale / 2);

            this.tileHighlight.sizeAbsolute = defaultSize.add(offset);

            if (!Sounds.isThemePlayingType(Sounds.SND_EDITOR_THEME)) {
                Sounds.playTheme(Sounds.SND_EDITOR_THEME);
            }
        }
    }
})();