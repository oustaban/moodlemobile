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
                                                    var fileSignature = MM.config.current_site.id+"/"+course+"/result/"+userid+"_"+timeSession+".png";
                                    
                                                    //create local result file
                                                    MM.fs.createFile(fileSignature,
                                                        function(fileEntry) {
                                                            MM.fs.writeInFile(fileEntry, sig, 
                                                                function(fileUrl) {
                                                                    MM.log(' Write Signature OK : ' + fileUrl+':'+sig);
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
			