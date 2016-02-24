var fs = require('fs');
var request = require("request");
var cheerio = require("cheerio");
var mkdirp = require('mkdirp');
var async = require('async');
var path = require('path');
var URL = require('url');
var http = require('http');


var baseUrl = 'http://baidu.com/';
var config = {
    selector:'primary-content',
    charset:'utf8',
    saveDir:'D:/www/spider/save'
}
var selector = [
    { $: '$("#primary-content .post-content p").find("a")', attr: 'href' },
    { $: '$("#primary-content .post-content p").first().find("img")', attr: 'src' }
];
var page = {
    page:'page/%d',
    from:2,
    to:10
};

var Crawler = function(){
    this.from = page.from || 1;
    this.to = page.to || 2;
}


Crawler.prototype.crawl = function(){
    var self = this;
    var content = '#primary-content';
    var urlLevels = [];
    console.log('start');
    async.eachSeries(selector,function(item,callback){
        var index = selector.indexOf(item);
        //console.log(selector.indexOf(item));
        if(index === selector.length - 1){

        }else if(index === 0){
            var i = page.from;
            async.whilst(function(){
                return i < page.to;
            },function(_callback){
                self.request(baseUrl,function(status,$){
                    if(status) {
                        var $$ = eval(item.$);
                        $$.each(function () {
                            var nextUrl = $(this).attr(item.attr);
                            console.log(nextUrl);
                            //urlLevels[0].push(nextUrl);
                        })
                    }else{
                        console.log('request file');
                    }
                    setTimeout(function () {
                        ++i;
                        _callback(null);
                    }, parseInt(Math.random() * 2000));
                })
            },function(error){
                if(error){
                    console.log(error);
                }else{
                    console.log('page finshed,total:');
                }
                callback(null);
            })
        }
    })
}

Crawler.prototype.image = function(urls){
    var self = this;
    console.log('get images');
    var i = 0;
    var count = urls.length;
    async.whilst(function(){
        return i < count;
    },function(callback){
        var url = urls[i];
        self.request(url,function(status,$){
            var list = [];
            if(status){
                var last = selector[selector.length - 1];
                var $$ = eval(last.$);
                var len = $$.length;
                if(len > 0) {
                    $$.each(function(){
                        list.push({
                            url:$(this).attr(last.attr),
                            title:$(this).attr('alt')
                        });
                    })
                    self.dlImage(list,function(){
                        ++i;
                        callback();
                    })
                }else{
                    ++i;
                    callback();
                    console.log('load field');
                }
            }
        })
    },function(error){
        if(error){
            console.log('imageError'+error);
        }
    })
}

Crawler.prototype.dlImage = function(list,callback){
    var self = this;
    var count = list.length;
    if(count < 1){
        callback();
        return;
    }
    async.eachSeries(list,function(item,callback){
        var filename = item.url.match(/[^\/]+\.\w{3,4}$/)[0];
        var filepath = path.join(config.saveDir,item.title);
        mkdirp(filepath,function(error){
            if(error){
                callback();
            }else{
                request.head(item.url,function(error,res,body){
                    var url = item.url;
                    var savePath = path.join(filepath,filename);
                    fs.exists(savePath,function(exists){
                        if(exists){
                            console.log('path is exists');
                            callback();
                        }else{
                            request(url).pipe(fs.createWriteStream(savePath));
                            console.log('save success');
                            setTimeout(callback,parseInt(Math.random()*2000));
                        }
                    })
                })
            }
        })
    },function(error){
        if(error){
            console.log('download filed');
        }else{
            console.log('download finish');
        }
        callback();
    });
}

Crawler.prototype.init = function(){
    var self = this;
    var urls = [];
    var url = baseUrl;
    for(var i=self.from;i<self.to;i++){
        if(i==0){
            url = baseUrl;
        }else{
            var url = baseUrl + page.page.replace('%d',i);
        }
        this.request(url,function(status,$){
            if(status){
                var content = $('#primary-content');
                $(content).find('.post-content').each(function(i,item){
                    self.saveImage($(this).find('img').attr('src'),$(this).find('img').attr('alt'),$(this).find('p').first().text());
                    //self.detail($(this).find('a').attr('href'));
                })
            }
        })
    }
};

Crawler.prototype.detail = function(url){
    var self = this;
    this.request(url,function(status,$) {
        if (status) {
            var content = $('#primary-content');
            $(content).find('.post-content').each(function (i, item) {
                var that = $(this);
                //self.saveImage($(this).find('p').eq(1).text(),$(this).find('img').attr('src'));
                that.find('img').each(function (i, item) {
                    //console.log(that.find('img').attr('src'));
                    self.saveImage(that.find('img').attr('src'), that.find('img').attr('alt'),that.find('p').first().text(),function($){
                    });
                    //self.saveImage(that.find('img').attr('src'), that.find('img').attr('alt'),that.find('p').first().text());
                });
            });
        }
    });
}

Crawler.prototype.saveImage = function(url,filename,paths,callback){
    var self = this;
    var filepath = path.join('D:/www/pachong/save',paths)
    mkdirp(filepath,function(error){
        if(!error){
            var savePath = path.join(filepath, filename);
            http.get(url, function (res) {
                fs.exists(savePath,function(error){
                    if(!error){
                        console.log(error);
                        res.pipe(fs.createWriteStream(savePath));
                        if(callback) {
                            callback.call(this, filename, paths);
                        }
                    }
                })
            })
        }
    })
};

Crawler.prototype.save = function(){

}




Crawler.prototype.request = function(url,callback){
    var self = this;
    var opt = {
        url : url,
        encoding:config.charset || 'utf8'
    };
    request(opt, function (error, res, body) {
        var $ = null;
        if(!error && res.statusCode == 200){
            $ = cheerio.load(body);
        }
        callback(!!$,$);
    })
};




var cjd = new Crawler();
cjd.crawl();


