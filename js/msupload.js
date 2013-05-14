var gallery_arr = new Array();

$(document).ready(function () { //jquery      
/* Check if we are in edit mode and the required modules are available and then customize the toolbar */
	if ( $.inArray( mw.config.get( 'wgAction' ), ['edit', 'submit'] ) !== -1 ) {
	//mw.loader.using( 'user.options', function () {
		if ( mw.user.options.get('usebetatoolbar') ) {
	    	mw.loader.using( 'ext.wikiEditor.toolbar', function () { createUpload(true); });
		}else{ createUpload(false); }
	//});
	}
});

function createUpload(wikiEditor){
		//create upload button
		var upload_button = $(document.createElement("div")).attr('id',"upload_select");
    	var upload_container = $(document.createElement("div")).attr({ 
      			id: "upload_container",
      			title: mw.msg('msu-button_title'),
      			'class': 'start-loading'
     	}).append(upload_button);
      
		if(wikiEditor==true){		
			//insert upload button
			var upload_tab = $(document.createElement("div")).attr('class','group ').appendTo('#wikiEditor-ui-toolbar .section-main');
			upload_container.appendTo(upload_tab);
			//create upload div  
			var upload_div = $(document.createElement("div")).attr("id","upload_div").insertAfter('#wikiEditor-ui-toolbar'); 
			$('#wikiEditor-ui-toolbar .tool .options').css('z-index', '2'); //headline dropdown		
		}else{ //only standard editor
	      upload_container.css('display','inline-block').css('vertical-align', 'middle').appendTo("#toolbar"); 
	      upload_button.addClass('old_button');
		  var upload_div = $(document.createElement("div")).attr("id","upload_div").insertAfter("#toolbar"); 
		} 
		
		var status_div = $(document.createElement("div")).attr("id","upload_status").html('No runtime found.').appendTo(upload_div).hide(); 
	    var upload_list = $(document.createElement("ul")).attr("id","upload_list").appendTo(upload_div);
	    var bottom_div = $(document.createElement("div")).attr("id","upload_bottom").appendTo(upload_div).hide(); 
	    var start_button = $(document.createElement("a")).attr("id","upload_files").appendTo(bottom_div).hide();
	    var spacer1 = $(document.createElement("span")).attr("class", "spacer").appendTo(bottom_div).hide();
    	var clean_all = $(document.createElement("a")).attr("id","clean_all").text(mw.msg('msu-clean_all')).appendTo(bottom_div).hide();	
		var spacer2 = $(document.createElement("span")).attr("class", "spacer").appendTo(bottom_div).hide();
		var gallery_insert = $(document.createElement("a")).attr("id","gallery_insert").appendTo(bottom_div).hide();
		var upload_drop = $(document.createElement("div")).attr("id","upload_drop").insertAfter(status_div).hide();
	     
        var uploader = new plupload.Uploader({
    		runtimes : 'html5,flash,silverlight,html4',
    		browse_button : 'upload_select',
    		container : 'upload_container',
    		max_file_size : '100mb',
    		drop_element: 'upload_drop',
    		//unique_names: true,  
    		//multipart: false, //evtl i
        	url : msu_vars.path+'/../../api.php',
    		flash_swf_url : msu_vars.path+'/js/plupload/Moxie.swf',
    		silverlight_xap_url : msu_vars.path+'/js/plupload/Moxie.xap'
    		
    		//resize : {width : 320, height : 240, quality : 90}, //resize pictures

	     /* Specify what files to browse for
        filters : [
	            {title : "Image files", extensions : "jpg,gif,png"},
	            {title : "Zip files", extensions : "zip"}
        ], */	
    	});
    
    	uploader.bind('PostInit', function(up) {

	    	upload_container.removeClass('start-loading');
	    	if(msu_vars.debugMode){
    		status_div.html("<b>Debug</b> runtime: " + up.runtime + " features: "+ JSON.stringify(up.features)).show();
    		}

    		if(up.features.dragdrop && msu_vars.dragdrop){
	        	upload_drop.text(mw.msg('msu-dropzone')).show();
	        	upload_drop.bind('dragover',function(event){
					   $(this).addClass('drop_over').css('padding','20px');
				}).bind('dragleave',function(event){
					   $(this).removeClass('drop_over').css('padding','0px');
				}).bind('drop',function(event){
					   $(this).removeClass('drop_over').css('padding','0px');
				});

	       	}else{
	       		upload_div.addClass('nodragdrop');
	       	} //if
    		
    	});

      uploader.bind('FilesAdded', function(up, files) {
      	$.each(files, function(i, file){
    			
    			//iOS6 by SLBoat
    			if ((navigator.platform == "iPad" || navigator.platform == "iPhone")) {
    				if (file.name.indexOf("image")>-1 && file.name.length<11){ 
					var heute=new Date(); 
					fileNameApple = navigator.platform+'_image_'+heute.getFullYear()+'-'+heute.getMonth()+'-'+heute.getDate()+'-'+heute.getTime(); //because each image is named "image.jpg" in iOS6
					file.name = fileNameApple+'_'+i+'.'+file.name.split('.').pop(); // image_Y-M-D_0.jpg
					}
				}
    			file.li = $(document.createElement("li")).attr("id",file.id).attr("class","file").appendTo(upload_list);
	            
	            file.li.type = $(document.createElement("span")).attr("class","file-type").appendTo(file.li);
	            file.li.title = $(document.createElement("span")).attr("class","file-title").text(file.name).appendTo(file.li);
	            file.li.size = $(document.createElement("span")).attr("class","file-size").text(plupload.formatSize(file.size)).appendTo(file.li);
	            file.li.loading = $(document.createElement("span")).attr("class","file-loading").appendTo(file.li);
	            file.li.warning = $(document.createElement("span")).attr("class","file-warning").appendTo(file.li);
	            
	            check_extension(file,up); 
    		});

    		up.refresh(); // Reposition Flash/Silverlight
    		up.trigger("CheckFiles");
    	});
	
     uploader.bind('QueueChanged', function(up) {
		up.trigger("CheckFiles");
     });
      
    uploader.bind('StateChanged', function(up) {
		if(msu_vars.debugMode) console.log(up.state);
		
		if (up.files.length === (up.total.uploaded + up.total.failed)) {
			//console.log('state: '+up.files.length)// all files uploaded --> trigger
		}
	});
	
	uploader.bind('FilesRemoved', function(up,files) {
		if(msu_vars.debugMode) console.log('files removed');
		//uploader.trigger("CheckFiles", up);
	});

    uploader.bind('BeforeUpload', function(up, file) {
    	   	
    	file.li.title.text(file.name).show(); //show title
    	$('#' + file.id + " input.input_change").hide(); //hide input
    	
    	up.settings.multipart_params = {
    		filename : file.name,
    		token: mw.user.tokens.get( 'editToken' ),
    		action:"upload",
    		ignorewarnings:true,
    		comment:mw.msg('msu-comment'),
    		format:"json"
    	}; //set multipart_params
    	$('#' + file.id + " div.file-progress-bar").progressbar({value: '1'});
    	$('#' + file.id + " span.file-progress-state").html("0%");
    	
     });
      
     uploader.bind('UploadProgress', function(up, file) {
    		$('#' + file.id + " span.file-progress-state").html(file.percent + "%");
        	$('#' + file.id + " div.file-progress-bar").progressbar({value: file.percent});
      		$('#' + file.id + ' div.file-progress-bar .ui-progressbar-value').removeClass('ui-corner-left');
      });
   
     uploader.bind('Error', function(up, err) {
    		
        	$('#' + err.file.id + " span.file-warning")
        	.html("Error: " + err.code +", Message: " + err.message + (err.file ? ", File: " + err.file.name : ""));
        	
    		status_div.append(err.message);
    		up.refresh(); // Reposition Flash/Silverlight
     });
    
     uploader.bind('FileUploaded', function(up, file, success) {

		if(msu_vars.debugMode) console.log(success);
		
		file.li.title.unbind('click');
		file.li.title.unbind('mouseover');
			
        $('#' + file.id + " div.file-progress").fadeOut("slow");
        $('#' + file.id + " div.file-progress-bar").fadeOut("slow");
        $('#' + file.id + " span.file-progress-state").fadeOut("slow");
            
		try{
			result = jQuery.parseJSON( success.response );
			
			if(result.error){
				//{"servedby":"abc-alpha","error":{"code":"nofilename","info":"The filename parameter must be set"}}
				file_error(up,file,result.error.info);
				
			} else {
			
			//console.log(result.upload.result);
			/*{"upload":{"result":"Success",
						"filename":"Msupload_v8.4.jpg",
						"imageinfo":{
							"timestamp":"2012-02-28T14:52:05Z",
							"user":"L\u00fctz",
							"userid":4,
							"size":35491,
							"width":865,
							"height":292,
							"parsedcomment":"MsUpload",
							"comment":"MsUpload",
							"url":"...",
							"descriptionurl":"...",
							"sha1":"...",
							"metadata":...,
							"mime":"image\/jpeg",
							"mediatype":"BITMAP",
							"bitdepth":8
			}}}*/
			
			file.li.type.addClass('ok');
            file.li.addClass('green');
            file.li.warning.fadeOut("slow");
            
    		if(file.kat){ //should the categroy be set?
		    	$.get( mw.util.wikiScript(), { action: 'ajax', rs: 'wfMsUploadSaveKat',  rsargs: [file.name,wgPageName]} ,"json");
		    } //if category
    		
    		$(document.createElement("a")).text(mw.msg('msu-insert_link')).click(function(e) { //click
  			    if(msu_vars.use_mslinks == 'true'){
  			    	mw.toolbar.insertTags( '{{#l:'+file.name+'}}', '', '', '' ); // insert link
  			    } else {
  			    	mw.toolbar.insertTags( '[[:File:'+file.name+']]', '', '', '' ); // insert link
  			    }
  			    
        	}).appendTo(file.li);
    		
            if (file.group == "pic"){
        		  
        		//file.li.type.addClass('picture_load'); // preview -> no need for this any more
            	//file.li.type.html('<img src="'+result.upload.imageinfo.url+'" height="18">');
        		gallery_arr.push(file.name);	

        		if(gallery_arr.length == 2){ //only at first time add click function
	        		gallery_insert.click(function(e) { //click
	  					add_gallery(); //to take always the current list
	        		}).text(mw.msg('msu-insert_gallery')).show();
	        		//spacer.show();
        		} else if(gallery_arr.length< 2) {	
        		  	gallery_insert.html('');
        		}

        		$(document.createElement("span")).text(' | ').appendTo(file.li);
        		$(document.createElement("a")).text(mw.msg('msu-insert_picture')).click(function(e) { //click
        			
        			mw.toolbar.insertTags( '[[File:'+file.name+msu_vars.imgParams+']]','','','');
        		
        		}).appendTo(file.li);
        		
                
        	} else if (file.group == "mov") { //mov  
        		  
        		$(document.createElement("span")).text(' | ').appendTo(file.li);
        		$(document.createElement("a")).text(mw.msg('msu-insert_movie')).click(function(e) { //click

        			mw.toolbar.insertTags( '[[File:'+file.name+']]','','','');
        			
        		}).appendTo(file.li);

        	} //movie
        	
        	}//else error
        	
        }catch(e){//try		
			file_error(up,file,"Error: " + success.response.replace(/(<([^>]+)>)/ig,"")); //remove html tags
		}
		
		up.removeFile(file); //for preventing a second upload afterwards
		
     });
     
	 uploader.bind('UploadComplete', function(up, files) {  		
	    	uploader.trigger("CheckFiles");  //trigger --> state changed
	    	//start_button.hide();
	 });
	 
    uploader.bind('CheckFiles', function() { 
    	
    	var file_len = uploader.files.length;
		var gal_len = gallery_arr.length;
		var li_len = $('#upload_list li').length;
		
	   	if(msu_vars.debugMode) console.log("files:"+file_len+" gallery:"+gal_len+" list: "+li_len);

        if (file_len>0){
        	
        	bottom_div.show();
        	
        	if (file_len==1){
        		start_button.text(mw.msg('msu-upload_this')).show();
        	} else {
        		start_button.text(mw.msg('msu-upload_all')).show();
        	} 
        	
        	spacer1.show();	
	       	
       } else { //0 files in list
         	start_button.hide();
         	spacer1.hide();	
        }  
       
       if(gal_len >= 2){ 
	    	spacer2.show();	
	    	gallery_insert.show();
	    	bottom_div.show();
	   	}else{
         	gallery_insert.hide();
         	spacer2.hide();	
	   	}
	   	
	   	if(li_len > 0){
	   		bottom_div.show();
	   		clean_all.text(mw.msg('msu-clean_all')).click(function(){
	        				
				gallery_arr.length = 0; // reset
				
				uploader.splice(0, uploader.files.length);
				
				$('#upload_list .file').hide( "slow", function() {
					$(this).remove();
					$(this).hide(); //clear_all button
					gallery_insert.unbind('click');
					bottom_div.hide();
				});
				//uploader.trigger("CheckFiles", uploader);
	       	}).show();
	       	
	   	} else {
	   		bottom_div.hide();
	   	}

       uploader.refresh(); // Reposition Flash/Silverlight
	 });
    	
    	
    	$('#upload_files').click(function(e) {
    		uploader.start();
    		e.preventDefault();
    	});
    	
    /*
    $('uploadfiles').onclick = function() {
          	uploader.start();
          	return false;
          };
        */
                
   uploader.init();



};//function

