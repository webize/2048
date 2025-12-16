
var TileMap = Hilo.Class.create({
    constructor: function(width, height){
        this.width = width;
        this.height = height;
        this.length = this.width * this.height;
        this._data = new Array(width * height);
    },

    width: 0,
    height: 0,
    length: 0,

    _data: null,

    get: function(x, y){
        var me = this;
        if(x < 0 || x >= me.width || y < 0 || y >= me.height) return null;
        return me._data[y * me.width + x];
    },

    set: function(x, y, tile){
        var me = this;
        if(x < 0 || x >= me.width || y < 0 || y >= me.height) return;
        me._data[y * me.width + x] = tile;
        
        if(tile){
            tile.tileX = x;
            tile.tileY = y;
        }
    },

    move: function(x, y, tile){
        var newTile = this.get(tile.tileX, tile.tileY);
        if(newTile === tile){
            this.set(tile.tileX, tile.tileY, null);
        }
        this.set(x, y, tile);
    },

    reset: function(){
        this._data.length = 0;
    },

    //随机获取一个空格位置
    getRandomEmptyPosition: function(){
        var empty = [];
        for(var i = 0; i < this.width; i++){
            for(var j = 0; j < this.height; j++){
                if(!this.get(i, j)) empty.push({x:i, y:j});
            }
        }
        var index = Math.floor(Math.random()*empty.length);
        var position = empty[index];
        return position;
    },

    getAllTiles: function(){
        var me = this, arr = me._data, result = [];
        for(var i = 0; i < arr.length; i++){
            var tile = arr[i];
            if(tile) result.push(tile);
        }
        return result;
    }

});