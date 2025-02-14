/**
 * Created by lz on 2018/3/12.
 */
Game=function(init_state,flag_view,wsUri,h2Uri,userid,wsToken)
{
    var _this = this;
    this.scene=scene;
    this.loader =  new BABYLON.AssetsManager(scene);;//资源管理器
    //控制者数组
    this.arr_allplayers=null;
    this.arr_myplayers={};
    this.arr_webplayers={};
    this.arr_npcs={};
    //this.player={};//对于world用户这两者相等?
    //this.player.arr_units=[];//这些不在这里设置，在initscene中设置
    this.world={};
    this.world.arr_units=[];
    //this.arr_
    this.count={};
    this.count.count_name_npcs=0;
    this.Cameras={};//scene里也有？
    this.ws=null;
    this.lights={};
    this.fsUI=BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1");
    this.hl=new BABYLON.HighlightLayer("hl1", scene);
    this.hl.blurVerticalSize = 1.0;//这个影响的并不是高光的粗细程度，而是将它分成 多条以产生模糊效果，数值表示多条间的间隙尺寸
    this.hl.blurHorizontalSize =1.0;
    this.hl.innerGlow = false;
    this.hl.alphaBlendingMode=3;
    //this.hl.isStroke=true;
    //this.hl.blurTextureSizeRatio=2;
    //this.hl.mainTextureFixedSize=100;
    //this.hl.renderingGroupId=3;
    //this.hl._options.mainTextureRatio=1000;

    this.wsUri=wsUri;
    this.wsConnected=false;
    this.init_state=init_state;//当前运行状态
    /*0-startWebGL
    1-WebGLStarted
    2-PlanetDrawed
     * */
    this.h2Uri=h2Uri;
    //我是谁
    this.WhoAmI=userid;//newland.randomString(8);
    this.userid=userid;
    this.wsToken=wsToken;
    //this.arr_webplayers

    this.materials={};
    var mat_frame = new BABYLON.StandardMaterial("mat_frame", scene);
    mat_frame.wireframe = true;
    //mat_frame.useLogarithmicDepth = true;
    mat_frame.freeze();
    this.materials.mat_frame=mat_frame;
    var mat_red=new BABYLON.StandardMaterial("mat_red", scene);
    mat_red.diffuseColor = new BABYLON.Color3(1, 0, 0);
    //mat_red.useLogarithmicDepth = true;
    mat_red.freeze();
    var mat_green=new BABYLON.StandardMaterial("mat_green", scene);
    mat_green.diffuseColor = new BABYLON.Color3(0, 1, 0);
    //mat_green.useLogarithmicDepth = true;
    mat_green.freeze();
    var mat_blue=new BABYLON.StandardMaterial("mat_blue", scene);
    mat_blue.diffuseColor = new BABYLON.Color3(0, 0, 1);
    mat_blue.freeze();
    var mat_black=new BABYLON.StandardMaterial("mat_black", scene);
    mat_black.diffuseColor = new BABYLON.Color3(0, 0, 0);
    //mat_black.useLogarithmicDepth = true;
    mat_black.freeze();
    var mat_orange=new BABYLON.StandardMaterial("mat_orange", scene);
    mat_orange.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    //mat_orange.useLogarithmicDepth = true;
    mat_orange.freeze();
    var mat_yellow=new BABYLON.StandardMaterial("mat_yellow", scene);
    mat_yellow.diffuseColor = new BABYLON.Color3(1, 1, 0);
    //mat_yellow.useLogarithmicDepth = true;
    mat_yellow.freeze();
    var mat_gray=new BABYLON.StandardMaterial("mat_gray", scene);
    mat_gray.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    //mat_gray.useLogarithmicDepth = true;
    mat_gray.freeze();
    this.materials.mat_red=mat_red;
    this.materials.mat_green=mat_green;
    this.materials.mat_blue=mat_blue;
    this.materials.mat_black=mat_black;
    this.materials.mat_orange=mat_orange;
    this.materials.mat_yellow=mat_yellow;
    this.materials.mat_gray=mat_gray;

    this.models={};
    this.textures={};
    this.textures["grained_uv"]=new BABYLON.Texture("../../ASSETS/IMAGE/grained_uv.png", scene);//磨砂表面
    this.texts={};

    this.flag_startr=0;//开始渲染并且地形初始化完毕
    this.flag_starta=0;
    this.list_nohurry=[];
    this.nohurry=0;//一个计时器，让一些计算不要太频繁
    this.flag_online=false;
    this.flag_view=flag_view;//first/third/input/free
    this.flag_controlEnabled = false;
    this.arr_keystate=[];
    this.obj_keystate={};
    this.SpriteManager=new BABYLON.SpriteManager("treesManagr", "../../ASSETS/IMAGE/CURSOR/palm.png", 2000, 100, scene);
    this.SpriteManager.renderingGroupId=2;
    this.obj_ground={};//存放地面对象
    this.arr_startpoint=[];//场景的所有出生点
    this.currentarea=null;
}
Game.prototype={
    AddNohurry:function(name,delay,lastt,todo,count)
    {
        var _this=this;
        /*if(this.list_nohurry[name])
        {
            return;
        }
        this.list_nohurry[name]={delay:delay,lastt:lastt,todo:todo
            ,count:count};*/
        var len=_this.list_nohurry.length;
        if(len==0)
        {
            _this.list_nohurry.push({delay:delay,lastt:lastt,todo:todo,name:name
                ,count:count})
        }
        else {
            for(var i=0;i<len;i++)
            {
                var obj_nohurry=_this.list_nohurry[i];
                if(obj_nohurry.name==name)//如果已经有同名任务
                {
                    return;
                }
                if(delay>obj_nohurry.delay)//如果新任务耗时更长
                {
                    continue;
                }
                else {
                    _this.list_nohurry.splice(i,0,{delay:delay,lastt:lastt,todo:todo,name:name
                        ,count:count});
                    break;
                }
            }
        }

    },
    RemoveNohurry:function(name)
    {
        delete this.list_nohurry[name];
    },
    HandleNoHurry:function()
    {
        var _this=this;
        if( _this.flag_startr==0)//开始渲染并且地形初始化完毕！！
        {
            engine.hideLoadingUI();
            _this.flag_startr=1;
            _this.lastframet=new Date().getTime();
            _this.firstframet=_this.lastframet;
            _this.DeltaTime=0;
        }
        else
        {
            _this.currentframet=new Date().getTime();
            _this.DeltaTime=_this.currentframet-_this.lastframet;//取得两帧之间的时间
            _this.lastframet=_this.currentframet;
            /*_this.nohurry+=_this.DeltaTime;

            if(MyGame&&_this.nohurry>1000)//每一秒进行一次导航修正
            {
                _this.nohurry=0;

            }*/
            //var time_start=_this.currentframet-_this.firstframet;//当前时间到最初过了多久
            for(var i=0;i<_this.list_nohurry.length;i++)
            {
                var obj_nohurry=_this.list_nohurry[i];
                if(obj_nohurry.lastt==0)
                {
                    obj_nohurry.lastt=new Date().getTime();
                }
                else
                {
                    var time_start=_this.currentframet-obj_nohurry.lastt;
                    if(time_start>obj_nohurry.delay)//如果经过的时间超过了每次执行周期乘以执行次数加一，则执行一次
                    {
                        obj_nohurry.todo();
                        obj_nohurry.count++;
                        obj_nohurry.lastt=_this.currentframet;
                        //改变策略，把耗时操作放到work线程里执行，再主线程执行所有任务，包括调用work线程
                        //break;//每一帧最多只做一个费时任务，周期更短的任务放在队列前面，获得更多执行机会
                    }
                }

            }
            if(_this.flag_starta==1)//如果开始进行ai计算，否则只处理和基本ui有关的内容
            {

            }
        }
    }
}