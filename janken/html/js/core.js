var jankengame = (function() {
	return {
		initialize : function() {
			jankengame.global.showDebugger();
			
			//横向きの場合のアラート表示処理
			
			var initialized = false;
			
			var showAlert = function() {
				$("div.cautionContainer").css("display", "block");
			};
			
			var hideAlert = function() {
				$("div.cautionContainer").css("display", "none");
			};
			
			//共通イベント
			$(window).on("orientationchange", function() {
				if (Math.abs( window.orientation) == 90) {
					showAlert();
				} else {
					hideAlert();
					
					if (!initialized) {
						if (jankengame.complete) {
							jankengame.complete();
							jankengame.complete = null;
							initialized = true;
						}
					}
				}
			});
			
			if (jankengame.complete) {
				if (Math.abs( window.orientation) == 90) {
					//横方向なのでアラート出す
					showAlert();
				} else {
					jankengame.complete();
					jankengame.complete = null;
					initialized = true;
				}
			}
			
		},
		
		global : {} 
	};
})();


//------------------------------------------------------------------------------------------
// jankengame.global

(function() {
	
	var scope = this;
	
	//デバッグモードフラグ
	var debugMode = true;
	
	//スタブモードフラグ
	var stubMode = true;
	
	//trace出力テキスト
	var traceText = "";
	
	//デバッガのインスタンス
	this.deb;
	
	this.stage = null;
	
	this.initDebugger = function() {
		if (debugMode) scope.deb = new jankengame.debug.Debugger();
	};
	
	this.showDebugger = function() {
		if (debugMode) {
			scope.deb.show();
		}
	};
	
	this.trace = function(value) {
		if (debugMode) {
			scope.deb.trace(value);
		}
	};
	
	this.clearTrace = function() {
		if (debugMode) {
			scope.deb.clear();
		}
	};
	
	this.isDebugger = function() {
		return debugMode;
	};
	
	this.isStub = function() {
		return stubMode;
	};
	
	var agent = navigator.userAgent;
	var appVersion = navigator.appVersion.toLowerCase();
	
	this.userAgent = {
		isFireFox : /FireFox/.test(agent),
		isChrome : /Chrome/.test(agent),
		isIPad : /iPad/.test(agent)
	};
	
	this.userAgent.isIOS = agent.indexOf('iPhone') > -1 || agent.indexOf('iPod')  > -1 || agent.indexOf('iPad')  > -1;
	this.userAgent.isAndroid = agent.indexOf('Android')  > -1;
	this.userAgent.isMobile = this.userAgent.isIOS || this.userAgent.isAndroid;
	
	//Android Tabletの判定追加
	if (this.userAgent.isAndroid) {
		this.userAgent.isAndroidTablet = agent.indexOf('Mobile')  < 0;
		this.userAgent.isAndroidMobile = !this.userAgent.isAndroidTablet;
	} else {
		this.userAgent.isAndroidTablet = false;
		this.userAgent.isAndroidMobile = false;
	}
	
	this.userAgent.isSmartPhone = false;
	
	if (this.userAgent.isMobile) {
		if ((agent.indexOf('iPhone') > -1) || (this.userAgent.isAndroid && !this.userAgent.isAndroidTablet)) {
			this.userAgent.isSmartPhone = true;
		}
	}
	
	this.userAgent.isSafari = /Safari/.test(agent) && !this.userAgent.isChrome;
	
	//requestAnimFrame使用フラグ
	this.useRequestAnimFrame = false;
	
	this.eventType = {};
	
	if (this.userAgent.isMobile || this.userAgent.isIPad) {
		this.eventType["down"] = "touchstart";
		this.eventType["move"] = "touchmove";
		this.eventType["up"] = "touchend";
	} else {
		this.eventType["down"] = "mousedown";
		this.eventType["move"] = "mousemove";
		this.eventType["up"] = "mouseup";
	}
	
	if (!window.addEventListener) {
		window.addEventListener = function(evt, func) {
			window.attachEvent("on" + evt, func);
		};
		
		window.removeEventListener = function(evt, func) {
			window.detachEvent("on" + evt, func);
		};
	}
	
	// setInterval高速化
	//////////////////////////////////////////////////////
	var si_CC = 0;
	var si_BD = 10;//(this.userAgent.isAndroid) ? 10 : 10;
	var si_FA = [];
	var si_DA = [];
	var si_IA = [];
	var gSetInterval = window.setInterval;
	var gClearInterval = window.clearInterval;
	
	gSetInterval(function() {
		si_CC++;
		for (var i = 0, l = si_IA.length; i < l; i++) {
			if (!((si_CC * si_BD) % si_DA[si_IA[i]]) && si_FA[si_IA[i]]) {
				si_FA[si_IA[i]]();
			}
		}
	}, si_BD);
	
	window.setInterval = function(func, delay) {
		if (delay < si_BD) delay = si_BD;
		var id = si_FA.length;
		var _fn = delay % si_BD;
		var _in = delay / si_BD >> 0;
		
		si_FA.push(func);
		si_DA.push((_in + Math.round(_fn/si_BD)) * si_BD);
		si_IA.push(id);
		
		return id;
	}
	
	window.clearInterval = function(id) {
		var tmp = si_IA.slice(0);
		
		si_IA = [];
		si_FA[id] = undefined;
		si_DA[id] = undefined;
		
		for (var i = 0, l = tmp.length; i < l; i++) if (tmp[i] != id) si_IA.push(tmp[i]);
	}
	
	this.gSetInterval = gSetInterval;
	this.gClearInterval = gClearInterval;
	
	//////////////////////////////////////////////////////
	
	
	window.requestAnimFrame = (function()
	{
		if (scope.userAgent.isSafari)
		{
			//SafariでwebkitRequestAnimationFrameがきかない為
			return function( callback ){
				window.setTimeout(callback, 1000 / 30);
			};
		}
		
		return  window.requestAnimationFrame       || 
						window.webkitRequestAnimationFrame || 
						window.mozRequestAnimationFrame    || 
						window.oRequestAnimationFrame      || 
						window.msRequestAnimationFrame     || 
						function( callback ){
							window.setTimeout(callback, 5);
						};
	})();
	
	
	this.debug = function(flag) {
		debugMode = flag;
	};
	
	this.stub = function(flag) {
		stubMode = flag;
	};
	
	this.addPackage = function(pkg) {
		if (!pkg) return;
		var pass = jankengame;
		var array = pkg.split(".");
		var n = 0;
		var ln = array.length;
		
		do {
			if (!pass[array[n]]) pass[array[n]] = {};
			pass = pass[array[n]];
		} while (++n < ln);
	};
	
	this.extend = function (subClass, superClass) {
		var Temp = new Function();
		Temp.prototype = superClass.prototype;
		subClass.prototype = new Temp;
		subClass.prototype.constructor = subClass;
		subClass.prototype.__super__ = function () {
			var originalSuper = this.__super__;
			this.__super__ = superClass.prototype.__super__ || null;
			
			superClass.apply(this, arguments);
			
			if (this.constructor == subClass) {
				delete this.__super__;
			} else {
				this.__super__ = originalSuper;
			}
		};
	};
	
}).apply(jankengame.global);

