(function() {
	
	var EventDispatcher = jankengame.base.EventDispatcher;
	var Matrix3D = jankengame.geom.Matrix3D;
	var MultipleLoader = jankengame.base.MultipleLoader;
	
	/*******************************************************************
	 * アニメ用Spriteクラス
	 * xy移動、scaleXY伸縮、アルファ制御
	 * スケーリング時のアンカー指定など(デフォルトは50% 50%)
	 ******************************************************************/
	this.Sprite = function(target, def_props) {
		
		var tg = $(target);
		
		//各種プロパティを動かす対象
		this.element = tg;
		
		this.useDigit = false;
		
		//モーションプロパティ
		this.x = 0;
		this.y = 0;
		this.alpha = 1;
		this.scale = 1;
		this.rotation = 0;
		
		if (def_props != null) {
			for (var prop in def_props) {
				this[prop] = def_props[prop];
			}
		}
		
		//スケール固定にするか
		this.fixedScaleX = false;
		this.fixedScaleY = false;
		this.currAlpha = null;
		
		//display表示時のプロパティ名
		this.displayName = "block";
		
		this.update();
	};
	
	extend(this.Sprite, EventDispatcher);
	
	/*
	 * スケール時のアンカー位置セット
	 */
	this.Sprite.prototype.setAnchor = function(x, y) {
		var sx = x + ((x != 0) ? "%" : "");
		var sy = y + ((y != 0) ? "%" : "");
		this.element.css("transformOrigin", sx + " " + sy);
	};
	
	/*
	 * 描画の更新
	 */
	this.Sprite.prototype.update = function(use_digit) {
		
		var sc_x = (this.fixedScaleX) ? 1 : this.scale;
		var sc_y = (this.fixedScaleY) ? 1 : this.scale;
		
		if (this.useDigit) {
			//var mtx = 'matrix(' + sc_x + ', 0, 0, ' + sc_y + ', ' + (this.x) + ', ' + (this.y) + ')';
			var mtx = 'matrix3d(' + sc_x + ', 0, 0, 0,   0, ' + sc_y + ', 0, 0,  0, 0, 1, 0,          ' + (this.x) + ', ' + (this.y) + ', 0, 1)';
		} else {
			//var mtx = 'matrix(' + sc_x + ', 0, 0, ' + sc_y + ', ' + (this.x >> 0) + ', ' + (this.y >> 0) + ')';
			var mtx = 'matrix3d(' + sc_x + ', 0, 0, 0,   0, ' + sc_y + ', 0, 0,  0, 0, 1, 0,          ' + (this.x >> 0) + ', ' + (this.y >> 0) + ', 0, 1)';
		}
		
		this.element.css("transform", mtx);
		
		if (this.alpha != this.currAlpha) {
			this.element.css("opacity", this.alpha);
			this.currAlpha = this.alpha;
		}
	};
	
	/*
	 * 表示の切替
	 */
	this.Sprite.prototype.visible = function(flag) {
		this.element.css("display", (flag) ? this.displayName : "none");
	};
	
	
	/*******************************************************************
	 * Sprite(回転あり）
	 ******************************************************************/
	this.SpriteRotation = function(target, def_props) {
		
		this.mtxRz = new Matrix3D();
		this.mtxSc = new Matrix3D();
		this.mtx = new Matrix3D();
		
		this.__super__(target, def_props);
	};
	
	extend(this.SpriteRotation, this.Sprite);
	
	this.SpriteRotation.prototype.update = function(use_digit) {
		
		var r = this.rotation;
		
		var mtxRz = this.mtxRz;
		var sin_rz = Math.sin(r);
		var cos_rz = Math.cos(r);
		
		mtxRz.n11 = cos_rz;
		mtxRz.n12 = sin_rz;
		mtxRz.n21 = -sin_rz;
		mtxRz.n22 = cos_rz;	
		
		var sc_x = (this.fixedScaleX) ? 1 : this.scale;
		var sc_y = (this.fixedScaleY) ? 1 : this.scale;
		
		var mtxSc = this.mtxSc;
		mtxSc.n11 = sc_x;
		mtxSc.n22 = sc_y;
		
		var mtx = this.mtx;
		mtx.multiplys([mtxSc, mtxRz]);
		mtx.n14 = this.x;
		mtx.n24 = this.y;
		
		this.element.css("transform", mtx.transform3d());
		
		if (this.alpha != this.currAlpha) {
			this.element.css("opacity", this.alpha);
			this.currAlpha = this.alpha;
		}
		
		mtx.reset();
	};
	

	/*******************************************************************
	 * Sprite用トゥイーンクラス
	 * (Singleton)
	 ******************************************************************/
	var Tween = function() {
		
	};
	
	/*
	 * フェードイン処理
	 */
	Tween.prototype.fadeIn = function(spt, sp, cb_func) {
		
		var sp = (sp != null) ? sp : 0.1;
		
		spt.onEnterFrame(function() {
			if ((spt.alpha += sp) >= 0.9) {
				spt.alpha = 1;
				spt.deleteEnterFrame();
				
				if (cb_func) {
					cb_func();
				}
			}
			
			spt.update();
		});
	};
	
	/*
	 * フェードアウト処理
	 */
	Tween.prototype.fadeOut = function(spt, sp, cb_func) {
		
		var sp = (sp != null) ? sp : 0.1;
		
		spt.onEnterFrame(function() {
			if ((spt.alpha -= sp) <= 0.1) {
				spt.alpha = 0;
				spt.deleteEnterFrame();
				
				if (cb_func) {
					cb_func();
				}
			}
			
			spt.update();
		});
	};
	
	/*
	 * モーション処理
	 */
	Tween.prototype.motion = function(spt, prop_array, end_array, sp, delay, threshold, cb_func) {
		var sa = 0;
		var curr = {};//spt[prop];
		var tmps = {};//spt[prop];
		var end = {};
		var ln = prop_array.length;
		
		var diff = (threshold) ? threshold : 0.002;
		
		for (var i = 0; i < ln; i++) {
			var prop = prop_array[i];
			curr[prop] = spt[prop];
			tmps[prop] = 0;
			end[prop] = end_array[i];
		}
		
		var flag = true;
		
		var cc = 0;
		
		if (delay != null) {
			cc = delay;
		}
		
		spt.onEnterFrame(function() {
			if (--cc <= 0) {
				spt.deleteEnterFrame();
				spt.onEnterFrame(function() {
					sa += sp;
					flag = true;
					for (var prop in curr) {
						curr[prop] += tmps[prop] = (end[prop] - curr[prop]) * sa;
						
						if (Math.abs(tmps[prop]) < diff) {
							curr[prop] = end[prop];
						}
						else {
							flag = false;
						}
						
						spt[prop] = curr[prop];
						spt.update();
					}
					
					if (flag) {
						spt.deleteEnterFrame();
						
						if (cb_func) {
							cb_func();
						}
					}
				});
			}
		});
	};
	
	/*
	 * モーション処理
	 */
	Tween.prototype.motionSpring = function(spt, prop_array, end_array, sp1, sp2, limit, cb_func) {
		
		var curr = {};//spt[prop];
		var tmps = {};//spt[prop];
		var end = {};
		var ln = prop_array.length;
		
		var lim = (limit) ? limit : 0.006;
		
		for (var i = 0; i < ln; i++) {
			var prop = prop_array[i];
			curr[prop] = spt[prop];
			tmps[prop] = 0;
			end[prop] = end_array[i];
		}
		
		var flag = true;
		
		spt.onEnterFrame(function() {
			flag = true;
			for (var prop in curr) {
				curr[prop] += tmps[prop] = (end[prop] - curr[prop]) / sp1 + tmps[prop] * sp2;
				
				if (Math.abs(tmps[prop]) < lim) {
					curr[prop] = end[prop];
				}
				else {
					flag = false;
				}
				
				spt[prop] = curr[prop];
				spt.update();
			}
			
			if (flag) {
				spt.deleteEnterFrame();
				
				if (cb_func) {
					cb_func();
				}
			}
		});
	};
	
	/*
	 * モーション処理
	 */
	Tween.prototype.delay = function(spt, time, cb_func) {
		
		spt.onEnterFrame(function() {
			if (--time <= 0) {
				spt.deleteEnterFrame();
				if (cb_func != null) {
					cb_func();
				}
			}
		});
	};
	
	this.Tween = new Tween();
	
	var Sprite = this.Sprite;
	var Tween = this.Tween;
	
	
	/*******************************************************************
	 * テキスト制御クラス
	 ******************************************************************/
	 
	this.TextEffect = function(baseScale) {
		
		this.baseScale = baseScale;
		this.elmName = "div.textContainer";
		
		this.textGameClear = new Sprite($(this.elmName + " p.textGameClear"), { alpha : 0 });
		this.textGameOver = new Sprite($(this.elmName + " p.textGameOver"), { alpha : 0 });
		this.badgeYoi.fixedScaleY = true;
		this.badgeStart.fixedScaleY = true;
		
		this.allText = [
			this.textGameClear,
			this.textGameOver,
		];
				
		this.reset();
	};
	
	extend(this.TextEffect, EventDispatcher);
	
	/*
	 * ゲームクリア時のエフェクト開始
	 */
	this.TextEffect.prototype.showGameClear = function(cb_func) {
		
		$(this.elmName).css("display", "block");
		
		var tg = this.textGameClear;
		
		tg.visible(true);
		tg.scale = 2;
		tg.update();
		
		Tween.motion(tg, [ "alpha", "scale" ], [ 1, 1 ], 0.012, 0, 0.002, function() {
			Tween.delay(tg, 10, function() {
				cb_func();
			});
		});
	};
	
	
	/*
	 * ゲームオーバー時のエフェクト開始
	 */
	this.TextEffect.prototype.showGameOver = function(cb_func) {	
		//$("div.footerContainer " + this.elmName).css("display", "block");
		
		$(this.elmName).css("padding-top", 192);
		var tg = this.textGameOver;
		
		tg.visible(true);
		tg.scale = 2 * this.baseScale;
		tg.update();
		
		Tween.motion(tg, [ "alpha", "scale" ], [ 1, this.baseScale ], 0.012, 0, 0.002, function() {
			Tween.delay(tg, 10, function() {
				cb_func();
			});
		});
	};
	
	/*
	 * 初期化
	 */
	this.TextEffect.prototype.reset = function() {
		trace("TextEffect reset");
		//$("div.footerContainer " + this.elmName).css("display", "none");
		$(this.elmName + " p").css("display", "none");
		
		for (var i = 0, ln = this.allText.length; i < ln; i++) {
			var text = this.allText[i];
			text.alpha = 0;
			text.x = 0;
			text.y = 0;
			text.scale = 1;
			text.update();
			text.visible(false);
			text.deleteEnterFrame();
		}
		
		$(this.elmName).css("padding-top", 192);
	};	
	
	
	/*******************************************************************
	 * ビューの親クラス
	 * (タイトル・ゲーム・結果それぞれの画面用)
	 ******************************************************************/
	this.ViewBase = function(baseScale) {
		this.container;
		
		//プリロードフラグ
		this.isLoaded = false;
		
		//ロードした画像
		this.loadImages = {};
	};
	
	extend(this.ViewBase, EventDispatcher);
	
	/*
	 * トランジション前の初期化
	 */
	this.ViewBase.prototype.reset = function() {
		$(this.container).css("display", "block");
	};
	
	/*
	 * トランジション時のローディング
	 * プリロード済なら何もしない
	 */
	this.ViewBase.prototype.loading = function(cb_func) {
		cb_func();
	};
	
	/*
	 * トランジション後の処理開始
	 */
	this.ViewBase.prototype.show = function() {
		
	};
	
	/*
	 * コンテンツ隠す(処理の停止)
	 */
	this.ViewBase.prototype.hide = function(cb_func) {
		$(this.container).css("display", "none");
		cb_func();
	};
	
	/*
	 * ゲームクリア画面の表示
	 */
	this.ViewBase.prototype.showClear = function() {
		$("div.gameClearContainer").css("display", "block");
	};
	
	/*
	 * ゲームクリア画面の非表示
	 */
	this.ViewBase.prototype.hideClear = function() {
		$("div.gameClearContainer").css("display", "none");
	};
	
	/*
	 * ゲームオーバー時の表示
	 */
	this.ViewBase.prototype.showGameOver = function() {
	
		//$("div.highLayerContainer").css("display", "block");
		$("div.gameOverContainer").css("display", "block");
		
	};
	
	/*
	 * ゲームオーバー時の非表示
	 */
	this.ViewBase.prototype.hideGameOver = function() {
		
		//$("div.highLayerContainer").css("display", "none");
		$("div.gameOverContainer").css("display", "none");
	};
	
	
	this.ViewBase.prototype.settingNormalButtonContainer = function(baseScale) {
		
		//最終画面のボタンコンテナの位置調整(下付け)
		var h = window.innerHeight;
		$("div.normalButtonContainer").css("top", h - (68 * baseScale));
		$("div.normalButtonContainer div.normalButtonContainerInner").css("width", 328 * baseScale);
		$("div.normalButtonContainer p.btnBackTop").css("width", 158 * baseScale);
		$("div.normalButtonContainer p.btnAgain").css("width", 158 * baseScale);
		
		var btn1 = new Sprite("div.normalButtonContainer p.btnRetry");
		btn1.setAnchor(50, 0);
		btn1.scale = baseScale;
		btn1.update();
		
		var scope = this;
		
		$("div.normalButtonContainer p.btnAgain a").bind("click", function() {
			scope.dispatchEvent({type:"backTop"});
		});
	};
	
	/*
	 * クリア時の1ボタンコンテナの初期化
	 * ResizeContainerに入ってないので、リサイズ・位置調整など
	 */
	this.ViewBase.prototype.normalButtonContainerVisible = function(flag) {
		$("div.normalButtonContainer").css("display", (flag) ? "block" : "none");
	};
	
	/*******************************************************************
	 * メインクラスの親クラス
	 * inner_h コンテンツのPNG上での縦領域に必要なサイズ
	 ******************************************************************/
	this.MainBase = function(inner_h) {
		
		this.__super__();
		
		$("div.loginCheckContainer").css("display", "none");
		
		//現在のビュー
		this.currentView = null;
		
		var win_w = window.innerWidth;
		var win_h = window.innerHeight;
		var per_w = win_w / 360;
		var per_h = win_h / inner_h;
		
		//横合わせフラグ
		this.fitWidth = false;
		this.baseScale = 1;
		
		if ((inner_h * per_w) <= win_h) {
			
			//trace("横幅あわせで拡大しても大丈夫");
			this.fitWidth = true;
			this.baseScale = per_w;
			
			$("div.resizeContainer").css("width", "360px");
			//$("div.highLayerResizeContainer").css("width", "360px");	
			
		} else {
			
			//trace("横幅あわせだと縦がはみ出る");
			this.fitWidth = false;
			this.baseScale = per_h;
			
			$("div.resizeContainer").css("width", win_w / per_h);
			//$("div.highLayerResizeContainer").css("width", win_w / per_h);
		}
		
		//マイページ・スタンプのページなど
		if (inner_h == 0) {
			if (per_w < 1) {
				var ttl = new Sprite("h1");
				ttl.y = 3;
				ttl.scale = per_w * 0.9;
				ttl.setAnchor(0, 0);
				ttl.update();
			}
			return;
		}
		
		var loader = new MultipleLoader();
		loader.addEventListener("complete", function(args) {
			
		});
		loader.load();
		
		$("div.resizeContainer").css("transform", "scale(" + this.baseScale + ", " + this.baseScale + ")");
		//$("div.highLayerResizeContainer").css("transform", "scale(" + this.baseScale + ", " + this.baseScale + ")");
		trace("SCALE" + this.baseScale);
		
		//光の背景リサイズ
		var per = window.innerWidth / 360;
		$("div.winContainer div").css("background-size", (360 * per) + "px " + (225 * per) + "px");
	};
	
	extend(this.MainBase, EventDispatcher);
	
	/*
	 * ビューの切替
	 */
	this.MainBase.prototype.changeView = function(next_view) {
		
		this.showLoading();
		
		var scope = this;
		
		if (this.currentView) {
			
			//現在のビュー非表示
			this.currentView.hide(function() {
				
				//次のビュー初期化
				next_view.reset();
				next_view.loading(function() {
					//ローディング隠す
					scope.hideLoading(function() {
						
						//次のビュー開始
						next_view.show();
						scope.currentView = next_view;
					});
				});
			});
		}
	};

	/*
	 * ローディングをフェードイン
	 */
	this.MainBase.prototype.showLoading = function() {
		$("div.loadingContainer").css("display", "block");
	};
	
	/*
	 * ローディングをフェードアウト
	 */
	this.MainBase.prototype.hideLoading = function(cb_func) {
		$("div.loadingContainer").css("display", "none");
		
		if (cb_func != null) {
			cb_func();
		}
	};
	
	/*
	 * 背景画像を画面にフィットさせる
	 */
	this.MainBase.prototype.fitScreenImage = function(tg, img_w, img_h) {
		var win_w = window.innerWidth;
		var win_h = window.innerHeight;
		
		var per = win_w / win_h;
		var per_img = img_w / img_h;
		var sc = 1;
		
		if (!isNaN(per))
		{
			if (win_w == img_w && win_h == img_h)
			{
				//trace("fit() ジャスト");
			}
			else if (per > per_img)
			{
				//trace("fit() 横にフィット");
				sc = win_w / img_w;
			}
			else
			{
				//trace("fit() 縦にフィット");
				sc = win_h / img_h;
			}
			
			tg.css("background-size", (img_w * sc) + "px " + (img_h * sc) + "px");
		}
		
		return { x : img_w * sc, y : img_h * sc };
	};
	
}).apply(jankengame.base);

