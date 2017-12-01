    function shuffle(grid) {
        var shuffled = new Array();
        var len = grid.length;
        for (var i = 0; i < len; i++)
            shuffled.push(grid.splice(Math.floor(Math.random() * 101 ) % grid.length, 1).pop());
        return shuffled;
    }

    function startGame() {
		if(localStorage.getItem('highScore')==null)
			localStorage.setItem('highScore',0);
        var gameStatus = { score: 0, gameGrid: null, nextColor: null, gameLost: null, gImage: null, nImage: null, mDelta: {x:null, y:null}, hBeaten: null };
        var onKeyUp = moveKeyboard.bind(gameStatus);
        var onMouseDown=mDown.bind(gameStatus);
        var onMouseUp=mUp.bind(gameStatus);
        var gImage = new Image();   
        gImage.onload = function () {
            gameStatus.gImage = gImage;
            var nImage = new Image();
            nImage.onload = function () {
                gameStatus.nImage = nImage;
                document.addEventListener("keyup", onKeyUp, false);
                document.addEventListener("mousedown", onMouseDown, false);
                document.addEventListener("pointerdown", onMouseDown, false);
                document.addEventListener("touchstart", onMouseDown, false);
                document.addEventListener("mouseup", onMouseUp, false);
                document.addEventListener("pointerup", onMouseUp, false);
                document.addEventListener("touchend", onMouseUp, false);
                newGame(gameStatus);    
            };
            nImage.src = "NextBar.svg";
        };
        gImage.src = "Hues.svg";
    }

    function newGame(gameState) {
        var grid = new Array(16);
        var gameGrid = new Array(16);
        for (var i = 0; i < 16; i++) {
            grid[i] = i;
            gameGrid[i] = 0;
        }
        grid = shuffle(grid);
        for (var i = 0, n = 0; i < 16 && n != 4; i++) {
            var test = Math.random();
            var hue;
            if (test < (0.25 / (1 << n)))
                hue = 3;
            else if (test < (0.5 / (1 << n)))
                hue = 2;
            else if (test < (1 / (1 << n)))
                hue = 1;
            else
                hue = 0;
            if (hue)
                n++;
            gameGrid[grid[i]] = hue;
        }
        gameState.score = 0;
        gameState.gameGrid = gameGrid;
        gameState.gameLost = false;
        gameState.hBeaten = false;
        gameState.nextColor = genNextColor();
        drawGame(gameState);
    }

    function directionAux(d, i, j) {
        switch (d) {
            case 0:
                return 4 * i + j;
            case 1:
                return 4 * j + i;
            case 2:
                return 3 + 4 * i - j;
            case 3:
                return 12 + i - 4 * j;
        }
    }

    function moveKeyboard(event) {
        if (this.gameLost)
            return newGame(this);
        switch (event.keyCode) {
            case 37:
                return moveGrid(0,this);
            case 38:
                return moveGrid(1, this);
            case 39:
                return moveGrid(2, this);
            case 40:
                return moveGrid(3, this);
            default:
                return;
        }
    }

    function mDown(event) {
		event.preventDefault();
        this.mDelta.x = event.screenX || event.changedTouches[0].screenX || event.width;
        this.mDelta.y = event.screenY || event.changedTouches[0].screenY || event.height;
    }

    function mUp(event){
		event.preventDefault();
        if (this.gameLost)
            return newGame(this);
        var d = 0;
        var xDelta = (event.screenX || event.changedTouches[0].screenX || event.width) - this.mDelta.x;
        var yDelta = (event.screenY || event.changedTouches[0].screenY || event.height) - this.mDelta.y;
        var delta = (Math.abs(xDelta) < Math.abs(yDelta))?(d++,yDelta):xDelta;
        if (Math.abs(delta) < lesserDimension() / 10)
            return;
        if (delta > 0)
            d += 2;
        moveGrid(d, this);
    }

    function moveGrid(direction, gameState) {
        var moved = false;
        for (var i = 0; i < 4; i++)
            for (var j = 0; j < 3; j++) {
                if (gameState.gameGrid[directionAux(direction, i, j)] == 0) {
                    gameState.gameGrid[directionAux(direction, i, j)] = gameState.gameGrid[directionAux(direction, i, j + 1)];
                    gameState.gameGrid[directionAux(direction, i, j + 1)] = 0;
                    if (gameState.gameGrid[directionAux(direction, i, j)] != 0)
                        moved = true;
                    continue;
                }
                if (gameState.gameGrid[directionAux(direction, i, j)] == gameState.gameGrid[directionAux(direction, i, j + 1)]) {
                    gameState.gameGrid[directionAux(direction, i, j)]++;
                    gameState.score += (i << gameState.gameGrid[directionAux(direction, i, j)]);
                    gameState.gameGrid[directionAux(direction, i, j + 1)] = 0;
                    moved = true;
                }
            }
        if (moved) {
            var possibilities = new Array();
            for (var i = 0; i < 4; i++)
                if (gameState.gameGrid[directionAux(direction, i, 3)] == 0)
                    possibilities.push(i);
            possibilities = shuffle(possibilities);
            gameState.gameGrid[directionAux(direction, possibilities[0], 3)] = gameState.nextColor;
            gameState.nextColor = genNextColor();
            gameState.gameLost = isLost(gameState.gameGrid);
            gameState.hBeaten |= gameState.score > parseInt(localStorage.getItem("highScore"));
            if (gameState.hBeaten)
                localStorage.setItem("highScore", gameState.score);
            drawGame(gameState);
        }
    }

    function isLost(gameGrid) {
        for (var i = 0; i < gameGrid.length; i++)
            if (gameGrid[i] == 0)
                return false;
        for (var d = 0; d < 4; d++)
            for (var i = 0; i < 4; i++)
                for (var j = 0; j < 3; j++)
                    if (gameGrid[directionAux(d, i, j)] == gameGrid[directionAux(d, i, j + 1)])
                        return false;
        return true;
    }
 
    function genNextColor() {
        var test = Math.random();
        if (test < 1 / 15) return 4;
        if (test < 3 / 15) return 3;
        if (test < 7 / 15) return 2;
        return 1;
    }

    function drawGame(gameStatus) {
        var gameGrid = document.getElementById("gameGrid");
        gameGrid.style.position = "absolute";
        gameGrid.style.top = (window.innerHeight * 0.2) + "px";
        gameGrid.style.height = (window.innerHeight * 0.7) + "px";
        gameGrid.style.width = (gameGrid.clientHeight * 0.8) + "px";
        gameGrid.style.left = ((window.innerWidth - gameGrid.clientWidth) / 2) + "px";
        var nextColor = document.getElementById("nextColor");
        nextColor.style.position = "absolute";
        nextColor.style.top = (window.innerHeight * 0.1) + "px";
        nextColor.style.width = (gameGrid.clientWidth/2) + "px";
        nextColor.style.height = (window.innerHeight * 0.1) + "px";
        nextColor.style.left = ((window.innerWidth - nextColor.clientWidth) / 2) + "px";
        var gContext = gameGrid.getContext("2d");
        for (var i = 0; i < 16; i++)
            gContext.drawImage(gameStatus.gImage, gameStatus.gameGrid[i] * 1000, 0, 1000, 1250, (i % 4) * gameGrid.width / 4, Math.floor(i / 4) * gameGrid.height / 4, gameGrid.width / 4, gameGrid.height / 4);
        var nContext = nextColor.getContext("2d");
        nContext.drawImage(gameStatus.nImage, 0, (gameStatus.nextColor - 1) * 150, 1000, 150, 0, 0, nextColor.width, nextColor.height);
        var scoreBar = document.getElementById("scoreBar");
        scoreBar.innerText = gameStatus.score;
        scoreBar.style.color = gameStatus.gameLost ? "#ff0000" : "#000000";
        var score = document.getElementById("score");
        score.style.position = "absolute";
        score.style.top = "0px";
        score.style.height = (window.innerHeight * 0.1) + "px";
        score.style.width = (window.innerWidth) + "px";
        score.style.left = "0px";		
        var highScore = document.getElementById("highScore");
        highScore.style.position = "absolute";
        highScore.style.top = (window.innerHeight * 0.9)+ "px";
        highScore.style.height = (window.innerHeight * 0.1) + "px";
        highScore.style.width = (window.innerWidth) + "px";
        highScore.style.left = "0px";
        var hScoreBar = document.getElementById("hScoreBar");
        hScoreBar.innerText = localStorage.getItem("highScore");
        hScoreBar.style.color = gameStatus.hBeaten ? "#00ffff" : "#000000";
		hScoreBar.style.fontSize=(hScoreBar.parentNode.clientHeight-hScoreBar.previousElementSibling.clientHeight)+"px";
		scoreBar.style.fontSize=(scoreBar.parentNode.clientHeight-scoreBar.previousElementSibling.clientHeight)+"px";
    }

    function lesserDimension() {
        if (window.innerWidth < window.innerHeight)
            return window.innerWidth;
        return window.innerHeight;
    }