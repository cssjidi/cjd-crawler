var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');
var http = require('http');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'meinv'
});


//config
var config = {
	baseUrl : 'http://test.info',
	page:'page/%d',
	from:11,
	to:20,
	saveDir:'D:/www/spider/save'
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
						var id = $$(this).find('a.more-link').attr('href').split('#')[1].split('-')[1];
						var link = $$(this).find('a.more-link').attr('href');
						var title = $$(this).find('p').first().text();
						var thumbUrl = $$(this).find('p img').first().attr('src');
						var thumbName = $$(this).find('p img').first().attr('alt');
						dlObj.push({
							title: title,
							link:link,
							thumbUrl: thumbUrl,
							thumbName:thumbName,
							id:id
						});
						console.log(dlObj);
						connection.query('SELECT count(*) as count from `meinv`.`wp_posts` where id='+id,function(err,rows,fields){
							//console.log(rows[0]['count']);
							if(rows.count >= 1){
								console.log(1111111);
								connection.query("update `meinv`.`wp_posts` set `post_title`='"+title+"' where id="+id,function(err,rows,fields){
									if (err) throw err;
		  							console.log('The solution is: ', rows);
								})
							}else{
								console.log(2222222);
								connection.query("INSERT INTO `meinv`.`wp_posts` (`ID`, `post_author`, `post_date`, `post_date_gmt`, `post_content`, `post_title`, `post_excerpt`, `post_status`, `comment_status`, `ping_status`, `post_password`, `post_name`, `to_ping`, `pinged`, `post_modified`, `post_modified_gmt`, `post_content_filtered`, `post_parent`, `guid`, `menu_order`, `post_type`, `post_mime_type`, `comment_count`) VALUES ('"+id+"', '1', '2015-12-03 10:55:09', '2015-12-03 02:55:09', '', '"+title+"', '', 'inherit', 'open', 'open', '', '"+title+"', '', '', '2015-12-03 10:55:09', '2015-12-03 02:55:09', '', '0', 'http://5imeinv.com/?p"+id+"', '0', 'post', '', '0')",function(err,rows, fields){
									if (err) throw err;
	  								console.log('The solution is: ', rows);
								});
							}
						});
						//connection.query("INSERT INTO `meinv`.`wp_posts` (`ID`, `post_author`, `post_date`, `post_date_gmt`, `post_content`, `post_title`, `post_excerpt`, `post_status`, `comment_status`, `ping_status`, `post_password`, `post_name`, `to_ping`, `pinged`, `post_modified`, `post_modified_gmt`, `post_content_filtered`, `post_parent`, `guid`, `menu_order`, `post_type`, `post_mime_type`, `comment_count`) VALUES ('"+id+"', '1', '2015-12-03 10:55:09', '2015-12-03 02:55:09', '', '"+title+"', '', 'inherit', 'open', 'open', '', '"+title+"', '', '', '2015-12-03 10:55:09', '2015-12-03 02:55:09', '', '0', 'http://5imeinv.com/?p"+id+"', '0', 'post', '', '0')",function(err,rows, fields){
							//if (err) throw err;
  								//console.log('The solution is: ', rows[0].solution);
						//});

						//INSERT INTO `meinv`.`wp_posts` (`ID`, `post_author`, `post_date`, `post_date_gmt`, `post_content`, `post_title`, `post_excerpt`, `post_status`, `comment_status`, `ping_status`, `post_password`, `post_name`, `to_ping`, `pinged`, `post_modified`, `post_modified_gmt`, `post_content_filtered`, `post_parent`, `guid`, `menu_order`, `post_type`, `post_mime_type`, `comment_count`) VALUES ('1038', '1', '2015-12-03 10:52:24', '2015-12-03 02:52:24', '<a href=\"http://imgbar.net/img-489324.html\" target=\"_blank\"><img src=\"http://t1.imgbar.net/a9c58e014a/5d3464eb0a.jpg\" alt=\"\" border=\"0\" /></a>\r\n\r\n下载地址：\r\n\r\n<a href=\"http://5xpan.com/fs/ere1nt6ij3id7i9c07/\" target=\"_blank\">http://5xpan.com/fs/ere1nt6ij3id7i9c07/</a>\r\n\r\n<a href=\"http://qiannao.com/file/5imeinv/5508b7a3/\" target=\"_blank\">http://qiannao.com/file/5imeinv/5508b7a3/</a>', 'LCDV-20075 Manami Fuku 福愛美 SUGAR', '', 'publish', 'open', 'open', '', 'lcdv-20075-manami-fuku-fu-love-beautiful-sugar', '', '', '2015-12-03 10:55:09', '2015-12-03 02:55:09', '', '0', 'http://5imeinv.com/?p=1038', '0', 'post', '', '0');

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
			},function(){
				connection.end();
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
