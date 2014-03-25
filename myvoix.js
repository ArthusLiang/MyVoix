/*
@author: Arthus Huang
*/
(function (window) {
    
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
                    }
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

                    /* Add By Arthus */
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
    } else if (typeof module !== 'undefined' && module.exports !== undefined) {
        module.exports = MyVoix;

    // Default
    } else {
        window.MyVoix = MyVoix;
    }

}(this));    

