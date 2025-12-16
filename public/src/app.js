(function(){

window.onload = function(){
    app.init({
        container: document.getElementById('container')
    });
}

var app = {
    init: function(config){
        var me = this, doc = document, body = doc.body
            vendor = Hilo.browser.jsVendor;

        //禁止默认行为
        body.style[vendor + 'TouchCallout'] = 'none';
        body.style[vendor + 'UserSelect'] = 'none';
        body.style[vendor + 'TextSizeAdjust'] = 'none';
        body.style[vendor + 'TapHighlightColor'] = 'rgba(0,0,0,0)';

        //禁止页面滚动
        body.addEventListener('touchmove', function(e){
          e.preventDefault();
        }, false);
        
        me.initViewport(config);
    },

    initViewport: function(config){
        var me = this, win = window;

        //初始化视窗大小
        var width, height;
        var winWidth = win.innerWidth, winHeight = win.innerHeight;
        var winRatio = winWidth / winHeight;
        var targetWidth = 360, targetHeight = 640;
        var targetRatio = targetWidth / targetHeight;

        if(winWidth > targetWidth){
            width = targetWidth;
            height = Math.min(targetHeight, winHeight);
        }else if(winRatio > targetRatio){
            width = winWidth;
            height = winHeight;
        }else{
            width = 320;
            height = 480;
        }

        //设置容器
        var container = config.container;
        container.innerHTML = '';
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.style.overflow = 'hidden';

        //启动游戏
        win.game.init({
            container: container,
            width: width, 
            height: height
        });
    }

};

})();