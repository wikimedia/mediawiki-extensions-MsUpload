var $ = jQuery;
var mw = mediaWiki;
var msuVars = window.msuVars;

function fileError( uploader, file, errorText ) {
	file.li.warning.text( errorText );
	file.li.addClass( 'yellow' );
	file.li.type.addClass( 'error' );
	file.li.click( function() { // Remove li at click
		file.li.fadeOut( 'slow', function() {
	 		$( this ).remove();
	 		uploader.trigger( 'CheckFiles' );
	 	});
	});
}

var galleryArray = [];
function addGallery() {
	var galleryText = 'File:' + galleryArray.join( '\nFile:' );
	mw.toolbar.insertTags( '<gallery>\n' + galleryText + '\n</gallery>\n', '', '', '' ); // Insert gallery
}

function addFiles() {
	mw.toolbar.insertTags( '[[File:' + galleryArray.join( ']]\n[[File:' ) + ']]\n', '', '', '' ); // Insert gallery
}

function warningText( fileItem, warning ) {
	if ( warning === '' || warning === '&nbsp;' || warning ==='&#160;' ) {
		fileItem.warning.text( mw.msg( 'msu-upload-possible' ) ).removeClass( 'small-warn' );
	} else {
		// Error handling
		warning = warning.replace( /( <( [^>]+ )> )/ig, '' );
		var warningSplit = warning.split( '. ' ); // split error
		$( '<span/>' ).attr( 'class', 'small-warn' ).html( warningSplit[0] ).click( function() {
			$( this ).html( warningSplit[0] + '. ' + warningSplit[1] );
		}).appendTo( fileItem.warning );
	}
	fileItem.loading.hide();
}

function checkUploadWarning( filename, fileItem ) {
	var mwVersion = parseInt( wgVersion.substr( 2, 2 ) );
	if ( mwVersion > 21 ) {
		$.ajax({ url: mw.util.wikiScript( 'api' ), dataType: 'json', type: 'POST',
		data: {
			format: 'json',
			action: 'query',
			titles: 'File:' + filename,
			prop: 'imageinfo',
			iiprop: 'uploadwarning'
		}, success: function( data ) {
			if ( data && data.query && data.query.pages ) {
				var pages = data.query.pages;
				// warningText( fileItem, pages[Object.keys( pages )[0]].imageinfo[0].html ); // .keys possible in ie8
				$.each( pages, function( index, val ) {
					warningText( fileItem, val.imageinfo[0].html );
					return false; // Break out
				});
			} else {
				warningText( fileItem, 'Error: Unknown result from API.' );
			}
		}, error: function() {
			warningText( fileItem, 'Error: Request failed.' );
		}});
	} else {
		sajax_do_call( 'SpecialUpload::ajaxGetExistsWarning', [filename], function ( result ) {
			warningText( fileItem, result.responseText );
		});
	}
}

function build( file ) {
	/* Fileindexer
	if ( autoIndex ) {
		new Element( 'input', {name:'fi['+file.id+']', 'class':'check-index',type: 'checkbox', 'checked': true} ).inject( file.ui.title, 'after' );
		new Element( 'span', {'class':'check-span',html: 'Index erstellen'} ).inject( file.ui.title, 'after' );
	}
	*/
	// Auto category
	if ( msuVars.showAutoCat && wgNamespaceNumber === 14 ) {
		file.cat = msuVars.checkAutoCat; // Predefine
		$( '<input/>' ).attr({
			'class': 'check-index',
			'type': 'checkbox',
			'checked': file.cat
		}).change( function() {
			file.cat = this.checked; // Save
		}).appendTo( file.li );
	
		$( '<span/>' ).attr( 'class', 'check-span' ).text( wgPageName.replace( /_/g, ' ' ) ).appendTo( file.li );
	}
	file.li.title.mouseover( function() {
		$( this ).addClass( 'title_over' );
	}).mouseleave( function() {
		$( this ).removeClass( 'title_over' );
	}).click( function() {
		$( this ).hide();
		var inputChange = $( '<input/>' ).attr({
			//'id': 'input-change-' + file.id,
			'class':'input-change',
			'size': file.name.length,
			'name': 'filename',
			'value': file.name
		}).insertAfter( $( this ) );

		inputChange.change( function() {
			file.name = this.value; // save new name
			checkUploadWarning( this.value,file.li );
		});
	});
	file.li.append( '<div class="file-progress"><div class="file-progress-bar"></div><span class="file-progress-state"></span></div>' );
}

