var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var urlUtil = require('url');

var ImgDownLoad = function(url,saveDir){
    this.url = url || '';
    this.saveDir = saveDir || '';
    this.page = {
        from: 2,
        to: 11
    };
    this.headers = {
        'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
         'Cache-Control':'max-age=0',
        'accept-charset': 'gb2312',
        'Content-type': 'application/x-www-form-urlencoded;charset:gb2312',
         'Cookie':'cscpvcouplet_fidx=1; AJSTAT_ok_pages=1; AJSTAT_ok_times=1; bdshare_firstime=1457330586017; CNZZDATA3811623=cnzz_eid%3D1108602011-1457329960-%26ntime%3D1457329960',
        'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
    };
    this.urls = [];
}

/*


 */
//下载图片，传入图片名称，保存的路径
ImgDownLoad.prototype.download = function(imgname,imageUrl){
    if(imgname){
        var filepath = this.saveDir + '/' + imgname;
        console.log(filepath);
        fs.exists({
                path: filepath
            }, function (exists) {
                if(exists){
                    console.log('目录已经存在');
                }
                request(imageUrl).pipe(fs.createWriteStream(filepath));
                console.log('保存成功');
            });
    }
};

//处理url,返回dom的信息
ImgDownLoad.prototype.fix = function(url,callback){
    request(url,function(err,req,res){
        if(err){
            console.log('请求地址出错：'+err);
        }
        var $ = cheerio.load(res);
        callback($,null);
    })
};

//爬取的url
ImgDownLoad.prototype.request = function(url,callback){
    request(url,function(error,res,body){
        if(!error && res.statusCode === 200){
            var $ = cheerio.load(body);
            callback.call(this,!!$,$);
        }
    })
}

//根据url进入相应的列表
ImgDownLoad.prototype.init = function(){
    var urls = this.urlList();
    var self = this;
    var i = this.page.from;
    async.eachOfSeries(urls,function(item,callback){
        console.log(item);
        //self.fix(item,function($){
            //self.dom($,callback);
            //callback();
        //});
        request(item,function(err,req,res){
            if(err){
                console.log('请求地址出错：'+err);
            }
            var $ = cheerio.load(res);
            self.dom($);
            //callback($,null);
        })
    },function(){
        console.log('任务执行完成');
    })
};

ImgDownLoad.prototype.mkdir = function(dir){
    mkdirp(this.saveDir + '/' + dir);
}

//处理dom，找到url后进入内页
ImgDownLoad.prototype.dom = function($){
    var $$ = $;
    var self = this;
    $$('.photo li').each(function(){
        var path = $$(this).find('a img').attr('alt');
        var url = urlUtil.resolve(self.url,$$(this).find('a').attr('href'));
        self.mkdir(path);
        (function(url){
            self.fix(url,function($){
                self.detail($);
                self.innerPage($);
            })
        }(url))
    });
}

ImgDownLoad.prototype.detail = function($){
    var $$ = $;
    var self = this;
    $$('.file img').each(function(){
        var src = $$(this).attr('src');
        var alt = $$(this).attr('src');
        (function(src){
            self.download(alt,src);
        }(src))
    });
}

//内页
ImgDownLoad.prototype.innerPage = function($){
    var $$ = $;
    var self = this;
    $$('.image a').each(function(){
        var src = $$(this).attr('src');
        var alt = $$(this).attr('src');
        (function(src){
            self.detail(src);
        }(src))
    });
}

//列表页
ImgDownLoad.prototype.urlList = function(){
    var self = this;
    var i = this.page.from;
    var to = this.page.to;
    for(;i<to;i++){
        this.urls.push(urlUtil.resolve(self.url,i+'.html'));
    }
    //console.log(this.urls);
    return this.urls;
}


module.exports = ImgDownLoad;

var imgDown = new ImgDownLoad('http://www.mmkao.net/PANS/','D:/www/cjd-crawler/save');
imgDown.init();
