var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var extend = require('extend');
var mkdirp = require('mkdirp');
var async = require('async');
var urlUtil = require('url');
var iconv = require('iconv-lite');
var path = require('path');


var Spider = function(url,options){
    if (typeof options === 'function') {
        return false;
    }
    this.config = {};
    //this.hrefLinks = [];
    //this.imgLinks = [];

    if (typeof options === 'object') {
        extend(this.config, options, {uri: url})
    } else if (typeof url === 'string') {
        extend(this.config, {url: url})
    } else {
        extend(this.config, url)
    }
    this.rootUrl = function (i) { return this.config.url.replace('%d', i);};
    if(url === undefined){
        return false;
    }
}
//处理入口
Spider.prototype.init = function(){
    this.crawler();

}
//处理第一层的链接(分页)
Spider.prototype.urls = function(){
    var url = this.config.url || '';
    var list = this.config.listPage || '';
    var i = this.config.from || 1;
    var to = this.config.to || 1;
    for(;i<to;i++){
        hrefLinks.push();
    }
}
//处理层级
Spider.prototype.crawler = function(){
    var self = this;
    var urlLevls = [];
    console.log('程序执行中');
    async.eachSeries(this.config.selector,function(item,callback){
        var index = self.config.selector.indexOf(item);
        if(index === 0){
            urlLevls[0] = [];
            var i = self.config.from;
            async.whilst(function(){
                return i <= self.config.to;
            },function(_callback){
                //urlLevls.push(this.config)
                console.log(i);
                self.request(self.rootUrl(i),function(status,$){

                    if(status){
                        var $$ = eval(item.$);
                        $$.each(function(){
                            var nextUrl = $(this).attr(item.attr);
                            urlLevels[0].push(nextUrl);
                        });
                    }
                    setTimeout(function () {
                        ++i;
                        _callback(null);
                    }, parseInt(Math.random() * 5000));
                })
            }, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('分页处理完成，共收集到了' + urlLevels[0].length);
                }
                console.log(urlLevls);
                callback(null);
            })
        }
    },function(err){
        if(err){

        }
    })
}
//重写request方法
Spider.prototype.request = function(url,callback){
    var self = this;
    var options = {
        url:url
    }
    var that = this;
    var opts = {
        url: url,
        encoding: null /// 设置为null时，得到的body为buffer类型
    };
    //this.config.header && (options.headers = this.config.headers);
    /*request(options,function(err,res,body){
        var $ = null;
        if(!err && res.statusCode === 200){
            console.log('状态:'+res.statusCode+','+url+';请求成功');
            $ = cheerio.load(iconv.decode(body,this.config.chartset || 'utf8'));
        }else{
            console.log('状态:'+res.statusCode+','+url+';请求失败');
        }
        callback(!!$,$);
    });
    config.headers && (opts.headers = config.headers);*/

    console.log('发送' + url + '，等待响应中...');
    request(opts, function (err, res, body) {
        var $ = null;
        if (!err && res.statusCode == 200) {
            that.log('状态' + res.statusCode + '， ' + url + '请求成功', 'green');
            $ = cheerio.load(iconv.decode(body, config.charset || 'utf8'));
        } else {
            !err && that.log('状态' + res.statusCode + '， ' + url + '请求失败', 'red');
        }
        callback(!!$, $);
    });
}

var spider = new Spider('http://www.henha.com/',{
    from:1,
    to:10,
    selector:[{
        $:'$(".detail-list li")',
        attr:'href'
    },{
        $:'$(".pp img")',
        attr:'src'
    }]
});
spider.init();
