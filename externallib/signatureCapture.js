function SignatureCapture( canvasID ) {
	this.touchSupported = Modernizr.touch;
	this.canvasID = canvasID;
	this.canvas = $("#"+canvasID);
	this.context = this.canvas.get(0).getContext("2d");	
	this.context.strokeStyle = "#000000";
	this.context.lineWidth = 1;
	this.lastMousePoint = {x:0, y:0};
	
	this.canvas[0].width = this.canvas.parent().innerWidth();
    
	if (this.touchSupported) {
		this.mouseDownEvent = "touchstart";
		this.mouseMoveEvent = "touchmove";
		this.mouseUpEvent = "touchend";
	}
	else {
		this.mouseDownEvent = "mousedown";
		this.mouseMoveEvent = "mousemove";
		this.mouseUpEvent = "mouseup";
	}
	
	this.canvas.bind( this.mouseDownEvent, this.onCanvasMouseDown() );
}

SignatureCapture.prototype.onCanvasMouseDown = function () {
	var self = this;
	return function(event) {
		self.mouseMoveHandler = self.onCanvasMouseMove()
		self.mouseUpHandler = self.onCanvasMouseUp()

		$(document).bind( self.mouseMoveEvent, self.mouseMoveHandler );
		$(document).bind( self.mouseUpEvent, self.mouseUpHandler );
		
		self.updateMousePosition( event );
		self.updateCanvas( event );
	}
}

SignatureCapture.prototype.onCanvasMouseMove = function () {
	var self = this;
	return function(event) {

		self.updateCanvas( event );
     	event.preventDefault();
    	return false;
	}
}

SignatureCapture.prototype.onCanvasMouseUp = function (event) {
	var self = this;
	return function(event) {

		$(document).unbind( self.mouseMoveEvent, self.mouseMoveHandler );
		$(document).unbind( self.mouseUpEvent, self.mouseUpHandler );
		
		self.mouseMoveHandler = null;
		self.mouseUpHandler = null;
	}
}

SignatureCapture.prototype.updateMousePosition = function (event) {
 	var target;
	if (this.touchSupported) {
		target = event.originalEvent.touches[0]
	}
	else {
		target = event;
	}

	var offset = this.canvas.offset();
	this.lastMousePoint.x = target.pageX - offset.left;
	this.lastMousePoint.y = target.pageY - offset.top;

}

SignatureCapture.prototype.updateCanvas = function (event) {

	this.context.beginPath();
	this.context.moveTo( this.lastMousePoint.x, this.lastMousePoint.y );
	this.updateMousePosition( event );
	this.context.lineTo( this.lastMousePoint.x, this.lastMousePoint.y );
	this.context.stroke();
}

SignatureCapture.prototype.toString = function () {

	var dataString = this.canvas.get(0).toDataURL("image/png");
	var index = dataString.indexOf( "," )+1;
	dataString = dataString.substring( index );
	
	return dataString;
}

SignatureCapture.prototype.clear = function () {

	var c = this.canvas[0];
	this.context.clearRect( 0, 0, c.width, c.height );
}

function base64_decode(data) {
  //  discuss at: http://phpjs.org/functions/base64_decode/
  // original by: Tyler Akins (http://rumkin.com)
  // improved by: Thunder.m
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Aman Gupta
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Onno Marsman
  // bugfixed by: Pellentesque Malesuada
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //   example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
  //   returns 1: 'Kevin van Zonneveld'
  //   example 2: base64_decode('YQ===');
  //   returns 2: 'a'

  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
    ac = 0,
    dec = '',
    tmp_arr = [];

  if (!data) {
    return data;
  }

  data += '';

  do { // unpack four hexets into three octets using index points in b64
    h1 = b64.indexOf(data.charAt(i++));
    h2 = b64.indexOf(data.charAt(i++));
    h3 = b64.indexOf(data.charAt(i++));
    h4 = b64.indexOf(data.charAt(i++));

    bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

    o1 = bits >> 16 & 0xff;
    o2 = bits >> 8 & 0xff;
    o3 = bits & 0xff;

    if (h3 == 64) {
      tmp_arr[ac++] = String.fromCharCode(o1);
    } else if (h4 == 64) {
      tmp_arr[ac++] = String.fromCharCode(o1, o2);
    } else {
      tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
    }
  } while (i < data.length);

  dec = tmp_arr.join('');

  return dec.replace(/\0+$/, '');
}

function signaturePopin( elem ) {

                                            //$("#signature").on(MM.clickType, function(e) {
                        
                                                MM.widgets.dialogClose();
                                                
                                                var timeSession = $(elem).attr("time");
                                                var course = $(elem).attr("course");
                                                var userid = $(elem).attr("userid");
                                                var sigCapture = null;
                                                
                                                MM.log('Signature : ' + timeSession + ',' + course + ',' + userid);
                                                
                                                var userP = MM.db.get('users', MM.config.current_site.id + "-" + userid);
                                                var userG = userP.toJSON();
                                                
                                                var addNote = "Valider";
                                                var html = '<div id="canvasContainer" style="background-color:#cccccc"><canvas id="signature" name="signature" height="200px" /></div>';
                        
                                                var options = {
                                                    title: 'Signature de la session pour '+userG.fullname,
                                                    width: "90%",
                                                    buttons: {}
                                                };
                                                
                                                options.buttons[MM.lang.s("cancel")] = function() {
                                                    MM.Router.navigate("eleves/" + course );
                                                    MM.widgets.dialogClose();
                                                    $('#stopSessionL').click();
                                                };
                                                
                                                
                                                
                                                options.buttons["Effacer"] = function() {
                                                    sigCapture = new SignatureCapture( "signature" );
                                                    sigCapture.clear();
                                                };
                                                
                                                options.buttons["Valider"] = function() {
                                                    sigCapture = new SignatureCapture( "signature" );
                                                    var sig = sigCapture.toString();
													var sigDec = base64_decode(sig);
                                                    var fileSignature = MM.config.current_site.id+"/"+course+"/result/"+userid+"_"+timeSession+".png";
                                    
                                                    //create local result file
                                                    MM.fs.createFile(fileSignature,
                                                        function(fileEntry) {
                                                            MM.fs.writeInFile(fileEntry, sigDec, 
                                                                function(fileUrl) {
                                                                    MM.log(' Write Signature OK : ' + fileUrl+':'+sigDec);
																	MM.Router.navigate("eleves/" + course );
																	MM.widgets.dialogClose();
																	$('#stopSessionL').click();
                                                                },
                                                                function(fileUrl) {
                                                                    MM.log(' Write Signature NOK : ' + fileUrl);
																	MM.Router.navigate("eleves/" + course );
																	MM.widgets.dialogClose();
																	$('#stopSessionL').click();
                                                                }
                                                            );
                                                        },
                                                        function(fileEntry) {
                                                            MM.log(' Write Signature NOK : ' + fileSignature);
															MM.Router.navigate("eleves/" + course );
															MM.widgets.dialogClose();
															$('#stopSessionL').click();
                                                        }
                                                    );
                                                                
                                                    
                                                };
                                                
                                                MM.widgets.dialog(html, options);
                                                
                                                
                                                $(document).ready(function(e) {     
                                                    var sigCapture = new SignatureCapture( "signature" );
                                                });
                                                
}
			