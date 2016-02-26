var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');
var http = require('http');


//config
var config = {
	baseUrl : 'http://baidu.com',
	page:'page/%d',
	from:11,
	to:20,
	saveDir:'D:/www/cjd-crawler/save'
}
var selector = [
	{ $: '$("#primary-content .post-content p").find("a")', attr: 'href' },
	{ $: '$("#primary-content .post-content p").first().find("img")', attr: 'src' }
];

var spider = function(){
	this.urls = [];
}

spider.prototype = {
	//程序入口
	crawler: function(){
		//this.listUrl();
		//console.log(this.urls);
		var self = this;
		this.listUrl(function(urls){
			self.getList(urls);
		});
		
	},
	//获取列表的数据
	getList :function(urls){
		var self = this;
		var i = config.from;
		async.eachSeries(urls,function(item,callback){ //第一步获取所有的page的分页
			var parseUrl = url.resolve(config.baseUrl,item);
			//console.log(parseUrl);
			self.request(parseUrl,function(status,$){
				var $$ = eval($);
				var dlObj = [];
				var img = [];
				var alt = [];
				if(status) {
					$$('#primary-content .post-content').each(function () {
						dlObj.push({
							title: $$(this).find('p').first().text(),
							link: $$(this).find('a.more-link').attr('href'),
							thumbUrl: $$(this).find('p img').first().attr('src'),
							thumbName:$$(this).find('p img').first().attr('alt'),
						});
					})
					async.waterfall([function(_callback){
						self.saveImage(dlObj);
						//setTimeout(function(){
						_callback(null);
						//}, 2000);
					},function(cb){
						self.detail(dlObj);
						setTimeout(function(){
							cb(null);
						}, 2000);
					}],function(err){
						if(err){
							console.log('error:'+err);
						}
					})
					//console.log(dlObj);
					++i;
					callback();
				}
			});
			//执行完后调用下一页

		})
	},
	//存储列表图片
	dlImage : function(obj){
		var self = this;
		var len = obj.length;
		var i = 0;
		async.eachSeries(obj,function(item,callback){
			var filename = obj[i].filename;
			var filepath = path.join(config.saveDir,filename);
			self.saveImage(filepath,obj[i].thumbName,obj[i].thumbUrl);
			//self.detail(obj[i].link);
			++i;
			callback();
		},function(){

		})
	},
	detail: function(urls){
		var self = this;
		//self.saveImage(filepath,obj[i].thumbName,obj[i].thumbUrl);
		async.eachSeries(urls,function(item,callback){
			self.request(item.link,function(status,$){
				var $$ = eval($);
				var dlObj = [];
				var img = [];
				var alt = [];
				if(status) {
					$$('#primary-content .post-content').each(function () {
						$$(this).find('p img').each(function () {
							img.push($$(this).attr('src'));
							alt.push($$(this).attr('alt'));
						});
						dlObj.push({
							title: $$(this).find('p').first().text(),
							link: $$(this).find('a.more-link').attr('href'),
							thumbUrl: img,
							thumbName: alt
						})
						self.saveImage(dlObj);
						//console.log(dlObj);
					})
					callback();
				}else{
					callback();
				}
			});
		},function(err){
			if(err){
				console.log('error'+err);
			}
		})

	},
	saveImage: function(urls){
		//var dlUrl = typeof url == 'object' ? url
		var self = this;
		var count = urls.length;
		console.log('准备下载到本地中。。。');
		if (count < 1) {
			callback();
			return;
		}
		async.eachSeries(urls,function(item,callback){
			//console.log(item);
			var filepath = path.join(config.saveDir, item.title);
			//return;
			mkdirp(filepath,function(error) {
				if (error) {
					console.log('error:' + error)
					callback();
				} else {
					if(typeof item.thumbUrl === 'object') {
						var obj = item.thumbUrl;
						var len = item.thumbUrl.length;
						var kk = 0;
						console.log('内页图片准备下载到本地中。。。');
						if (len < 1) {
							callback();
							return;
						}
						async.eachSeries(item.thumbUrl,function(_item,_callback){
							//var myPath = path.join(filepath, item.thumbName[kk]);
							//console.log(item.title);
							//var _item = item.thumbUrl[kk];
							var myName = item.thumbName[kk];
							request.head(_item, function (err, res, body) {
								var myPath = path.join(filepath,myName);
								//console.log('content-type:', res.headers['content-type']);
								//console.log('content-length:', res.headers['content-length']);
								if (err) {
									console.log('error:' + err);
									_callback();
								}else{
									fs.exists(filepath, function (exists) {
										if (exists) {
											console.log('内页已经存在');
											console.log('--------------------------------------------');
											request(_item).pipe(fs.createWriteStream(myPath));
											console.log((obj.indexOf(_item) + 1) + '/' + len + '  ：' + path.join(filepath, myName) + '保存成功');
											++kk;
											//_callback();
											setTimeout(_callback, parseInt(Math.random() * 2000));
											console.log('--------------------------------------------');
										}
									});
								}
							});
						},function(err){
							if(err){
								console.log('error'+err);
							}else{
								console.log( '下载完毕~');
							}
						});
					}else if(typeof item.thumbUrl === 'string'){
						var filename = item.thumbName;
						var savePath = path.join(filepath, filename);
						request.head(item.thumbUrl, function (err, res, body) {
							//var savePath = path.join(filepath, filename);
							fs.exists(savePath, function (exists) {
								if (exists) {
									console.log('目录已存在');
									callback();
								} else {
									request(item.thumbUrl).pipe(fs.createWriteStream(savePath));
									console.log((urls.indexOf(item) + 1) + '/' + count + '  ：' + path.join(filepath, filename) + '保存成功');
									setTimeout(callback, parseInt(Math.random() * 2500));
								}
							});
						});
					}
				}
			});
		}, function (err) {
			if (err) {
				console.log(err, "red");
			} else {
				console.log( '下载完毕~');
			}
		})
	},
	//列表页
	listUrl: function(callback){
		var from = config.from || 1;
		var to = config.to || 10;
		var i = from;
		while(i < to){
			i++;
			var page = config.page.replace('%d',i);
			this.urls.push(page);
		}
		callback(this.urls);
	},
	//爬取的url
	request:function(url,callback){
		request(url,function(error,res,body){
			if(!error && res.statusCode === 200){
				var $ = cheerio.load(body);
				callback.call(this,!!$,$);
			}
		})
	}
}

var cjd = new spider();
cjd.crawler();