function add_gallery(){
	gallery_text = "File:";
	gallery_text += gallery_arr.join("\nFile:");
	gallery_text +='\n';
	mw.toolbar.insertTags( '<gallery>\n\n'+gallery_text+'\n</gallery>\n', '', '', '' ); // insert gallery
}

function check_extension(file,uploader){
		if(msu_vars.debugMode) console.log(file);
		
        file.li.loading.show();
		file.extension = file.name.split('.').pop().toLowerCase();

		if($.inArray(file.extension, wgFileExtensions) != -1) {
		    
		    switch(file.extension) {

       	 	  case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'tif': case 'tiff': //pictures
       	 		file.group = "pic";
       	 		//file.li.type.addClass('picture');
       	 		try{ //preview picture
	       	 		var img = new o.Image(); 
	                img.onload = function() {
	                  //embed the current thumbnail
	                  	this.embed(file.li.type.get(0), {
	                    	width: 30,
	                       	height: 17,
	                        crop: false
	                	});
	                };
	    			img.load(file.getSource());
					file.li.type.addClass('picture_load');		
	       	 	}catch(e){//try
	       	 		file.li.type.addClass('picture');
	       	 	}
            	break;
			  case 'mov':
       	 		file.group = "mov";
       	 		file.li.type.addClass('film');
             	break;
        	  case 'pdf':
        	    file.li.type.addClass('pdf');
             	break;
    		}
    		
            check_upload_warning(file.name,file.li);
            
                   				
	        file.li.cancel = $(document.createElement("span")).attr("title",mw.msg('msu-cancel_upload')).click(function(e) {
	                
	                uploader.removeFile(file);
	                if (file.group == "pic"){
	                	var idx = jQuery.inArray(file.name,gallery_arr); // Find the index (indexOf not possible in ie8)
					 	if(idx!=-1) gallery_arr.splice(idx, 1); 	// Remove it if really found!
					 	//uploader.trigger("CheckFiles", uploader); 	// If Picture is removed
        			}
        			file.li.fadeOut( "slow", function() { 
        				$(this).remove(); 
        				uploader.trigger("CheckFiles");
        			});
        			//uploader.refresh(); 
        			
        			
	        }).attr("class","file-cancel").appendTo(file.li);
	            
            build(file); // alles aufbauen
            	

      } else { // wrong datatype
				
			file.li.loading.hide(1, function() { //create callback 
				uploader.removeFile(file);
				uploader.refresh();  	
			});

            file_error(uploader,file,mw.msg('msu-ext_not_allowed')+' '+wgFileExtensions.join(','));

      }//else
}

