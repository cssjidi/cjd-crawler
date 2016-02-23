var fs = require('fs');
var request = require("request");
var cheerio = require("cheerio");
var mkdirp = require('mkdirp');
var async = require('async');
var path = require('path');
var URL = require('url');
var http = require('http');


var baseUrl = 'http://baidu.com';
var config = {
    selector:'primary-content',
    charset:'utf8'
}
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
                    self.saveImage(that.find('img').attr('src'), that.find('img').attr('alt'),that.find('p').first().text());
                });
            });
        }
    });
}

Crawler.prototype.saveImage = function(url,filename,paths,level){
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
                    }
                })
            })
        }
    })
};




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


/*
Crawler.prototype.save = function(filename){
    var self = this;
    var filepath = path.join('D:/www/pachong/save/',filename)
    mkdirp(filepath,function(error){
        var savePath = path.join(filepath);
        if(!error){
            fs.exists(savePath, function (exists) {
                if(exists){
                    console.log('Ä¿Â¼ÒÑ¾­´æÔÚ');
                }else{
                    request(baseUrl).pipe(fs.createWriteStream(savePath));
                }
            });
        }
    })
};
*/


var cjd = new Crawler();
cjd.crawl();


