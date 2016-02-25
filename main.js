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
	from:1,
	to:15,
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
						$$(this).find('p img').each(function(){
							img.push($$(this).attr('src'));
							alt.push($$(this).attr('alt'));
						});
						dlObj.push({
							filename: $$(this).find('p').first().text(),
							link: $$(this).find('a.more-link').attr('href'),
							thumbUrl: img,
							thumbName:alt,
						});
					})
					self.dlImage(dlObj);
					//console.log(dlObj);
				}
			});
			//执行完后调用下一页
			++i;
			callback();
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
			self.detail(obj[i].link);
			++i;
			callback();
		},function(){

		})
	},
	detail: function(url){
		var self = this;
		//self.saveImage(filepath,obj[i].thumbName,obj[i].thumbUrl);
		self.request(url,function(status,$){
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
						filename: $$(this).find('p').first().text(),
						link: $$(this).find('a.more-link').attr('href'),
						thumbUrl: img,
						thumbName: alt
					})
					self.dlImage(dlObj);
					console.log(dlObj);
				})
			}
		});
	},
	saveImage: function(filepath,filename,url){
		//var dlUrl = typeof url == 'object' ? url
		async.eachSeries(url,function(item,callback){
			console.log(item);
		})

		//mkdirp(filepath,function(error) {
		//	if (error) {
		//		console.log('error:' + error)
		//	} else {
		//		var savePath = path.join(filepath, filename);
		//		request.head(url, function (err, res, body) {
		//			//var savePath = path.join(filepath, filename);
		//			fs.exists(savePath, function (exists) {
		//				if (exists) {
		//					console.log('目录已存在');
		//				} else {
		//					request(url).pipe(fs.createWriteStream(savePath));
		//					//console.log((list.indexOf(item) + 1) + '/' + count + '  ：' + path.join(filepath, filename) + '保存成功', 'green');
		//					//setTimeout(callback, parseInt(Math.random() * 2000));
		//				}
		//			});
		//		});
		//	}
		//});
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
