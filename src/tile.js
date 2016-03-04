
var Tile = Hilo.Class.create({
    Extends: Hilo.DOMElement,
    constructor: function Tile(number, props){
        Tile.superclass.constructor.call(this, props);

        this.width = this.height = props.size;
        var elem = this.drawable.domElement, style = elem.style;
        var vendor = Hilo.browser.jsVendor;
        style.position = 'absolute';
        style.textAlign = 'center';
        style.fontSize = (props.size - 25) + 'px';
        style.fontFamily = 'Hammersmith One, sans-serif';
        style.lineHeight = props.size + 'px';
        style[vendor + 'BorderRadius'] = '6px';
        style[vendor + 'BoxShadow'] = '0px -3px 0px rgba(0, 0, 0, 0.2) inset';

        this.change(number);
    },

    tileX: 0,
    tileY: 0,
    number: 0,

    change: function(number){
        if(number <= 0) return;
        var elem = this.drawable.domElement, style = elem.style;
        elem.innerHTML = number;
        var color = Tile.colors[number];
        style.backgroundColor = color && color.bg;
        style.color = color && color.font || '#fff';
        style.fontSize = (color && color.fontSize || 18) + 'px';
        this.number = number;
    },

    setPosition: function(tileX, tileY){
        var position = Tile.getPosition(tileX, tileY);
        this.x = position.x + this.pivotX;
        this.y = position.y + this.pivotY;
        this.tileX = tileX;
        this.tileY = tileY;
    },

    Statics: {
        tileSize: 50,
        tileGap: 8,
        tileBorder: 10,
        startX: 0,
        startY: 0,

        getPosition: function(tileX, tileY){
            var x = Tile.startX + Tile.tileBorder + tileX * (Tile.tileSize + Tile.tileGap);
            var y = Tile.startY + Tile.tileBorder + tileY * (Tile.tileSize + Tile.tileGap);
            return {x:x, y:y};
        },

        randomNumber: function(min, max){
            max = max || 11;
            min = min || 1;
            var exponent = Math.floor(Math.random()*(max - min + 1)) + min;
            return Math.pow(2, exponent);
        },

        colors: {
            2: {bg:'#49b4b4', fontSize:40},
            4: {bg:'#4db574', fontSize:40},
            8: {bg:'#78b450', fontSize:40},
            16: {bg:'#c4c362', fontSize:40},
            32: {bg:'#cea346', fontSize:40},
            64: {bg:'#dd8758', fontSize:40},
            128: {bg:'#cb6d6d', fontSize:26},
            256: {bg:'#c9809f', fontSize:26},
            512: {bg:'#bb79bc', fontSize:26},
            1024: {bg:'#9076b5', fontSize:22},
            2048: {bg:'#5c82e4', fontSize:22},
            4096: {bg:'#7aa1c5', fontSize:22},
            8192: {bg:'#3fa4a4', fontSize:22}
        }
    }

});