jankengame.global.addPackage("util");
jankengame.global.addPackage("base");
jankengame.global.addPackage("view");
jankengame.global.addPackage("debug");
jankengame.global.addPackage("geom");

//global function and property
var extend = jankengame.global.extend;
var trace = jankengame.global.trace;
var clearTrace = jankengame.global.clearTrace;
var userAgent = jankengame.global.userAgent;
var eventType = jankengame.global.eventType;



//------------------------------------------------------------------------------------------
// jankengame.base

(function() {
	
	/*******************************************
	 * EventDispatcherクラス
	 *******************************************/
	this.EventDispatcher = function() {
		
		this.listeners = [];
		this.enterFrameTimer;
		
		//デルタタイム使用する場合はtrue(コマ落ちしても速度落としたくない場合)
		this.useDeltaTime = false;
		//this.enterFrameFunc;
	};
		
	this.EventDispatcher.prototype.addEventListener = function(type, func) {
		if (!this.listeners) {
			this.listeners = [];
		}
		
		this.listeners.push({type:type, func:func});
	};

	this.EventDispatcher.prototype.removeEventListener = function(type, func) {
		var ls = this.listeners;
		var tmp = [];
		for (var i = 0, ln = ls.length; i < ln; i++) {
			var ob = ls[i];
			if (ob.type != type || ob.func != func) {
				tmp.push(ob);
			}
		}

		this.listeners = tmp;
	};

	this.EventDispatcher.prototype.dispatchEvent = function(evt) {
		var ls = this.listeners;
		if (!ls) return;
		for (var i = 0, ln = ls.length; i < ln; i++) {
			var ob = ls[i];
			if (ob.type == evt.type) {
				ob.func(evt.args);
			}
		}
	};
	
	
	if (jankengame.global.useRequestAnimFrame) {
		
		//requestAnimFrameを使ってenterFrame
		this.EventDispatcher.prototype.onEnterFrame = function(func) {
			
			if (this.enterFrameFunc) {
				this.deleteEnterFrame();
			}
			
			this.enterFrameFunc = func;
			var scope = this;
			
			if (this.useDeltaTime) {
				
				//デルタタイムあり
				var now = window.performance && (
					performance.now || 
					performance.mozNow || 
					performance.msNow || 
					performance.oNow || 
					performance.webkitNow );
				
				var getTime = function() {
					return ( now && now.call( performance ) ) || ( new Date().getTime() );
				};
				
				var tm = getTime();
				
				(function animloop() {
					if (!scope.enterFrameFunc) return;
					var tm2 = getTime();
					var deltaTime = tm2 - tm;
					if (deltaTime <= 0) {
						deltaTime = 1;
					}
					scope.enterFrameFunc(deltaTime);
					tm = tm2;
					requestAnimFrame(animloop);
				})();
				
			} else {
				
				//デルタタイムなし
				(function animloop() {
					if (!scope.enterFrameFunc) return;
					scope.enterFrameFunc(0);
					requestAnimFrame(animloop);
				})();
			}
		};
		
		this.EventDispatcher.prototype.deleteEnterFrame = function() {
			this.enterFrameFunc = null;
		};
	} else {
		
		//setTimeoutを使ってenterFrame
		this.EventDispatcher.prototype.onEnterFrame = function(func) {
			if (this.enterFrameTimer) {
				this.deleteEnterFrame();
			}
			
			if (this.useDeltaTime) {
				
				//デルタタイムあり
				var now = window.performance && (
					performance.now || 
					performance.mozNow || 
					performance.msNow || 
					performance.oNow || 
					performance.webkitNow );
				
				var getTime = function() {
					return ( now && now.call( performance ) ) || ( new Date().getTime() );
					//return ( new Date().getTime() );
				};
				
				var tm = getTime();
				
				this.enterFrameTimer = window.setInterval(function() {
					var tm2 = getTime();
					var deltaTime = tm2 - tm;
					if (deltaTime <= 0) {
						deltaTime = 1;
					}
					func(deltaTime);
					tm = tm2;
				}, 10);
			} else {
				
				//デルタタイムなし
				this.enterFrameTimer = window.setInterval(function() {
					func();
				}, 10);
			}
		};
		
		this.EventDispatcher.prototype.deleteEnterFrame = function() {
			window.clearInterval(this.enterFrameTimer);
			this.enterFrameTimer = null;
		};
	}
	
	this.EventDispatcher.prototype.onEnterFrame2 = function(func) {
		if (this.enterFrameTimer) {
			this.deleteEnterFrame2();
		}
		
		this.enterFrameTimer = window.setInterval(function() {
			func();
		}, 1000 / 60);
	};
	
	this.EventDispatcher.prototype.deleteEnterFrame2 = function() {
		window.clearInterval(this.enterFrameTimer);
		this.enterFrameTimer = null;
	};

	var EventDispatcher = jankengame.base.EventDispatcher;
	
	
	
	/*******************************************
	 * 複数画像ロードクラス
	 *******************************************/
	this.MultipleLoader = function() {
		this.percent = 0;
		this.loadIndex = 0;
		this.imageRequestNum = 0;
		this.imageRequests = {};
		this.imageRequestsArray = [];
	};
	
	extend(this.MultipleLoader, EventDispatcher);
	
	this.MultipleLoader.prototype.addImageRequest = function(url) {
		if (url != null && url != "") {
			this.imageRequests[url] = url;
			this.imageRequestsArray.push(url);
			this.imageRequestNum++;
		}
	};
	
	this.MultipleLoader.prototype.load = function() {
		if (this.imageRequestsArray.length > 0) {
			this.loadImage();
		}
	};
	
	this.MultipleLoader.prototype.loadImage = function() {
		var scope = this;
		var url = this.imageRequestsArray[this.loadIndex];
		var img = new Image();
		img.onload = function() {
			img.onload = null;
			scope.completeHandler(url, img);
		};
		img.src = url;// + "?" + (Math.random()*10000 >> 0);	//IE7,8でリロード後、正しくロードできないので乱数つける
	};
	
	this.MultipleLoader.prototype.completeHandler = function(url, obj) {
		this.imageRequests[url] = obj;
		
		++this.loadIndex;
		
		this.percent = this.loadIndex / this.imageRequestNum;
		
		if (this.loadIndex >= this.imageRequestNum) {
			this.dispatchEvent({type:"complete"});
		} else {
			this.loadImage();
		}
	};
	
}).apply(jankengame.base);