function checkExtension( file, uploader ) {
	mw.log( file );

	file.li.loading.show();
	file.extension = file.name.split( '.' ).pop().toLowerCase();

	if ( $.inArray( file.extension, wgFileExtensions ) !== -1 ) {
		switch( file.extension ) {
			case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'tif': case 'tiff': // pictures
				file.group = 'pic';
				// file.li.type.addClass( 'picture' );
				try { // preview picture
					var img = new o.Image();
					img.onload = function() {
						// embed the current thumbnail
						this.embed( file.li.type.get( 0 ), {
							width: 30,
							height: 17,
							crop: false
						});
					};
					img.load( file.getSource() );
					file.li.type.addClass( 'picture_load' );
				} catch( event ) {
					file.li.type.addClass( 'picture' );
				}
			break;
			case 'mov':
				file.group = 'mov';
				file.li.type.addClass( 'film' );
			break;
			case 'pdf':
				file.li.type.addClass( 'pdf' );
			break;
		}
		checkUploadWarning( file.name, file.li );

		file.li.cancel = $( '<span/>' ).attr( 'title', mw.msg( 'msu-cancel-upload' ) ).click( function() {
			uploader.removeFile( file );
			if ( file.group === 'pic' ) {
				var idx = jQuery.inArray( file.name, galleryArray ); // Find the index ( indexOf not possible in ie8 )
				if ( idx!==-1 ) galleryArray.splice( idx, 1 );	// Remove it if really found!
				//uploader.trigger( 'CheckFiles', uploader );	// If Picture is removed
			}
			file.li.fadeOut( 'slow', function() {
				$( this ).remove();
				uploader.trigger( 'CheckFiles' );
			});
			//uploader.refresh();
		}).attr( 'class', 'file-cancel' ).appendTo( file.li );

		build( file ); // alles aufbauen
	} else { // wrong datatype
		file.li.loading.hide( 1, function() { // create callback
			uploader.removeFile( file );
			uploader.refresh();
		});
		fileError( uploader, file, mw.msg( 'msu-ext-not-allowed' ) + ' ' + wgFileExtensions.join( ',' ) );
	}
}

