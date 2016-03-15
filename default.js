var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var extend = require('extend');
var mkdirp = require('mkdirp');
var async = require('async');
var urlUtil = require('url');
var iconv = require('iconv-lite');
var path = require('path');
var url = require('url');


var Spider = function(url,options){
    if (typeof options === 'function') {
        return false;
    }
    this.config = {};
    //this.hrefLinks = [];
    //this.imgLinks = [];

    if (typeof options === 'object') {
        extend(this.config, options, {url: url})
    } else if (typeof url === 'string') {
        extend(this.config, {url: url})
    } else {
        extend(this.config, url)
    }
    //console.log(this.config.url);
    this.rootUrl = function (i) { return this.config.url.replace('%%', i);};
    this.rootsite = this.config.url.match(/[^\.]+[^/]+/)[0];
    console.log(this.rootsite);
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
    var urlLevels = [];
    console.log('程序执行中');
    async.eachSeries(this.config.selector,function(item,callback){
        var index = self.config.selector.indexOf(item);
        //第一层获取链接
        if(index === 0){
            urlLevels[0] = [];
            var i = self.config.from;
            async.whilst(function(){
                return i <= self.config.to;
            },function(_callback){
                //urlLevls.push(this.config)
                self.request(self.rootUrl(i),function(status,$){
                    if(status){
                        var $$ = eval(item.$);
                        //console.log($$);
                        $$.each(function(){
                            var nextUrl = $(this).attr(item.attr);
                            //console.log(nextUrl);
                            if (!/^http:\/\//i.test(nextUrl)) {
                                nextUrl = self.rootsite + nextUrl;
                                if(self.config.isImagePage){
                                    self.request(nextUrl,function(_status,_$){
                                        var $$$ = _$;
                                        var s_first = $$$('.page-show').children().eq(0);
                                        var s_last = $$$('.page-show').children().last();
                                        if(_status){
                                            var first = s_first.hasClass('prev') ? s_first.next().text() : s_first.text();
                                            var last = (s_last.hasClass('next') ? s_last.prev().text() : s_last.text()).replace('..','');
                                            var s_from = first;
                                            async.whilst(function(){
                                                return s_from <= last;
                                            },function(cb){
                                                var s_url = url.resolve(self.rootsite, nextUrl.replace('.htm', '') + s_from + '.htm');
                                                if(s_from <= 1){
                                                    //console.log(s_from);
                                                    s_url = url.resolve(self.rootsite, nextUrl);
                                                }
                                                //var s_url = nextUrl.replace('.htm','')+s_from+'.htm';
                                                urlLevels[0].push(s_url);
                                                //console.log('----------------------' + s_url);
                                                ++s_from;
                                                cb();
                                            })
                                        }
                                    })
                                }else{
                                    urlLevels[0].push(nextUrl);
                                }
                            }
                            //console.log(urlLevels);

                        });
                    }
                    setTimeout(function () {
                        ++i;
                        _callback(null);
                    }, parseInt(Math.random() * 5000));
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('分页处理完成，共收集到了' + urlLevels[0].length);
                }
                console.log(urlLevels[0]);
                //console.log(urlLevels);
                callback(null);
            })
        }else if(index === self.config.selector.length - 1){//获取图片链接
            //console.log(urlLevels[0]);
            self.images(urlLevels[index-1]);
        }
    },function(err){
        if(err){

        }
    })
}
/// 处理标题(title)
Spider.prototype.title = function (str) {
    var title = str.replace(/[\\/:\*\?"<>\|\n\r]/g, '').trim();
    title = title.split('-')[0];
    //if (/-/.test(title)) {
    //    title = title.match(/(.+)\-[^\-]+$/)[0].trim();
    //}
    return title;
};
//处理图片
Spider.prototype.images = function(urls){
    var self = this;
    console.log('抓取图片中...'+urls.length);
    var i = 0;
    var count = urls.length;
    async.whilst(function () {
        return i < count;
    }, function (callback) {
        var uri = urls[i];
        console.log(uri);
        self.request(uri, function (status, $) {
            var list = []; /// 存储图片路径
            if (status) {
                var last = self.config.selector[self.config.selector.length - 1];
                var $$ = eval(last.$);
                var len = $$.length;
                if (len > 0) {
                    $$.each(function () {
                        var url = $(this).attr(last.attr);
                        /// 如果url地址是以//开头则默认补上http: （如果是https协议需自己手动修改）
                        if(/^\/\//.test(url)){
                            url='http:'+url;
                        }
                        list.push({
                            url: url,
                            title: self.title($("title").text()),
                        });
                    });
                }
                console.log('第 {0} 套图片收集了{1}张图片'.format((i + 1) + '/' + count, $$.length));
                self.dlImage(list, function () {
                    ++i;
                    callback();
                });
            } else {
                ++i;
                callback();
                console.log('页面' + uri + '请求失败', 'redBG');
            }
        });
    }, function (err) {
        if (err) that.log('imageError:' + err);
        //process.exit(0);
    });
}
/// 下载图片
Spider.prototype.dlImage = function (list, callback) {
    var self = this;
    var count = list.length;
    console.log('准备下载到本地中...');
    if (count < 1) {
        callback();
        return;
    }
    async.eachSeries(list, function (item, callback) {
        var filename = item.url.match(/[^\/]+\.((jpg)|(jpeg)|(png)|(gif)|(bmp))/)[0];
        var filepath = path.join(self.config.saveDir, item.title);
        mkdirp(filepath, function (err) {
            if (err) {
                callback(err);
            } else {
                request.head(item.url, function (err, res, body) {
                    //var fn = eval('(' + this.config.imageFn + ')');
                    var url = item.url;
                    var savePath = path.join(filepath, filename);
                    fs.exists(savePath, function (exists) {
                        if (exists) {
                            console.log(savePath + '已存在', 'yellow');
                            callback();
                        } else {
                            request(url).pipe(fs.createWriteStream(savePath));
                            console.log((list.indexOf(item) + 1) + '/' + count + '：' + path.join(filepath, filename) + '保存成功', 'green');
                            setTimeout(callback, parseInt(Math.random() * 2000));
                        }
                    });
                });
            }
        });
    }, function (err) {
        if (err) {
            console.log(err, "red");
        } else {
            console.log(list[0].title + ' ：下载完毕~', "greenBG");
        }
        callback();
    });
};
//重写request方法
Spider.prototype.request = function(url,callback){
    var self = this;
    var options = {
        url: url,
        encoding: null /// 设置为null时，得到的body为buffer类型
    }
    console.log('发送' + url + '，等待响应中...');
    request(options, function (err, res, body) {
        var $ = null;
        if (!err && res.statusCode == 200) {
            console.log('状态' + res.statusCode + '， ' + url + '请求成功');
            $ = cheerio.load(iconv.decode(body, self.config.charset || 'utf8'));
        } else {
            console.log('状态'+ url + '请求失败');
        }
        callback(!!$, $);
    });
}
String.prototype.format = function () {
    var formatted = this;
    var length = arguments.length;
    for (var i = 0; i < length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        var value = arguments[i];
        if (value === null || value === undefined)
            value = '';
        formatted = formatted.replace(regexp, value);
    }
    return formatted;
};

var spider = new Spider('http://www.henha.com/ji/sijianwu%%.html',{
    from:2,
    to:5,
    saveDir:'D:/www/cjd-crawler/save',
    isImagePage:true,
    charset:'gb2312',
    selector:[{
        $:'$(".detail-list li .dl-name a")',
        attr:'href'
    },{
        $:'$(".pp img")',
        attr:'src'
    }]
});
spider.init();