function check_upload_warning(filename,file_li){
	 
	var mw_version = parseInt(wgVersion.substr(2,2));
	if(mw_version > 21){
		
		$.ajax({ url: mw.util.wikiScript( 'api' ), dataType: 'json', type: 'POST',
        data: {
            format: 'json',
            action: 'query',
            titles: 'File:'+filename,
            prop: 'imageinfo',
            iiprop: 'uploadwarning'
        }, success: function( data ) {
            if ( data && data.query && data.query.pages) {
                var pages = data.query.pages;
				//warning_text(file_li,pages[Object.keys(pages)[0]].imageinfo[0].html); //.keys possible in ie8
				$.each(pages, function(index,val){
                	warning_text(file_li,val.imageinfo[0].html);
                	return false; //break out
                });
				
            } else {
                warning_text(file_li,'Error: Unknown result from API.');
            }
        },
        error: function( xhr ) { warning_text(file_li,'Error: Request failed.'); }
    	});
		
	} else {
		
		sajax_do_call( 'SpecialUpload::ajaxGetExistsWarning', [filename], function (result) {
			warning_text(file_li,result.responseText);
		});
	}	      	
}

function warning_text(file_li,warning){
    if ( warning == '' || warning == '&nbsp;' || warning =='&#160;') {    			
        	file_li.warning.text(mw.msg('msu-upload_possible')).removeClass('small_warn');      			
    } else {		
        // errorhandling
        warning = warning.replace(/(<([^>]+)>)/ig,"");
		warning_split = warning.split(". "); //split error
        $(document.createElement("span")).attr("class","small_warn").text(warning_split[0]).click(function(e) {
        	$(this).text(warning_split[0]+'. '+warning_split[1]);
        }).appendTo(file_li.warning);
    } //else
    file_li.loading.hide();	
}

