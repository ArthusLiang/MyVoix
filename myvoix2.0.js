/*
@author: yulianghuang
*/
(function(window){
	var SoundWave=function(opt){
		this.opt = opt || {};      		
		this.K = 2;
		this.phase = 0;
		this.color = this.hex2rgb(opt.color || '#fff')|| '255,255,255';              
		this.speed = opt.speed || 0.1;
		this.noise = opt.noise || 1;
		this.alpha = opt.alpha || 0.8;
		this.F = opt.F || 2;

		var ratio = opt.ratio ? opt.ratio : ( window.devicePixelRatio ? window.devicePixelRatio : 1 );
		this.width = ratio * (this.opt.width || 320);
		this.height = ratio * (this.opt.height || 100);
		this.MAX = (this.height/2)-4;

		if(opt.canvas){
	     		this.canvas = opt.canvas;
		}else{
	     		this.canvas = document.createElement('canvas');
	     		(this.opt.container || document.body).appendChild(this.canvas);
		}
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.canvas.style.width = (this.width/ratio)+'px';
		this.canvas.style.height = (this.height/ratio)+'px';
		this.ctx = this.canvas.getContext('2d');
		this.run = false;
	};
	SoundWave.prototype={
		hex2rgb:function(hex){
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		    	hex = hex.replace(shorthandRegex, function(m,r,g,b) { return r + r + g + g + b + b; });
		        	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		    	return result ? parseInt(result[1],16).toString()+','+parseInt(result[2], 16).toString()+','+parseInt(result[3], 16).toString(): null;
		},
		_globalAttenuationFn: function(x){
                		return Math.pow(this.K*4/(this.K*4+Math.pow(x,4)),this.K*2);
            	},
            	_drawLine: function(attenuation, color, width){
	                	this.ctx.moveTo(0,0);
	                	this.ctx.beginPath();
	                	this.ctx.strokeStyle = color;
	                	this.ctx.lineWidth = width || 1;
	                	var x, y;
	                	for (var i=-this.K; i<=this.K; i+=0.01) {
	                    		x = this.width*((i+this.K)/(this.K*2));
	                    		y = this.height/2 + this.noise * (1/attenuation)*((this.height/2) * (Math.sin(this.F*i-this.phase)))* this._globalAttenuationFn(i);
	                    		this.ctx.lineTo(x, y);
	                	}
	                	this.ctx.stroke();
	           },
	           _clear: function(){
	                	this.ctx.globalCompositeOperation = 'destination-out';
	                	this.ctx.fillRect(0, 0, this.width, this.height);
	                	this.ctx.globalCompositeOperation = 'source-over';
	           },
	           _draw: function(){
	                	if (!this.run) return;
	                		this.phase = (this.phase+this.speed)%(Math.PI*64);
	                		this._clear();
	                		this._drawLine(-2, 'rgba('+this.color+',0.1)');
	                		this._drawLine(-6, 'rgba('+this.color+',0.2)');
	                		this._drawLine(4, 'rgba('+this.color+',0.4)');
	                		this._drawLine(2, 'rgba('+this.color+',0.6)');
	                		this._drawLine(1, 'rgba('+this.color+',1)', 1.5);
	                	window.requestAnimationFrame(this._draw.bind(this), 1000);
	           },
	           start: function(){
	                	this.phase = 0;
	                	this.run = true;
	                	this._draw();
	           },
	           stop: function(){
	                	this.speed = 0;
	                	this.phase = 0;
	                	this.noise = 0;
	                	this.run = false;
	           },
	           setNoise: function(v){
	                	this.noise = Math.min(v, 1);
	           },
	           setSpeed: function(v){
	                	this.speed = v;
	           },
	           setF:function(v){
	                	this.F=v;
	           },
	           set: function(noise, speed) {
	                	this.setNoise(noise);
	                	this.setSpeed(speed);
	           },
	           changeNoise:function(value){
	                     var now =   this.noise;
	                     this.setNoise(this.alpha * now + (1 - this.alpha) * (value * 10));
	           },
	           changeFrequence:function(value){
	                     	this.F = 2 + (value/100) *3;
	           },
	           getAverageVolume:function(array){
	                     	var values = 0,
	                     		average,
	                     		length = array.length;
	                     // get all the frequency amplitudes
	                     for (var i = 0; i < length; i++) {
	                      	values += array[i];
	                     }
	                     average = values / length;
	                     return average;
	           },
	           attachMicrophone:function(){
	                    	var me= this;
	                    	navigator.webkitGetUserMedia({audio:true},function(e){
	                      	var context = new webkitAudioContext(),
	                      	javascriptNode = context.createScriptProcessor(2048, 1, 1),
	                            	//volume = context.createGain(),
	                            	audioInput = context.createMediaStreamSource(e),
	                            	analyser = context.createAnalyser(),
	                            	splitter = context.createChannelSplitter();

	                        	analyser.smoothingTimeConstant = 0.3;
	                        	analyser.fftSize = 1024;
	                         
	                        	audioInput.connect(splitter);
	                        	splitter.connect(analyser,0,0);
	                        	analyser.connect(javascriptNode);
	                        	javascriptNode.connect (context.destination); 
	                        
	                      	javascriptNode.onaudioprocess = function(e) {
	                          		// get the average for the first channel
	                          		var array =  new Uint8Array(analyser.frequencyBinCount);
	                          		analyser.getByteFrequencyData(array);
	                          		//There are 2 channels.
	                          		var average = me.getAverageVolume(e.inputBuffer.getChannelData (0));
			                     if (average > 0) {
			                     		me.changeNoise(average);
			                      	me.changeFrequence(average);
			                     }
	                        	}
	                    	},function(){});
	           }
	};

	window.SoundWave =SoundWave;

	//'use strict';
	var SESSIONKEY='myVoixData',
        		_voiceRecognition = window.webkitSpeechRecognition,// to realize other browser if possible
	/*
	* common function
	*/
        	_pkid=1,
        	getPkid=function(){
           	return _pkid++;
           },
           /*
           * to set the object
           */
           easyEntend=function(pOrigin,pDefault,pConfig){
           	//setDefault
           	for(var name in pDefault){
                     	pOrigin[name] = pDefault[name];
                	}
                	//setConfig
                	for(var _name in  pConfig){
                       	pOrigin[_name] =  pConfig[_name];
                	}
        	},
        	isArray=function (pObj) {
           	return Object.prototype.toString.call(pObj) === '[object Array]';
        	},
	isEmptyObject=function(pObj){
           	for(var name in pObj){
           		return false;
           	}
            	return true;
        	},
        	_smartDic=function(){
           	var _dic = {};
           	this.init=function(pData,pRange){
	           	//load range or none
	           	if(isArray(pRange)){
	                     		for(var i=0,l=pRange.length;i<l;i++){
	                        		var _cmd = pData[pRange[i]];
	                        		if(_cmd !=null){
	                            			for(var name in _cmd){
	                                			_dic[name] = pRange[i];
	                            			}
	                        		}
	                    		}
	                     //load all
	                	}else{
	                    		for(var _i in pData){
	                        		var _cmd = pData[_i];
	                        		for(var name in _cmd){
	                            			_dic[name] = _i;
	                        		}
	                    		}
	                	}
	           };
	           this.add=function(pKey,pValue){
	           	_dic[pKey] = pValue;
	           };
	           this.remove=function(pKey,pValue){
	           	if(pValue==null  || _dic[pKey] === pValue){
	           		delete _dic[pKey];
	           	}                
	           };
	           this.get=function(pKey){
	           	return _dic[pKey];
	           };
        	},
        	_smartLearning=new function(){
           	var _database,
                	save=function(){
                    		localStorage.setItem(SESSIONKEY,_database);
                	},
               	load=function(){
                    		_database = {} || localStorage.getItem(SESSIONKEY);
                	},
                	init=function(){
                    		load();
                	};
            	init();

	           this.learn=function(pCommand,pResult,pDic){
	               	if(_database[pCommand] === undefined){
	                    		_database[pCommand] = {};
	                	}
	                	if(_database[pCommand][pResult] === undefined){
	                    		_database[pCommand][pResult] = 0;
	                	}else{
	                    		_database[pCommand][pResult] ++;
	                	}
	               	pDic.add(pResult,pCommand);
	                	save();
	           };

            	this.forget=function(pCommand,pResult,pDic){
                		if(_database[pCommand] === undefined){
                    			delete _database[pCommand][pResult];
                    			if(isEmptyObject(_database[pCommand])){
                        			delete _database[pCommand];
                    			};
                    			pDic.remove(pResult,pCommand);
                		}
           	};

           	this.Data = _database;
	},
    	/*
        	* create speech recognition
        	*/
        	createRecognition=function(pConfig){
                      var _rec = new _voiceRecognition();
                           //set config
                      easyEntend(_rec,{
                            continuous:true,
                            interimResults:false,
                            lang:'en-US',
                            maxAlternatives:1
                      },pConfig);
                      /*
                      _rec.onstart=function(){};
                      _rec.onresult = undefined;
                      _rec.onerror=function(){};
                      _rec.onend=function(){};
                      */
                     return _rec;
        	},
        	MyVoix=function(pConfig,pCommands,pIsLoop){
           	this.Dic = new _smartDic();
           	//care for Commands,  if you set this prototpye, then myvoix will load date from storage
           	this.Dic.init(_smartLearning,pCommands);
           	this.IsLoop = pIsLoop;
           	this.Recognition = createRecognition(pConfig);
           	this.CommandsLib={};
           	this.CurrentLearning= undefined;
           	this.Recognition.start();
	           this.onLearning=function(pCommand){};
	           this.onLog=function(pMessage){};
        	};

    	MyVoix.prototype={
        		bind:function(pCommand,pListener){
		        	if(!pListener.$$pkid) {
		           	pListener.$$pkid = getPkid();
		        	}
            		var _commandsLib = this.CommandsLib,
                			_commands = isArray(pCommand) ? pCommand :[pCommand];
           		for(var i=0,l=_commands.length;i<l;i++){
                			var _cmd =_commands[i];
                			if(_commandsLib[_cmd]===undefined){
                    				_commandsLib[_cmd]={
                        			listeners:{}
                    				};
                			}
               			_commandsLib[_cmd].listeners[pListener.$$pkid] = pListener;
           		}
        		},
	        	unbind:function(pCommand,pListener){
	          		var _cmdEvent = this.CommandsLib[pCommand];
	            	if(_cmdEvent!=undefined && pListener.$$pkid !=null){
	                		delete _cmdEvent.listeners[pListener.$$pkid];
	            	}
	        	},
	        	_result:function(eve){
	           	var me =this,
	            	len = eve.results.length,
	            	i = eve.resultIndex,
	            	j = 0,
	            	listeners,
	            	command;
	            	me.stop();
	            	for (i; i < len; i += 1) {
	                		if (eve.results[i].isFinal) {
	                    			// get words
	                    			command = eve.results[i][0].transcript.replace(/^\s+|\s+$/g, '').toLowerCase();
			                     if(console.log){
			                        console.log(eve.results[i][0].transcript);   
			                        me.onLog(eve.results[i][0].transcript); 
			           	}                
			                    	if(me.CurrentLearning){
			                        	_smartLearning.learn(me.CurrentLearning,command,me.Dic);
			                        	me.onLearning(command);
			                    	}else{
			                       	if(me.CommandsLib[command] ===undefined){
			                            		command = me.Dic.get(command);
			                        	}	
			                     		if(command && me.CommandsLib[command]){
			                            		listeners = me.CommandsLib[command].listeners;
			                            		for(var name in listeners){
			                                		listeners[name].call();
			                            		}
			                        	}
			                    	}
	                		}
	           	}
	            	me.IsLoop && me.start();
	        	},
	        	start:function(){
	           	var me = this;
	           	me.Recognition.onresult = function (eve) {
	           		me._result.call(me, eve);
	           	};
	           	return this;
	        	},
	        	stop:function(){
	           	this.Recognition.onresult = undefined;
	           	return this;
	        	},
	        	createSoundWave:function(opt){
	        		if(this._SoundWave===undefined){
	        			this._SoundWave = new SoundWave(opt);
	        			this._SoundWave.attachMicrophone();
	        			this._SoundWave.start();
	        		}
	        	}
    	};

    	MyVoix.prototype.constructor=MyVoix;

    	/*
     	* Expose Voix
     	*/
    	// AMD suppport
    	if (typeof window.define === 'function' && window.define.amd !== undefined) {
        		window.define('MyVoix', [], function () {
            	return MyVoix;
        		});
    	// CommonJS suppport
    	}else if(typeof module !== 'undefined' && module.exports !== undefined) {
        		module.exports = MyVoix;
    	// Default
    	}else{
        		window.MyVoix = MyVoix;
    	}
})(this);