function createUpload( wikiEditor ) {
		// Create upload button
		var uploadButton = $( '<div/>' ).attr( 'id', 'upload-select' );
		var uploadContainer = $( '<div/>' ).attr({
			'id': 'upload-container',
			'title': mw.msg( 'msu-button-title' ),
			'class': 'start-loading'
	 	}).append( uploadButton );

		var uploadDiv = $( '<div/>' ).attr( 'id', 'upload-div' );
		if ( wikiEditor === true ) {
			// Insert upload button
			var uploadTab = $( '<div/>' ).attr( 'class', 'group' ).appendTo( '#wikiEditor-ui-toolbar .section-main' );
			uploadContainer.appendTo( uploadTab );
			// Create upload div
			uploadDiv.insertAfter( '#wikiEditor-ui-toolbar' );
			$( '#wikiEditor-ui-toolbar .tool .options' ).css( 'z-index', '2' ); // Headline dropdown
		} else { // Only standard editor
			uploadContainer.css( 'display', 'inline-block' ).css( 'vertical-align', 'middle' ).appendTo( '#toolbar' );
			uploadButton.addClass( 'old-button' );
			uploadDiv.insertAfter( '#toolbar' );
		}

		var statusDiv = $( '<div/>' ).attr( 'id', 'upload-status' ).html( 'No runtime found.' ).appendTo( uploadDiv ).hide();
		var uploadList = $( '<ul/>' ).attr( 'id', 'upload-list' ).appendTo( uploadDiv );
		var bottomDiv = $( '<div/>' ).attr( 'id', 'upload-bottom' ).appendTo( uploadDiv ).hide();
		var startButton = $( '<a/>' ).attr( 'id', 'upload-files' ).appendTo( bottomDiv ).hide();
		var spacer1 = $( '<span/>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
		var cleanAll = $( '<a/>' ).attr( 'id', 'cleanAll' ).text( mw.msg( 'msu-clean-all' ) ).appendTo( bottomDiv ).hide();
		var spacer2 = $( '<span/>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
		var galleryInsert = $( '<a/>' ).attr( 'id', 'gallery-insert' ).appendTo( bottomDiv ).hide();
		var spacer3 = $( '<span/>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
		var filesInsert = $( '<a/>' ).attr( 'id', 'files-insert' ).appendTo( bottomDiv ).hide();
		var uploadDrop = $( '<div/>' ).attr( 'id', 'upload-drop' ).insertAfter( statusDiv ).hide();

		var uploader = new plupload.Uploader({
			'runtimes': 'html5,flash,silverlight,html4',
			'browse_button': 'upload-select',
			'container': 'upload-container',
			'max_file_size': '100mb',
			'drop_element': 'upload-drop',
			//'unique_names': true,
			//'multipart': false, // evtl i
			//'resize': { 'width': 320, 'height': 240, 'quality': 90 }, // Resize pictures
			/* Specify what files to browse for
			'filters': [
				{ 'title': 'Image files', 'extensions': 'jpg,gif,png' },
				{ 'title': 'Zip files', 'extensions': 'zip' }
			], */
			'url': msuVars.path + '/../../api.php',
			'flash_swf_url': msuVars.path + '/plupload/Moxie.swf',
			'silverlight_xap_url': msuVars.path + '/plupload/Moxie.xap'
		});

		uploader.bind( 'PostInit', function( up ) {
			mw.log( 'MsUpload DEBUG: runtime: ' + up.runtime + ' features: ' + JSON.stringify( up.features ) );
			uploadContainer.removeClass( 'start-loading' );
			if ( up.features.dragdrop && msuVars.useDragDrop ) {
				uploadDrop.text( mw.msg( 'msu-dropzone' ) ).show();
				uploadDrop.bind( 'dragover',function() {
					 $( this ).addClass( 'drop-over' ).css( 'padding', '20px' );
				}).bind( 'dragleave',function() {
					 $( this ).removeClass( 'drop-over' ).css( 'padding', 0 );
				}).bind( 'drop',function() {
					 $( this ).removeClass( 'drop-over' ).css( 'padding', 0 );
				});
		 	} else {
		 		uploadDiv.addClass( 'nodragdrop' );
		 	}
		});

	 uploader.bind( 'FilesAdded', function( up, files ) {
		$.each( files, function( i, file ) {
				// iOS6 by SLBoat
				if ( ( navigator.platform === 'iPad' || navigator.platform === 'iPhone' ) ) {
					if ( file.name.indexOf( 'image' ) > -1 && file.name.length < 11 ) {
						var heute = new Date();
						var fileNameApple = navigator.platform + '_image_' + heute.getFullYear() + '-' + heute.getMonth() + '-' + heute.getDate() + '-' + heute.getTime(); // Because each image is named 'image.jpg' in iOS6
						file.name = fileNameApple + '_' + i + '.' + file.name.split( '.' ).pop(); // image_Y-M-D_0.jpg
					}
				}
				file.li = $( '<li/>' ).attr( 'id',file.id ).attr( 'class', 'file' ).appendTo( uploadList );
				file.li.type = $( '<span/>' ).attr( 'class', 'file-type' ).appendTo( file.li );
				file.li.title = $( '<span/>' ).attr( 'class', 'file-title' ).text( file.name ).appendTo( file.li );
				file.li.size = $( '<span/>' ).attr( 'class', 'file-size' ).text( plupload.formatSize( file.size ) ).appendTo( file.li );
				file.li.loading = $( '<span/>' ).attr( 'class', 'file-loading' ).appendTo( file.li );
				file.li.warning = $( '<span/>' ).attr( 'class', 'file-warning' ).appendTo( file.li );
				checkExtension( file, up );
			});
			up.refresh(); // Reposition Flash/Silverlight
			up.trigger( 'CheckFiles' );
		});

		uploader.bind( 'QueueChanged', function( up ) {
			up.trigger( 'CheckFiles' );
		});

		uploader.bind( 'StateChanged', function( up ) {
			mw.log( up.state );
			if ( up.files.length === ( up.total.uploaded + up.total.failed ) ) {
				//mw.log( 'State: ' + up.files.length ) // All files uploaded --> trigger
			}
		});

		uploader.bind( 'FilesRemoved', function( up, files ) {
			mw.log( 'Files removed' );
			//uploader.trigger( 'CheckFiles', up );
		});

		uploader.bind( 'BeforeUpload', function( up, file ) {
			file.li.title.text( file.name ).show(); // Show title
			$( '#' + file.id + ' input.input-change' ).hide(); // Hide input
			up.settings.multipart_params = {
				'filename': file.name,
				'token': mw.user.tokens.get( 'editToken' ),
				'action': 'upload',
				'ignorewarnings': true,
				'comment': mw.msg( 'msu-comment' ),
				'format': 'json'
			}; // Set multipart_params
			$( '#' + file.id + ' div.file-progress-bar' ).progressbar({ value: '1' });
			$( '#' + file.id + ' span.file-progress-state' ).html( '0%' );
		});

		uploader.bind( 'UploadProgress', function(up, file) {
			$( '#' + file.id + ' span.file-progress-state' ).html( file.percent + '%' );
			$( '#' + file.id + ' div.file-progress-bar' ).progressbar({ 'value': file.percent });
			$( '#' + file.id + ' div.file-progress-bar .ui-progressbar-value' ).removeClass( 'ui-corner-left' );
		});

		uploader.bind( 'Error', function( up, err ) {
			$( '#' + err.file.id + ' span.file-warning' ).html(
				'Error: ' + err.code + ', Message: ' + err.message + ( err.file ? ', File: ' + err.file.name : '' )
			);
			statusDiv.append( err.message );
			up.refresh(); // Reposition Flash/Silverlight
		});

		uploader.bind( 'FileUploaded', function( up, file, success ) {
			mw.log( success );
			file.li.title.unbind( 'click' );
			file.li.title.unbind( 'mouseover' );
			$( '#' + file.id + ' div.file-progress' ).fadeOut( 'slow' );
			$( '#' + file.id + ' div.file-progress-bar' ).fadeOut( 'slow' );
			$( '#' + file.id + ' span.file-progress-state' ).fadeOut( 'slow' );

			try {
				var result = jQuery.parseJSON( success.response );
				if ( result.error ) {
					//{ 'servedby': 'abc-alpha', 'error': {'code': 'nofilename', 'info': 'The filename parameter must be set' }}
					fileError( up, file, result.error.info );
				} else {
					//mw.log( result.upload.result );
					/*{'upload': {'result': 'Success',
					'filename': 'Msupload_v8.4.jpg',
					'imageinfo': {
					'timestamp': '2012-02-28T14:52:05Z',
					'user': 'L\u00fctz',
					'userid': 4,
					'size': 35491,
					'width': 865,
					'height': 292,
					'parsedcomment': 'MsUpload',
					'comment': 'MsUpload',
					'url': '...',
					'descriptionurl': '...',
					'sha1': '...',
					'metadata': ...,
					'mime': 'image\/jpeg',
					'mediatype': 'BITMAP',
					'bitdepth': 8
					}}}*/

					file.li.type.addClass( 'ok' );
					file.li.addClass( 'green' );
					file.li.warning.fadeOut( 'slow' );

					if ( file.cat && wgNamespaceNumber === 14 ) { // should the categroy be set?
						$.get( mw.util.wikiScript(), { action: 'ajax', rs: 'MsUpload::saveCat', rsargs: [ file.name, wgPageName ] } , 'json' );
					}
					$( '<a/>' ).text( mw.msg( 'msu-insert-link' ) ).click( function() {
						if ( msuVars.useMsLinks === true ) {
							mw.toolbar.insertTags( '{{#l:' + file.name + '}}', '', '', '' ); // Insert link
						} else {
							mw.toolbar.insertTags( '[[:File:' + file.name + ']]', '', '', '' ); // Insert link
						}
					}).appendTo( file.li );
					if ( file.group === 'pic' ) {
						//file.li.type.addClass('picture_load'); // preview -> no need for this any more
						//file.li.type.html('<img src="'+result.upload.imageinfo.url+'" height="18">');
						galleryArray.push( file.name );
						if ( galleryArray.length === 2 ) { // Only at first time add click function
							galleryInsert.click( function() {
								addGallery(); // To take always the current list
							}).text( mw.msg( 'msu-insert-gallery' ) ).show();
							filesInsert.click( function() {
								addFiles(); // To take always the current list
							}).text( mw.msg( 'msu-insert-files' ) ).show();
						} else if ( galleryArray.length < 2 ) {
							galleryInsert.html( '' );
						}
						$( '<span/>' ).text( ' | ' ).appendTo( file.li );
						$( '<a/>' ).text( mw.msg('msu-insert-picture' ) ).click( function() {
							mw.toolbar.insertTags( '[[File:' + file.name + msuVars.imgParams + ']]', '', '', '' );
						}).appendTo( file.li );
					} else if ( file.group === 'mov' ) {
						$( '<span/>' ).text(' | ').appendTo( file.li );
						$( '<a/>' ).text( mw.msg( 'msu-insert-movie' ) ).click( function() {
							mw.toolbar.insertTags( '[[File:' + file.name + ']]', '', '', '' );
						}).appendTo( file.li );
					}
				}
		} catch( error ) {
			fileError( up, file, 'Error: ' + success.response.replace( /(<([^>]+)>)/ig, '' ) ); // Remove html tags
		}
		up.removeFile( file ); // For preventing a second upload afterwards
	});

	uploader.bind( 'UploadComplete', function( up, files ) {
		uploader.trigger( 'CheckFiles' ); // trigger --> state changed
		//startButton.hide();
	});

	uploader.bind( 'CheckFiles', function() {
		var fileLen = uploader.files.length;
		var galleryLen = galleryArray.length;
		var listLen = $( '#upload-list li' ).length;
		mw.log( 'files:' + fileLen + ' gallery:' + galleryLen + ' list: ' + listLen );

		if ( fileLen > 0 ) {
			bottomDiv.show();
			if ( fileLen === 1 ) {
				startButton.text( mw.msg( 'msu-upload-this' ) ).show();
			} else {
				startButton.text( mw.msg( 'msu-upload-all' ) ).show();
			}
			spacer1.show();
		} else { // 0 files in list
			startButton.hide();
			spacer1.hide();
		}

		if ( galleryLen >= 2 ) {
			spacer2.show();
			galleryInsert.show();
			spacer3.show();
			filesInsert.show();
			bottomDiv.show();
		} else {
			galleryInsert.hide();
			spacer2.hide();
		}

		if ( listLen > 0 ) {
			bottomDiv.show();
			cleanAll.text( mw.msg( 'msu-clean-all' ) ).click( function() {
				galleryArray.length = 0; // reset
				uploader.splice( 0, uploader.files.length );
				$( '#upload-list .file' ).hide( 'slow', function() {
					$(this).remove();
					$(this).hide(); // clear_all button
					galleryInsert.unbind( 'click' );
					bottomDiv.hide();
				});
				//uploader.trigger("CheckFiles", uploader);
			}).show();
		} else {
			bottomDiv.hide();
		}
		uploader.refresh(); // Reposition Flash/Silverlight
	});

	$( '#upload-files' ).click( function( event ) {
		uploader.start();
		event.preventDefault();
	});
	/*
	$( 'uploadfiles' ).onclick = function() {
		uploader.start();
		return false;
	};
	*/
	uploader.init();
}

$( function () {
	// Check if we are in edit mode and the required modules are available and then customize the toolbar
	if ( $.inArray( mw.config.get( 'wgAction' ), [ 'edit', 'submit' ] ) !== -1 ) {
	//mw.loader.using( 'user.options', function () {
		if ( mw.user.options.get( 'usebetatoolbar' ) ) {
			mw.loader.using( 'ext.wikiEditor.toolbar', function () {
				createUpload( true );
			});
		} else {
			createUpload( false );
		}
	//});
	}
});