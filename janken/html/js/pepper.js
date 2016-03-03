// QiSessionオブジェクトの作成
var session = new QiSession();
var before_aiko_flg;

function isset( data ){
    if(data === "" || data === null || data === undefined){
        return false;
    }else{
        return true;
    }
};

$(function (){
    var _event = 'touchend click';

    $(document).on(_event, '.bnt_click', function(event) {
        var id = event.target.id;
        //alert("bnt_click:" + id);
        tabletDebugMessage("bnt_click:" + id)
        
    	session.service("ALMemory").done(function (ALMemory) {
    		ALMemory.raiseEvent("TouchTablet/ToPepper", id);
    	});

    });
});

//Pepperにデータ送信
function sayPepper(message) {
	if(isset(session)){
		session.service("ALMemory").done(function (ALMemory) {
			ALMemory.raiseEvent("TouchTablet/ToPepper", message);
		});
	}
	//alert(message);
}

function tabletDebugMessage(message) {
	session.service("ALMemory").done(function (ALMemory) {
	    ALMemory.raiseEvent("TabletDebug/message", "tabletDebugMessage : " + message);
	});
}

var console = {};
console.log = function(msg){
	//alert(msg);
	tabletDebugMessage(msg);
};

