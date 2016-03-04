(function(){

var game = window.game = {
    container: null,
    width: 0,
    height: 0,
    loader: null,
    stage: null,
    ticker: null,

    state: null, //状态
    tileMap: null, //格子地图
    tileCache: [], //格子缓存

    maxNum: 0, //当前最大数字
    steps: 0, //当前操作次数
    score: 0, //当前分数
    best: 0, //最好成绩
    lastScore: 0, //上次的记录分数
    moving: false, //用户是否在移动操作

    init: function(config){
        var me = this;

        me.container = config.container;
        me.width = config.width;
        me.height = config.height;

        me.loadImages();
    },

    loadImages: function(){
        var me = this, loader = me.loader = new Hilo.LoadQueue();
        loader.add([
            {id:'bg', src:'images/bg.png'},
            {id:'logo', src:'images/logo.png'},
            {id:'restartBtn', src:'images/btn-restart.png'}
        ]).on('complete', function(e){
            me.initStage();
        }).start();
    },

    initStage: function(){
        var me = this;

        //舞台
        var stage = me.stage = new Hilo.Stage({
            canvas: container,
            width: me.width,
            height: me.height
        });

        //背景
        var bg = new Hilo.DOMElement({
            id: 'bg',
            width: me.width,
            height: me.height,
            element: Hilo.createElement('div', {
                style: {
                    position: 'absolute',
                    background: 'url('+ me.loader.get('bg').src +') repeat'
                }
            })
        });
        stage.addChild(bg);

        //Hilo水印
        document.body.appendChild(Hilo.createElement('div', {
            innerHTML: 'Powered by Hilo',
            className: 'hilo-info',
            style:{
                position: 'absolute',
                top: (me.height - 20) + 'px',
                left: (stage.viewport.left + me.width - 125) + 'px'
            }
        }));

        //启动计时器
        var ticker = me.ticker = new Hilo.Ticker(60);
        ticker.addTick(Hilo.Tween);
        ticker.addTick(stage);
        ticker.start();

        me.bindEvents();
        me.showStartup(true);
        // me.startGame();
        // me.showGameOver(true);
    },

    bindEvents: function(){
        //绑定交互事件
        var me = this, stage = me.stage, 
            pointerStart = Hilo.event.POINTER_START,
            pointerEnd = Hilo.event.POINTER_END;
        stage.enableDOMEvent([pointerStart, pointerEnd], true);
        stage.on(pointerStart, me.onPointerStart.bind(me));
        stage.on(pointerEnd, me.onPointerEnd.bind(me));

        //键盘事件
        document.addEventListener('keydown', function(e){
            var direction = -1;
            switch(e.keyCode){
                case 37: //左
                case 39: //右
                case 38: //上
                case 40: //下
                direction = e.keyCode;
                break;
            }
            if(direction > 0) me.moveTiles(direction);
        });
    },

    onPointerStart: function(e){
        var me = this;
        var isPlay = me.state == 'play';
        me.startX = isPlay ? e.stageX : -1;
        me.startY = isPlay ? e.stageY :  -1;
    },

    onPointerEnd: function(e){
        var me = this, minDelta = 2;
        if(me.startX < 0 || me.startY < 0) return;
        var deltaX = e.stageX - me.startX, absX = Math.abs(deltaX);
        var deltaY = e.stageY - me.startY, absY = Math.abs(deltaY);
        if(absX < minDelta && absY < minDelta) return;

        var direction;
        if(absX >= absY){
            direction = deltaX > 0 ? 39 : 37;
        }else{
            direction = deltaY > 0 ? 40 : 38;
        }
        me.moveTiles(direction);
    },

    showStartup: function(show){
        var me = this;

        if(!me.startup){
            var startup = me.startup = new Hilo.Container({
                id: 'startup',
                width: me.width,
                height: me.height
            });

            var logo = new Hilo.Bitmap({
                id: 'logo',
                image: me.loader.get('logo').content
            });
            logo.x = me.width - logo.getScaledWidth() >> 1;
            logo.y = me.height - logo.getScaledHeight() - 200 >> 1;

            var startBtn = new Hilo.DOMElement({
                id: 'startBtn',
                width: logo.getScaledWidth() >> 0,
                height: 45,
                element: Hilo.createElement('div', {
                    innerHTML: 'Start Game',
                    className: 'btn'
                })
            }).on(Hilo.event.POINTER_START, function(e){
                me.startGame();
            });
            startBtn.x = me.width - startBtn.getScaledWidth() >> 1;
            startBtn.y = logo.y + logo.getScaledHeight() + 50 >> 0;        

            startup.addChild(logo, startBtn);
        }

        if(show){
            me.stage.addChild(me.startup);
        }else{
            me.stage.removeChild(me.startup);
        }
    },

    startGame: function(){
        var me = this;

        me.state = 'play';
        me.showStartup(false);

        //重置数据
        me.score = 0;
        me.lastScore = 0;
        me.best = me.saveBestScore();
        me.steps = 0;
        me.maxNum = 2;
        me.moving = false;
        me.updateScore(false, true);

        //初始化格子缓存
        if(!me.tileCache.length) me.initTiles();
        me.tileCache = me.tileCache.concat(me.tileMap.getAllTiles());
        me.tileMap.reset();

        //初始化格子容器
        if(!me.tileContainer){
            me.tileContainer = new Hilo.Container({
                id: 'tileContainer',
                width: me.width,
                height: me.height
            });
            me.stage.addChild(me.tileContainer);
        }
        me.tileContainer.removeAllChildren();

        //初始化顶部工具条
        me.initToolBar();

        //放置起始格子
        var numStartTiles = 2, startTiles = [];
        while(numStartTiles--){
            var tile = me.tileCache.pop();
            var pos = me.tileMap.getRandomEmptyPosition();
            tile.setPosition(pos.x, pos.y);
            tile.change(Tile.randomNumber(1, 2));
            me.tileMap.set(pos.x, pos.y, tile);
            me.tileContainer.addChild(tile);
            me.maxNum = Math.max(me.maxNum, tile.number);
        }

        //测试数据
        // var data = [
        //     2, 4, 8, 16,
        //     32, 64, 128, 256,
        //     512, 1024, 2048, 4096,
        //     8192, 16384, 32768, 65536
        // ];
        // for(var i = 0; i < data.length; i++){
        //     if(!data[i]) continue;
        //     var tile = me.tileCache.pop();
        //     var x= i % 4, y = Math.floor(i / 4);
        //     tile.setPosition(x, y);
        //     tile.change(data[i]);
        //     me.tileMap.set(x, y, tile);
        //     me.stage.addChild(tile);
        //     me.maxNum = Math.max(me.maxNum, tile.number);
        // }
    },

    initToolBar: function(){
        var me = this;
        if(!me.toolbar){
            var toolbar = me.toolbar = new Hilo.Container({
                id: 'toolbar',
                width: me.width,
                height: me.height
            });

            var restartBtn = new Hilo.Bitmap({
                id: 'restartBtn',
                image: me.loader.get('restartBtn').content,
                scaleX: 0.4,
                scaleY: 0.4
            }).on(Hilo.event.POINTER_START, function(){
                me.startGame();
            });
            restartBtn.x = me.width - restartBtn.getScaledWidth() - Tile.startX >> 0;
            restartBtn.y = 20;

            var scoreView = new Hilo.DOMElement({
                id: 'scoreView',
                width: 70,
                height: 45,
                element: Hilo.createElement('div', {
                    innerHTML: '<p class="small-text">SCORE</p><p id="score" class="number">'+ me.score +'</p>',
                    className: 'info-box'
                })
            });
            scoreView.x = Tile.startX;
            scoreView.y = 20;

            var bestView = new Hilo.DOMElement({
                id: 'bestView',
                width: 70,
                height: 45,
                element: Hilo.createElement('div', {
                    innerHTML: '<p class="small-text">BEST</p><p id="best" class="number">'+ me.best +'</p>',
                    className: 'info-box'
                })
            });
            bestView.x = scoreView.x + bestView.getScaledWidth() + 20 >> 0;
            bestView.y = 20;

            toolbar.addChild(scoreView, bestView, restartBtn);
        }

        me.stage.addChild(me.toolbar);

        me.updateScore();
    },

    initTiles: function(){
        var me = this, margin = 20, border = 10;
        Tile.tileGap = 8;
        Tile.tileBorder = 10;
        Tile.tileSize = (me.width - margin * 2 - border * 2 - Tile.tileGap * 3) >> 2;
        Tile.tileSize = Math.min(Tile.tileSize, 65);
        var bgSize = me.width - margin * 2;
        Tile.tileBorder = bgSize - (Tile.tileSize * 4 + Tile.tileGap * 3) >> 1;

        //格子背景
        var ninebg = new Hilo.DOMElement({
            id: 'ninebg',
            width: bgSize,
            height: bgSize,
            alpha: 0.4,
            element: Hilo.createElement('div', {
                className: 'ninebg'
            })
        });
        Tile.startX = ninebg.x = me.width - ninebg.getScaledWidth() >> 1;
        Tile.startY = ninebg.y = 100;
        me.stage.addChild(ninebg);

        //初始化瓦片格子
        var tileMap = me.tileMap = new TileMap(4, 4);
        var numStartTiles = 2, startTiles = [];

        //创建格子缓存池
        for(var i = 0; i <= tileMap.length; i++){
            var tile = new Tile(2, {
                size: Tile.tileSize,
                pivotX: Tile.tileSize * 0.5 >> 0,
                pivotY: Tile.tileSize * 0.5 >> 0
            });

            me.tileCache.push(tile);
        }
    },

    moveTiles: function(direction, onlyCheck){
        var me = this;
        if(!onlyCheck && me.moving) return;
        if(!onlyCheck) me.moving = true;

        me.lastScore = me.score;

        var tileMap = me.tileMap, size = tileMap.width;
        var matches = [], moves = [], result = [];

        var isVertival = direction == 38 || direction == 40;
        var start = direction == 37 || direction == 38 ? 0 : size - 1;
        var sign = direction == 37 || direction == 38 ? 1 : -1;
        var i, j, x, y, lastTile, tile, index, checking, doMoving = false, tweenCount = 0;        

        for(i = 0; i < size; i++){
            lastTile = null;
            index = 0;
            checking = true;

            for(j = 0; j < size; j++){
                x = isVertival ? i : (start + sign * j);
                y = isVertival ? (start + sign * j) : i;
                tile = tileMap.get(x, y);

                if(checking && tile){ //计算重排或合并
                    if(lastTile && lastTile.number == tile.number){
                        //预处理可以合并的相邻格子
                        if(onlyCheck) return true;
                        tileMap.set(tile.tileX, tile.tileY, null);
                        me.tileCache.push(tile);
                        lastTile.mergeTile = tile;
                        tile.srcTile = lastTile;
                        lastTile = null;
                    }else{
                        //更新格子的位置
                        index++;
                        lastTile = tile;
                        var destX = isVertival ? i : start + sign * (index - 1);
                        var destY = isVertival ? start + sign * (index- 1) : i;
                        if(onlyCheck){
                            if(tile.tileX != destX || tile.tileY != destY) return true;
                        }else{
                            tile.oldX = tile.tileX;
                            tile.oldY = tile.tileY;
                            tileMap.move(destX, destY, tile);
                        }
                    }
                }else if(!checking && tile){//执行移动或合并
                    var pos = Tile.getPosition(tile.tileX, tile.tileY);
                    if(tile.tileX != tile.oldX || tile.tileY != tile.oldY){
                        //移动格子
                        doMoving = true;
                        tweenCount++;
                        Hilo.Tween.to(tile, {x:pos.x + tile.pivotX, y:pos.y + tile.pivotY}, {time:100, onComplete:function(tween){
                            var target = tween.target;
                            target.oldX = -1;
                            target.oldY = -1;
                            if(!--tweenCount) me.onMoveComplete(true);
                        }});
                    }
                    
                    var mergeTile = tile.mergeTile;
                    if(mergeTile){
                        //移动要合并的格子
                        doMoving = true;
                        tweenCount++;
                        //确保移动的格子在最上层
                        if(tile.depth > mergeTile.depth){
                            tile.parent.swapChildren(tile, mergeTile);
                        }
                        Hilo.Tween.to(mergeTile, {x:pos.x + mergeTile.pivotX, y:pos.y + mergeTile.pivotY}, {time:100, onComplete:function(tween){
                            var target = tween.target, srcTile = target.srcTile;
                            target.removeFromParent();
                            target.srcTile = null;
                            srcTile.change(srcTile.number * 2);
                            srcTile.mergeTile = null;
                            Hilo.Tween.from(srcTile, {scaleX:0.3, scaleY:0.3}, {time:100, ease:bounce, onComplete:function(tween){
                                if(!--tweenCount) me.onMoveComplete(true);
                            }});
                        }});
                        //增加分数
                        me.addScore(tile.number);
                    }
                }

                //更新完一列(行)格子后，开始移动或合并格子
                if(!onlyCheck && checking && j >= size - 1){
                    j = -1;
                    checking = false;
                }
            }
        }

        //无法移动或合并
        if(!doMoving){
            if(onlyCheck) return false;
            me.onMoveComplete(false);
        }
        return doMoving;
    },

    onMoveComplete: function(moved){
        var me = this;
        me.moving = false;
        if(!moved) return;

        me.steps++;
        me.updateScore(true);
        me.makeRandomTile();

        var failed = !me.moveTiles(37, true) && !me.moveTiles(38, true) &&  
                     !me.moveTiles(39, true) && !me.moveTiles(40, true);
        if(failed){
            me.showGameOver(true);
        }
    },

    makeRandomTile: function(){
        var me = this, tileMap = me.tileMap;

        //随机获取一个空格位置
        var position = tileMap.getRandomEmptyPosition();
        if(!position) return false;

        //随机产生2的指数幂
        var random = Math.random();
        var exponent = random <= 0.75 ? 1 :
                       random > 0.75 && random <= 0.99 ? 2 : 3;
        var randomNumber = Math.pow(2, exponent);

        //复用缓存格子
        var tile = me.tileCache.pop();
        tile.change(randomNumber);
        tile.setPosition(position.x, position.y);
        tileMap.set(position.x, position.y, tile);
        me.tileContainer.addChild(tile);
        Hilo.Tween.from(tile, {alpha:0}, {time:100});

        return true;
    },

    showGameOver: function(show){
        var me = this;
        if(!me.overScene){
            me.overScene = new Hilo.Container({
                id: 'over',
                width: me.width,
                height: me.height
            });

            var bg = new Hilo.DOMElement({
                width: me.width,
                height: me.height,
                alpha: 0.6,
                element: Hilo.createElement('div', {
                    style: {
                        position: 'absolute',
                        background: '#000'
                    }
                })
            });

            var msg = new Hilo.DOMElement({
                width: me.width,
                height: 50,
                y: 170,
                element: Hilo.createElement('div', {
                    innerHTML: 'Game Over',
                    className: 'over',
                    style: {
                        position: 'absolute'
                    }
                })
            });

            var startBtn = new Hilo.DOMElement({
                id: 'startBtn',
                width: 200,
                height: 45,
                element: Hilo.createElement('div', {
                    innerHTML: 'Try Again',
                    className: 'btn'
                })
            }).on(Hilo.event.POINTER_START, function(e){
                me.showGameOver(false);
                me.startGame();
            });
            startBtn.x = me.width - startBtn.getScaledWidth() >> 1;
            startBtn.y = msg.y + 100;

            me.overScene.addChild(bg, msg, startBtn);
        }

        if(show){
            me.state = 'over';
            me.stage.addChild(me.overScene);
        }else{
            me.stage.removeChild(me.overScene);
        }
    },

    updateScore: function(animate, force){
        var me = this, scoreElem = $('#score'), bestElem = $('#best');

        var delta = me.score - me.lastScore;
        if(scoreElem && (delta || force)){
            if(animate){
                var time = Math.min(400, delta*20);
                Hilo.Tween.to({value:me.lastScore}, {value:me.score}, {time:time, onUpdate:function(){
                    var value = this.target.value;
                    scoreElem.innerHTML = value + 0.5 >> 0;
                }});
            }else{
                scoreElem.innerHTML = me.score;
            }
        }

        if(bestElem && (me.score > me.best || force)){
            me.best = Math.max(me.score, me.best);
            me.saveBestScore();
            bestElem.innerHTML = me.best;
        }
    },

    addScore: function(number){
        var me = this;
        me.score += number;
        me.maxNum = Math.max(me.maxNum, number);
    },

    saveBestScore: function(){
        var score = this.score, best = 0;
        var canStore = Hilo.browser.supportStorage;
        var key = 'hilo-2048-best-score';

        if(canStore) best = parseInt(localStorage.getItem(key)) || 0;
        if(score > best){
            best = score;
            if(canStore) localStorage.setItem(key, score);
        }
        return best;
    }

};

function bounce(k){
    if(( k /= 1) < 0.3636){
        return 7.5625 * k * k;
    }else if(k < 0.7273){
        return 7.5625 * (k -= 0.5455) * k + 0.75;
    }else if(k < 0.9091){
        return 7.5625 * (k -= 0.8182) * k + 0.9375;
    }else{
        return 7.5625 * (k -= 0.9545) * k + 0.984375;
    }
}

function $(selector){
    return document.querySelector(selector);
}

})();