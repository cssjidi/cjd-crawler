var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var urlUtil = require('url');
var iconv = require('iconv-lite');
//var buffer = require('buffer');
var path = require('path');

var note = ['rosi','sijianwu','fengsumeiniang','4k-star'];
var config = note[3];

var ImgDownLoad = function(url,saveDir){
    this.url = url || '';
    this.saveDir = saveDir || '';
    this.page = {
        from: 0,
        to:5
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
ImgDownLoad.prototype.download = function(obj){
    var self = this;
    var i = 0;
    //console.log(obj);
    async.mapLimit(obj,5,function(item,callback){
        var savePath = path.join(self.saveDir, item.title);
        var savefile = path.join(savePath,item.alt+'.jpg')
        request(item.src).on('error',function(err){
            console.log('保存错误：'+err);
        }).pipe(fs.createWriteStream(savefile));
        setTimeout(function () {
            ++i;
            callback(null);
        }, parseInt(Math.random() * 5000));
    },function(err,result){
        if(err){
            console.log('保存错误：'+err);
        }
        console.log('保存成功，共：'+i+';张图片'+result);
    });
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
    var self = this;
    var opts = {
        url: url,
        encoding: null /// 设置为null时，得到的body为buffer类型
    };

    //config.headers && (opts.headers = config.headers);

    console.log('发送' + url + '，等待响应中...', 'grey');
    request(opts, function (err, res, body) {
        var $ = null;
        if (!err && res.statusCode == 200) {
            console.log('状态' + res.statusCode + '， ' + url + '请求成功', 'green');
            $ = cheerio.load(iconv.decode(body, 'gb2312'));
        } else {
            !err && console.log('状态' + res.statusCode + '， ' + url + '请求失败', 'red');
        }
        callback(!!$, $);
    });
}

//根据url进入相应的列表
ImgDownLoad.prototype.init = function(){
    var urls = this.urlList();
    var self = this;
    var i = this.page.from;
    async.eachSeries(urls,function(item,callback){
        self.request(item,function(status,$){
            //console.log(status);
            if(status){
                self.dom($);
            }
            //callback(null);
            setTimeout(function () {
                ++i;
                callback(null);
            }, parseInt(Math.random() * 2000));
        });
    },function(){
        console.log('任务执行完成');
    })
};

ImgDownLoad.prototype.start = function(){
    var urls = this.urlList();
    var self = this;
    var i = this.page.from;
    async.mapLimit(urls,5,function(item,callback){
        self.request(item,function(status,$){
            if(status){
                self.dom($);
            }
            setTimeout(function () {
                ++i;
                callback(null);
            }, parseInt(Math.random() * 2000));
        });
    },function(err,result){
        if(err){
            console.log('抓取错误：'+err);
        }
        console.log(result);
    });
    //async.eachSeries(urls,function(item,callback){
    //    self.request(item,function(status,$){
    //        //console.log(status);
    //        if(status){
    //            self.dom($);
    //        }
    //        //callback(null);
    //        setTimeout(function () {
    //            ++i;
    //            callback(null);
    //        }, parseInt(Math.random() * 2000));
    //    });
    //},function(){
    //    console.log('任务执行完成');
    //})
}

ImgDownLoad.prototype.mkdir = function(dir){
    mkdirp(this.saveDir + '/' + dir);
}

//处理dom，找到url后进入内页
ImgDownLoad.prototype.dom = function($){
    var $$ = $;
    var self = this;
    var listUrls = [];
    $$('.detail-list li').each(function(){
        var path = $$(this).find('a img').attr('alt');
        var url = urlUtil.resolve(self.url,$$(this).find('a').attr('href'));
        self.mkdir(path);
        listUrls.push(url);
        //(function(url){
        //    self.request(url,function(status,$){
        //        if(status) {
        //            self.detail(url,$);
        //            //self.innerPage($);
        //        }
        //    })
        //}(url))
    });
    $$('.n-list li').each(function(){
        var path = $$(this).find('a img').attr('alt');
        var url = urlUtil.resolve(self.url,$$(this).find('a').attr('href'));
        self.mkdir(path);
        listUrls.push(url);
        //(function(url){
        //    self.request(url,function(status,$){
        //        if(status) {
        //            self.detail(url,$);
        //            //self.innerPage($);
        //        }
        //    })
        //}(url))
    });
    self.detailPage(listUrls);
}

ImgDownLoad.prototype.detailPage = function(urls){
    var self = this;
    var imgListUrls = [];
    async.eachSeries(urls,function(item,callback){
        self.request(item,function(status,$){
            if(status) {
                var $$ = $;
                //var self = this;
                var from = $$('.page-show span').first().text();
                var j = from;
                var to = ($$('.page-show a.next').prev().text()).replace('..','');
                async.whilst(function(){
                    return j < to;
                },function(_callback){
                    if(j == 1){
                        imgListUrls.push(item);
                    }else{
                        imgListUrls.push((item.replace('.htm',j.toString())+ '.htm'));
                    }
                    setTimeout(function () {
                        ++j;
                        _callback(null);
                    }, parseInt(Math.random() * 2000));
                },function(){
                    console.log('共收集到:'+j+'个相册地址');
                    self.images(imgListUrls);
                });
            }
        });
        callback();
    },function(err){
        if(err){
            console.log('错误：:'+err);
        }
        console.log(imgListUrls.length)
        //self.images(imgListUrls);
    })
}

ImgDownLoad.prototype.detail = function(imgUrl,$){
    var $$ = $;
    var self = this;
    var from = $$('.page-show span').first().text();
    var j = from;
    var to = ($$('.page-show a.next').prev().text()).replace('..','');
    //console.log('----------------'+imgUrl);
    var imgListUrls = [];
    async.whilst(function(){
        return j < to;
    },function(callback){
        if(j == 1){
            imgListUrls.push(imgUrl);
        }else{
            imgListUrls.push((imgUrl.replace('.htm',j.toString())+ '.htm'));
        }
        setTimeout(function () {
            ++j;
            callback(null);
        }, parseInt(Math.random() * 2000));
    },function(){
        console.log('共收集到:'+j+'个相册地址');
        self.images(imgListUrls);
    });
}

//图片页
ImgDownLoad.prototype.images = function(urls){
    var self = this;
    var k = 1;
    async.eachSeries(urls,function(item,callback){
        self.request(item,function(status,$){
            if(status){
                self.innerPage($);
            }
        });
        setTimeout(function () {
            ++k;
            callback(null);
        }, parseInt(Math.random() * 2000));
    },function(err){
        if(err){
            console.log('链接错误，请检查');
        }
        console.log('共下载：'+k +'张图片');
    })
}

//内页
ImgDownLoad.prototype.innerPage = function($){
    var $$ = $;
    var self = this;
    $$('h1 span').empty();
    var title = $$('h1').text();
    console.log(title);
    var imgObj = [];
    $$('.pp img').each(function(){
        var src = $$(this).attr('src');
        var alt = $$(this).attr('alt');
        var name = Date.now();
        var obj = {
            src:src,
            alt:alt,
            title:title
        };
        imgObj.push(obj);
        //(function(src){
            //self.download(alt+'.jpg',src,title);
        //}(src))
    });
    self.download(imgObj);
}

//列表页
//http://www.henha.com/ji/rosi.html
//http://www.henha.com/ji/rosi.html




ImgDownLoad.prototype.urlList = function(){
    var self = this;
    var i = this.page.from;
    var to = this.page.to;
    for(;i<to;i++){
        if(i==0){
            this.urls.push(urlUtil.resolve(self.url,'ji/'+config+'.html'));
        }
        this.urls.push(urlUtil.resolve(self.url,'ji/'+config+i+'.html'));
    }
    //console.log(this.urls);
    return this.urls;
}


module.exports = ImgDownLoad;

var imgDown = new ImgDownLoad('http://www.henha.com/','D:/www/cjd-crawler/save');
imgDown.init();