//------------------------------------------------------------------------------------------
// jankengame.util

(function() {
	
	/*
	 * URLパラメータを取得
	 */
	this.getRequest = function() {
		if(location.search.length > 1) {
			var get = new Object();
			var ret = location.search.substr(1).split("&");
			for (var i = 0; i < ret.length; i++) {
				var r = ret[i].split("=");
				get[r[0]] = r[1];
			}
			
			return get;
		} else {
			return false;
		}
	};
	
	
	/*
	 * 指定領域いっぱいに画像が配置されるよう計算する
	 */
	this.getFlexibleRect = function(stageWidth, stageHeight, imgWidth, imgHeight) {
		var per = stageWidth / stageHeight;
		var per_hd = imgWidth / imgHeight;
		var sc;
		var width;
		var height;
		var pos_x;
		var pos_y;
		
		if (!isNaN(per)) {
			if (stageWidth == imgWidth && stageHeight == imgHeight) {
				//trace("フルHDジャストフィット");
				width = stageWidth;
				height = stageHeight;
				pos_x = 0;
				pos_y = 0;
			} else if (per > per_hd) {
				sc = stageWidth / imgWidth;
				width = sc * imgWidth;
				height = sc * imgHeight;
				//trace("横に長い（上下がはみ出る）", videoWidth, videoHeight);
				pos_x = 0;
				pos_y = -(height - stageHeight) / 2;
			} else {
				sc = stageHeight / imgHeight;
				//trace("縦に長い（左右がはみ出る）");
				width = sc * imgWidth;
				height = sc * imgHeight;
				pos_x = -(width - stageWidth) / 2;
				pos_y = 0;
			}
		}
		
		return { x : pos_x, y : pos_y, width : width, height : height };
	};
	
	
	if (userAgent.isMobile || userAgent.isIPad) {
		this.getMousePosition = function(e) {
			var obj = {};
			var touch = e.originalEvent.touches[0];
			obj.x = touch.pageX;
			obj.y = touch.pageY;
			return obj;
		};
	} else {
		this.getMousePosition = function(e) {
			var obj = {};
			// trace(e);
			// trace(e.pageX);
			if	(e) {
				if (e.pageX) {
					obj.x = e.pageX;
					obj.y = e.pageY;
				} else {
					
				}
			} else {
				obj.x = document.body.scrollLeft + event.clientX;
				obj.y = document.body.scrollTop + event.clientY;
			}
			 
			return obj;
		};
	}
	
	this.distance = function(v1, v2) {
		var xx = v1.x - v2.x;
		var yy = v1.y - v2.y;
		return Math.sqrt(xx * xx + yy * yy);
	};

}).apply(jankengame.util);

	
//------------------------------------------------------------------------------------------
// jankengame.geom