function file_error(uploader,file,error_text){
	file.li.warning.text(error_text);
    file.li.addClass('yellow');
    file.li.type.addClass('error');
    file.li.click(function(e) { //remove li at click
		file.li.fadeOut( "slow", function() { 
	   	$(this).remove(); 
	   	uploader.trigger("CheckFiles");
	   	});
	});
}

function build(file){
   
      //fileindexer
      //if(autoIndex){
        	// new Element('input', {name:'fi['+file.id+']', 'class':'check_index',type: 'checkbox', 'checked': true}).inject(file.ui.title, 'after');
    	  //new Element('span', {'class':'check_span',html: 'Index erstellen'}).inject(file.ui.title, 'after'); 
      //}

      //autokat
      if(msu_vars.autoKat){
      	file.kat = msu_vars.autoChecked; //predefine
        if(wgNamespaceNumber == 14){ //category page
        	
        	$(document.createElement("input")).attr({
        		'class':'check_index',	
        		type: 'checkbox',
        		'checked': file.kat
        	}).change(function(e) {
	        
	          file.kat = this.checked; // save
	        
	        }).appendTo(file.li);
    	  	
    	  	$(document.createElement("span")).attr("class","check_span").text(wgPageName.replace(/_/g, " ")).appendTo(file.li); 
   
        }
      } 
      
		
    	file.li.title.mouseover(function() { //mouseover
			$(this).addClass('title_over');
    	 }).mouseleave(function() {		//mouseout	
    		$(this).removeClass('title_over');
  		}).click(function(e) { //click
  			
  			$(this).hide();
  			var input_change = $(document.createElement("input")).attr({
	          'class':'input_change',
	          size:file.name.length,
	          //id: 'input_change-'+file.id,
	          name:'filename',
	          value:file.name
        	}).insertAfter($(this));  
        
	        input_change.change(function(e) {
	        
	          file.name = this.value; //save new name
	          check_upload_warning(this.value,file.li);
	        
	        });
  			
  		});

    file.li.append('<div class="file-progress"><div class="file-progress-bar"></div><span class="file-progress-state"></span></div>'); 
    
}