(function() {

this.Matrix = function(_a, _b, _c, _d, _tx, _ty) {
		this.a = (_a) ? _a : 1;
		this.b = (_b) ? _b : 0;
		this.c = (_c) ? _c : 0;
		this.d = (_d) ? _d : 1;
		this.tx = (_tx) ? _tx : 0;
		this.ty = (_ty) ? _ty : 0;
	};
	
	this.Matrix.prototype.invert = function() {
		var _a = this.a;
		var _b = this.b;
		var _c = this.c;
		var _d = this.d;
		var _tx = this.tx;
		var _ty = this.ty;
		var _t = 1 / (_a * _d - _b * _c);
		
		this.a = _d * _t;
		this.b = -_b * _t;
		this.c = -_c * _t;
		this.d = _a * _t;
		this.tx = -(_tx * this.a + _ty * this.c);
		this.ty = -(_tx * this.b + _ty * this.d);
	};
	
	this.Matrix.prototype.concat = function(mtx) {
		var _a = this.a * mtx.a + this.b * mtx.c;
		var _b = this.a * mtx.b + this.b * mtx.d;
		var _c = this.c * mtx.a + this.d * mtx.c;
		var _d = this.c * mtx.b + this.d * mtx.d;
		var _tx = this.tx * mtx.a + this.ty * mtx.c + mtx.tx;
		var _ty = this.tx * mtx.b + this.ty * mtx.d + mtx.ty;
		
		this.a = _a;
		this.b = _b;
		this.c = _c;
		this.d = _d;
		this.tx = _tx;
		this.ty = _ty;
	};
	
	this.Matrix.prototype.toString = function() {
		return "a=" + this.a + ", b=" + this.b + ", c=" + this.c + ", d=" + this.d + ", tx=" + this.tx + ", ty=" + this.ty;
	};
	
	
	this.Matrix3D = function(args) {
		if (!args) {
			this.n11 = 1; this.n12 = 0; this.n13 = 0; this.n14 = 0;
			this.n21 = 0; this.n22 = 1; this.n23 = 0; this.n24 = 0;
			this.n31 = 0; this.n32 = 0; this.n33 = 1; this.n34 = 0;
		} else {
			this.n11 = args[0];  this.n12 = args[1];  this.n13 = args[2];  this.n14 = args[3];
			this.n21 = args[4];  this.n22 = args[5];  this.n23 = args[6];  this.n24 = args[7];
			this.n31 = args[8];  this.n32 = args[9];  this.n33 = args[10]; this.n34 = args[11];
		}
	};
	
	this.Matrix3D.prototype.reset = function() {
		this.n11 = 1; this.n12 = 0; this.n13 = 0; this.n14 = 0;
		this.n21 = 0; this.n22 = 1; this.n23 = 0; this.n24 = 0;
		this.n31 = 0; this.n32 = 0; this.n33 = 1; this.n34 = 0;
	};
	
	this.Matrix3D.prototype.multiply = function(m) {
		var d11 = this.n11, d12 = this.n12, d13 = this.n13, d14 = this.n14;
		var d21 = this.n21, d22 = this.n22, d23 = this.n23, d24 = this.n24;
		var d31 = this.n31, d32 = this.n32, d33 = this.n33, d34 = this.n34;
		
		this.n11 = d11 * m.n11 + d12 * m.n21 + d13 * m.n31;
		this.n12 = d11 * m.n12 + d12 * m.n22 + d13 * m.n32;
		this.n13 = d11 * m.n13 + d12 * m.n23 + d13 * m.n33;
		this.n14 = d11 * m.n14 + d12 * m.n24 + d13 * m.n34 + d14;
		
		this.n21 = d21 * m.n11 + d22 * m.n21 + d23 * m.n31;
		this.n22 = d21 * m.n12 + d22 * m.n22 + d23 * m.n32;
		this.n23 = d21 * m.n13 + d22 * m.n23 + d23 * m.n33;
		this.n24 = d21 * m.n14 + d22 * m.n24 + d23 * m.n34 + d24;
		
		this.n31 = d31 * m.n11 + d32 * m.n21 + d33 * m.n31;
		this.n32 = d31 * m.n12 + d32 * m.n22 + d33 * m.n32;
		this.n33 = d31 * m.n13 + d32 * m.n23 + d33 * m.n33;
		this.n34 = d31 * m.n14 + d32 * m.n24 + d33 * m.n34 + d34;
	};
	
	this.Matrix3D.prototype.multiplys = function(arr) {
		for (var i = 0, ln = arr.length; i < ln; i++) {
			var m = arr[i];
			var d11 = this.n11, d12 = this.n12, d13 = this.n13, d14 = this.n14;
			var d21 = this.n21, d22 = this.n22, d23 = this.n23, d24 = this.n24;
			var d31 = this.n31, d32 = this.n32, d33 = this.n33, d34 = this.n34;
			
			this.n11 = d11 * m.n11 + d12 * m.n21 + d13 * m.n31;
			this.n12 = d11 * m.n12 + d12 * m.n22 + d13 * m.n32;
			this.n13 = d11 * m.n13 + d12 * m.n23 + d13 * m.n33;
			this.n14 = d11 * m.n14 + d12 * m.n24 + d13 * m.n34 + d14;
			
			this.n21 = d21 * m.n11 + d22 * m.n21 + d23 * m.n31;
			this.n22 = d21 * m.n12 + d22 * m.n22 + d23 * m.n32;
			this.n23 = d21 * m.n13 + d22 * m.n23 + d23 * m.n33;
			this.n24 = d21 * m.n14 + d22 * m.n24 + d23 * m.n34 + d24;
			
			this.n31 = d31 * m.n11 + d32 * m.n21 + d33 * m.n31;
			this.n32 = d31 * m.n12 + d32 * m.n22 + d33 * m.n32;
			this.n33 = d31 * m.n13 + d32 * m.n23 + d33 * m.n33;
			this.n34 = d31 * m.n14 + d32 * m.n24 + d33 * m.n34 + d34;
		}
	};
	
	this.Matrix3D.prototype.multiplys2 = function(arr) {
		var m = arr[0];
		
		var n11 = this.n11, n12 = this.n12, n13 = this.n13, n14 = this.n14;
		var n21 = this.n21, n22 = this.n22, n23 = this.n23, n24 = this.n24;
		var n31 = this.n31, n32 = this.n32, n33 = this.n33, n34 = this.n34;
		
		var d11 = n11, d12 = n12, d13 = n13, d14 = n14;
		var d21 = n21, d22 = n22, d23 = n23, d24 = n24;
		var d31 = n31, d32 = n32, d33 = n33, d34 = n34;
		
		n12 = d12 * m.n22 + d13 * m.n32;
		n13 = d12 * m.n23 + d13 * m.n33;
		n22 = d22 * m.n22 + d23 * m.n32;
		n23 = d22 * m.n23 + d23 * m.n33;
		n32 = d32 * m.n22 + d33 * m.n32;
		n33 = d32 * m.n23 + d33 * m.n33;
		
		m = arr[1];
		
		d12 = n12;
		d13 = n13;
		d22 = n22;
		d23 = n23;
		d32 = n32;
		d33 = n33;
		
		n11 = d11 * m.n11 + d13 * m.n31;
		n13 = d11 * m.n13 + d13 * m.n33;
		n21 = d21 * m.n11 + d23 * m.n31;
		n23 = d21 * m.n13 + d23 * m.n33;
		n31 = d31 * m.n11 + d33 * m.n31;
		n33 = d31 * m.n13 + d33 * m.n33;
		
		m = arr[2];
		
		d11 = n11;
		d13 = n13;
		d21 = n21;
		d23 = n23;
		d31 = n31;
		d33 = n33;
		
		n14 = d11 * m.n14 + d12 * m.n24 + d13 * m.n34 + d14;
		n24 = d21 * m.n14 + d22 * m.n24 + d23 * m.n34 + d24;
		n34 = d31 * m.n14 + d32 * m.n24 + d33 * m.n34 + d34; 
		
		m = arr[3];
		
		d14 = n14;
		d24 = n24;
		d34 = n34;
		
		n11 = d11 * m.n11 + d12 * m.n21 + d13 * m.n31;
		n12 = d11 * m.n12 + d12 * m.n22 + d13 * m.n32;
		n13 = d11 * m.n13 + d12 * m.n23 + d13 * m.n33;
		n14 = d11 * m.n14 + d12 * m.n24 + d13 * m.n34 + d14;
		
		n21 = d21 * m.n11 + d22 * m.n21 + d23 * m.n31;
		n22 = d21 * m.n12 + d22 * m.n22 + d23 * m.n32;
		n23 = d21 * m.n13 + d22 * m.n23 + d23 * m.n33;
		n24 = d21 * m.n14 + d22 * m.n24 + d23 * m.n34 + d24;
		
		n31 = d31 * m.n11 + d32 * m.n21 + d33 * m.n31;
		n32 = d31 * m.n12 + d32 * m.n22 + d33 * m.n32;
		n33 = d31 * m.n13 + d32 * m.n23 + d33 * m.n33;
		n34 = d31 * m.n14 + d32 * m.n24 + d33 * m.n34 + d34; 
		
		this.n11 = n11;
		this.n12 = n12;
		this.n13 = n13;
		this.n14 = n14;
		this.n21 = n21;
		this.n22 = n22;
		this.n23 = n23;
		this.n24 = n24;
		this.n31 = n31;
		this.n32 = n32;
		this.n33 = n33;
		this.n34 = n34;
	};
	
	this.Matrix3D.prototype.copy = function() {
		return new this.Matrix3D([this.n11, this.n12, this.n13, this.n14, this.n21, this.n22, this.n23, this.n24, this.n31, this.n32, this.n33, this.n34]);
	};
	
	this.Matrix3D.prototype.toString = function() {
		return "n11=" + this.n11 + ", n12=" + this.n12 + ", n13=" + this.n13 + ", n14=" + this.n14 + ", n21=" + this.n21 + ", n22=" + this.n22 + ", n23=" + this.n23 + ", n24=" + this.n24 + ", n31=" + this.n31 + ", n32=" + this.n32 + ", n33=" + this.n33 + ", n34=" + this.n34;
	};
	
	this.Matrix3D.prototype.transform3d = function() {
		var enc = function(val) {
			return Math.round(val * 10000) / 10000;
		};
		var str = "matrix3d(";
		str += enc(this.n11) + ", " + enc(this.n12) + ", " + enc(this.n13) + ", 0, ";
		str += enc(this.n21) + ", " + enc(this.n22) + ", " + enc(this.n23) + ", 0, ";
		str += enc(this.n31) + ", " + enc(this.n32) + ", " + enc(this.n33) + ", 0, "; 
		str += enc(this.n14) + ", " + enc(this.n24) + ", " + enc(this.n34) + ", 1)"; 
		
		return str;
	};

}).apply(jankengame.geom);

	
//------------------------------------------------------------------------------------------
// jankengame.debug

(function() {
	
	var _global = jankengame.global;
	
	/*******************************************
	 * デバッガクラス
	 *******************************************/
	this.Debugger = function() {
		this.containerId = "jankengame_DEBUG_CONTAINER";
		this.innerId = "jankengame_DEBUG_INNER";
		this.clearBtnId = "jankengame_DEBUG_CLEARBUTTON";
		this.tags = jQuery('<div id="' + this.containerId + '" style="display:none;"><p id="' + this.innerId + '">traceエリア</p><input id="' + this.clearBtnId + '" type="button" value="クリア" /></div>');
		this.traceText = "clear<br>";
	};
	
	this.Debugger.prototype.clear = function() {
		this.traceText = "clear";
	};
	
	this.Debugger.prototype.trace = function(value) {
		if (typeof value == "object") {
			for (var i in value) {
				this.traceText += i + " = " + value[i] + "<br>";
			}
		} else {
			this.traceText += value + "<br>";
		}
		
		if (this.inner){
			this.inner.html(this.traceText);
		}
		
		console.log("------------------------------"+value);
	};
	
	this.Debugger.prototype.show = function() {
		jQuery("body").append(this.tags);
	
		var scope = this;
		var container = jQuery("#" + this.containerId);
		var clearBtn = jQuery("#" + this.clearBtnId);
		this.inner = jQuery("#" + this.innerId);
		
		container.css("position", "fixed");
		container.css("zIndex", "99999");
		container.css("right", 0);
		container.css("bottom", "0px");
		container.css("padding", "10px");
		container.css("background", "rgba(30, 30, 30, 0.75)");
		container.css("maxWidth", "500px");
		container.css("width", "150px");
		container.css("color", "rgb(255, 255, 255)");
		container.css("fontSize", "9px");
		container.css("display", "block");
		
		clearBtn.bind("click", function() {
			scope.traceText = "clear<br>";
			if (scope.inner) {
				scope.inner.html(scope.traceText);
			}
		});
	};
}).apply(jankengame.debug);


//ロード前の初期化
jankengame.global.debug(false);
jankengame.global.stub(false);
jankengame.global.initDebugger();

(function(func) {
	window.addEventListener("load", func, false);
})(function() {
	jankengame.initialize();
});

