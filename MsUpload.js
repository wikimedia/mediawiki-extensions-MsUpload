var $ = jQuery,
	mw = mediaWiki,
	msuVars = window.msuVars;

function fileError( uploader, file, errorText ) {
	file.li.warning.text( errorText );
	file.li.addClass( 'yellow' );
	file.li.type.addClass( 'error' );
	file.li.click( function () { // Remove li at click
		file.li.fadeOut( 'slow', function () {
	 		$( this ).remove();
	 		uploader.trigger( 'CheckFiles' );
	 	});
	});
}

var galleryArray = [];
function addGallery() {
	var galleryText = 'File:' + galleryArray.join( '\nFile:' );
	mw.toolbar.insertTags( '<gallery>\n' + galleryText + '\n</gallery>\n', '', '', '' );
}

var filesArray = [];
function addFiles() {
	mw.toolbar.insertTags( '[[File:' + filesArray.join( ']]\n[[File:' ) + ']]\n', '', '', '' );
}

function addLinks() {
	if ( msuVars.useMsLinks === true ) {
		mw.toolbar.insertTags( '*{{#l:' + filesArray.join( '}}\n*{{#l:' ) + '}}\n', '', '', '' );
	} else {
		mw.toolbar.insertTags( '*[[:File:' + filesArray.join( ']]\n*[[:File:' ) + ']]\n', '', '', '' );
	}
}

var unconfirmedReplacements = 0;
function warningText( fileItem, warning, uploader ) {
	switch ( warning ) {
		case '':
		case '&nbsp;':
		case '&#160;':
			$( fileItem.warning ).text( mw.msg( 'msu-upload-possible' ) );
			break;

		case 'Error: Unknown result from API':
		case 'Error: Request failed':
			$( fileItem.warning ).text( warning );
			break;

		default:
			// IMPORTANT! The code below assumes that every warning not captured by the code above is about a file being replaced
			$( fileItem.warning ).html( warning );

			// When hovering over the link to the file about to be replaced, show the thumbnail
			$( fileItem.warning ).find( 'a' ).mouseover( function () {
				$( fileItem.warning ).find( 'div.thumb' ).show();
			}).mouseout( function () {
				$( fileItem.warning ).find( 'div.thumb' ).hide();
			});

			// If a file with the same name already exists, add a checkbox to confirm the replacement
			if ( window.msuVars.confirmReplace === true ) {

				var title = $( fileItem.warning ).siblings( '.file-title' );

				var checkbox = $( '<input>' ).attr({ 'type': 'checkbox', 'checked': true }).click( function ( event ) {
					if ( $( this ).is( ':checked' ) ) {
						title.show().next().hide();
						unconfirmedReplacements--;
					} else {
						title.hide().next().show().select();
						unconfirmedReplacements++;
					}
					uploader.trigger( 'CheckFiles' );
				}).click();
				$( '<label>' ).append( checkbox ).append( mw.msg( 'msu-replace-file' ) ).appendTo( fileItem.warning );
			}
			break;
	}
	uploader.trigger( 'CheckFiles' );
	fileItem.loading.hide();
}

function checkUploadWarning( filename, fileItem, uploader ) {
	$.ajax({ url: mw.util.wikiScript( 'api' ), dataType: 'json', type: 'POST',
	data: {
		format: 'json',
		action: 'query',
		titles: 'File:' + filename,
		prop: 'imageinfo',
		iiprop: 'uploadwarning'
	}, success: function ( data ) {
		if ( data && data.query && data.query.pages ) {
			var pages = data.query.pages;
			$.each( pages, function ( index, val ) {
				warningText( fileItem, val.imageinfo[0].html, uploader ); // Pass on the warning message
				return false; // Break out
			});
		} else {
			warningText( fileItem, 'Error: Unknown result from API', uploader );
		}
	}, error: function () {
		warningText( fileItem, 'Error: Request failed', uploader );
	}});
}

function build( file, uploader ) {
	/* Fileindexer
	if ( autoIndex ) {
		new Element( 'input', {name:'fi['+file.id+']', 'class':'check-index',type: 'checkbox', 'checked': true} ).inject( file.ui.title, 'after' );
		new Element( 'span', {'class':'check-span',html: 'Index erstellen'} ).inject( file.ui.title, 'after' );
	}
	*/
	// Auto category
	if ( msuVars.showAutoCat && mw.config.get( 'wgNamespaceNumber' ) === 14 ) {
		file.cat = msuVars.checkAutoCat; // Predefine
		$( '<input>' ).attr({
			'class': 'check-index',
			'type': 'checkbox',
			'checked': file.cat
		}).change( function () {
			file.cat = this.checked; // Save
		}).appendTo( file.li );

		$( '<span>' ).attr( 'class', 'check-span' ).text( wgPageName.replace( /_/g, ' ' ) ).appendTo( file.li );
	}

	// Insert an input field for changing the file title
	var inputChange = $( '<input>' ).attr({
		//'id': 'input-change-' + file.id,
		'class':'input-change',
		'size': file.name.length,
		'name': 'filename',
		'value': file.name
	}).change( function () {
		file.name = this.value; // Save new name
		unconfirmedReplacements = 0; // Hack! If the user renames a file to avoid replacing it, this forces the Upload button to appear, but it also does when a user just renames a file that wasn't about to replace another
		checkUploadWarning( this.value, file.li, uploader );
	}).hide().insertAfter( file.li.title );

	file.li.title.click( function () {
		file.li.title.hide();
		inputChange.show().select();
	});

	// Insert the progress bar
	file.li.append( '<div class="file-progress"><div class="file-progress-bar"></div><span class="file-progress-state"></span></div>' );
}

function checkExtension( file, uploader ) {
	mw.log( file );

	file.li.loading.show();
	file.extension = file.name.split( '.' ).pop().toLowerCase();

	if ( $.inArray( file.extension, mw.config.get( 'wgFileExtensions' ) ) !== -1 ) {
		switch( file.extension ) {
			case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'tif': case 'tiff': // Pictures
				file.group = 'pic';
				//file.li.type.addClass( 'picture' );
				try { // Preview picture
					var image = new o.Image();
					image.onload = function () {
						// Embed the current thumbnail
						this.embed( file.li.type.get( 0 ), {
							width: 30,
							height: 40,
							crop: false
						});
						// Big thumbnail
						this.embed( file.li.type.get( 0 ), {
							width: 300,
							height: 300,
							crop: false
						});
					};
					image.load( file.getSource() );
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
		checkUploadWarning( file.name, file.li, uploader );

		file.li.cancel = $( '<span>' ).attr( 'title', mw.msg( 'msu-cancel-upload' ) ).click( function () {
			uploader.removeFile( file );
			if ( file.group === 'pic' ) {
				var index = jQuery.inArray( file.name, galleryArray ); // Find the index (indexOf not possible in IE8)
				if ( index !== -1 ) galleryArray.splice( index, 1 ); // Remove it if it's really found!
				uploader.trigger( 'CheckFiles' );
			}
			file.li.fadeOut( 'slow', function () {
				$( this ).remove();
				uploader.trigger( 'CheckFiles' );
			});
			//uploader.refresh();
		}).attr( 'class', 'file-cancel' ).appendTo( file.li );

		build( file, uploader );
	} else { // Wrong datatype
		file.li.loading.hide( 1, function () { // Create callback
			uploader.removeFile( file );
			uploader.refresh();
		});
		fileError( uploader, file, mw.msg(
			'msu-ext-not-allowed', mw.config.get( 'wgFileExtensions' ).length ) +
			' ' + mw.config.get( 'wgFileExtensions' ).join( ',' ) );
	}
}

function createUpload( wikiEditor ) {
	// Create upload button
	var uploadButton = $( '<div>' ).attr( 'id', 'upload-select' );
	var uploadContainer = $( '<div>' ).attr({
		'id': 'upload-container',
		'title': mw.msg( 'msu-button-title' ),
		'class': 'start-loading'
 	}).append( uploadButton );

	var uploadDiv = $( '<div>' ).attr( 'id', 'upload-div' );
	if ( wikiEditor === true ) {
		// Insert upload button
		var uploadTab = $( '<div>' ).attr( 'class', 'group' ).appendTo( '#wikiEditor-ui-toolbar .section-main' );
		uploadContainer.appendTo( uploadTab );
		// Create upload div
		uploadDiv.insertAfter( '#wikiEditor-ui-toolbar' );
		$( '#wikiEditor-ui-toolbar .tool .options' ).css( 'z-index', '2' ); // Headline dropdown
	} else { // Only standard editor
		uploadContainer.css( 'display', 'inline-block' ).css( 'vertical-align', 'middle' ).appendTo( '#toolbar' );
		uploadButton.addClass( 'old-button' );
		uploadDiv.insertAfter( '#toolbar' );
	}

	var statusDiv = $( '<div>' ).attr( 'id', 'upload-status' ).html( 'No runtime found.' ).appendTo( uploadDiv ).hide();
	var uploadList = $( '<ul>' ).attr( 'id', 'upload-list' ).appendTo( uploadDiv );
	var bottomDiv = $( '<div>' ).attr( 'id', 'upload-bottom' ).appendTo( uploadDiv ).hide();
	var startButton = $( '<a>' ).attr( 'id', 'upload-files' ).appendTo( bottomDiv ).hide();
	var spacer1 = $( '<span>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
	var cleanAll = $( '<a>' ).attr( 'id', 'cleanAll' ).text( mw.msg( 'msu-clean-all' ) ).appendTo( bottomDiv ).hide();
	var spacer2 = $( '<span>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
	var galleryInsert = $( '<a>' ).attr( 'id', 'gallery-insert' ).appendTo( bottomDiv ).hide();
	var spacer3 = $( '<span>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
	var filesInsert = $( '<a>' ).attr( 'id', 'files-insert' ).appendTo( bottomDiv ).hide();
	var spacer4 = $( '<span>' ).attr( 'class', 'spacer' ).appendTo( bottomDiv ).hide();
	var linksInsert = $( '<a>' ).attr( 'id', 'links-insert' ).appendTo( bottomDiv ).hide();
	var uploadDrop = $( '<div>' ).attr( 'id', 'upload-drop' ).insertAfter( statusDiv ).hide();

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

	uploader.bind( 'PostInit', function ( uploader ) {
		mw.log( 'MsUpload DEBUG: runtime: ' + uploader.runtime + ' features: ' + JSON.stringify( uploader.features ) );
		uploadContainer.removeClass( 'start-loading' );
		if ( uploader.features.dragdrop && msuVars.useDragDrop ) {
			uploadDrop.text( mw.msg( 'msu-dropzone' ) ).show();
			uploadDrop.bind( 'dragover',function () {
				 $( this ).addClass( 'drop-over' ).css( 'padding', '20px' );
			}).bind( 'dragleave',function () {
				 $( this ).removeClass( 'drop-over' ).css( 'padding', 0 );
			}).bind( 'drop',function () {
				 $( this ).removeClass( 'drop-over' ).css( 'padding', 0 );
			});
	 	} else {
	 		uploadDiv.addClass( 'nodragdrop' );
	 	}
	});

	uploader.bind( 'FilesAdded', function ( uploader, files ) {
		$.each( files, function ( i, file ) {
			// iOS6 by SLBoat
			if ( ( navigator.platform === 'iPad' || navigator.platform === 'iPhone' ) ) {
				if ( file.name.indexOf( 'image' ) !== -1 && file.name.length < 11 ) {
					var heute = new Date();
					var fileNameApple = navigator.platform + '_image_' + heute.getFullYear() + '-' + heute.getMonth() + '-' + heute.getDate() + '-' + heute.getTime(); // Because each image is named 'image.jpg' in iOS6
					file.name = fileNameApple + '_' + i + '.' + file.name.split( '.' ).pop(); // image_Y-M-D_0.jpg
				}
			}
			file.li = $( '<li>' ).attr( 'id',file.id ).attr( 'class', 'file' ).appendTo( uploadList );
			file.li.type = $( '<span>' ).attr( 'class', 'file-type' ).appendTo( file.li );
			file.li.title = $( '<span>' ).attr( 'class', 'file-title' ).text( file.name ).appendTo( file.li );
			file.li.size = $( '<span>' ).attr( 'class', 'file-size' ).text( plupload.formatSize( file.size ) ).appendTo( file.li );
			file.li.loading = $( '<span>' ).attr( 'class', 'file-loading' ).appendTo( file.li );
			file.li.warning = $( '<span>' ).attr( 'class', 'file-warning' ).appendTo( file.li );
			checkExtension( file, uploader );
		});
		uploader.refresh(); // Reposition Flash/Silverlight
		uploader.trigger( 'CheckFiles' );
	});

	uploader.bind( 'QueueChanged', function ( uploader ) {
		uploader.trigger( 'CheckFiles' );
	});

	uploader.bind( 'StateChanged', function ( uploader ) {
		mw.log( uploader.state );
		if ( uploader.files.length === ( uploader.total.uploaded + uploader.total.failed ) ) {
			//mw.log( 'State: ' + uploader.files.length ) // All files uploaded
		}
	});

	uploader.bind( 'FilesRemoved', function ( uploader, files ) {
		mw.log( 'Files removed' );
		//uploader.trigger( 'CheckFiles' );
	});

	uploader.bind( 'BeforeUpload', function ( uploader, file ) {
		file.li.title.text( file.name ).show(); // Show title
		$( '#' + file.id + ' input.input-change' ).hide(); // Hide input
		uploader.settings.multipart_params = {
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

	uploader.bind( 'UploadProgress', function ( uploader, file ) {
		$( '#' + file.id + ' span.file-progress-state' ).html( file.percent + '%' );
		$( '#' + file.id + ' div.file-progress-bar' ).progressbar({ 'value': file.percent });
		$( '#' + file.id + ' div.file-progress-bar .ui-progressbar-value' ).removeClass( 'ui-corner-left' );
	});

	uploader.bind( 'Error', function ( uploader, error ) {
		mw.log( error );
		$( '#' + error.file.id + ' span.file-warning' ).html(
			'Error: ' + error.code + ', Message: ' + error.message + ( error.file ? ', File: ' + error.file.name : '' )
		);
		statusDiv.append( error.message );
		uploader.refresh(); // Reposition Flash/Silverlight
	});

	uploader.bind( 'FileUploaded', function ( uploader, file, success ) {
		mw.log( success );
		file.li.title.unbind( 'click' );
		file.li.title.unbind( 'mouseover' );
		$( '#' + file.id + ' div.file-progress' ).fadeOut( 'slow' );
		$( '#' + file.id + ' div.file-progress-bar' ).fadeOut( 'slow' );
		$( '#' + file.id + ' span.file-xprogress-state' ).fadeOut( 'slow' );

		try {
			var result = jQuery.parseJSON( success.response );
			if ( result.error ) {
				fileError( uploader, file, result.error.info );
			} else {
				file.li.type.addClass( 'ok' );
				file.li.addClass( 'green' );
				file.li.warning.fadeOut( 'slow' );

				if ( file.cat && mw.config.get( 'wgNamespaceNumber' ) === 14 ) { // Should the categroy be set?
					$.get( mw.util.wikiScript(), {
						action: 'ajax',
						rs: 'MsUpload::saveCat',
						rsargs: [ file.name, wgPageName ]
					}, 'json' );
				}
				$( '<a>' ).text( mw.msg( 'msu-insert-link' ) ).click( function () {
					if ( msuVars.useMsLinks === true ) {
						mw.toolbar.insertTags( '{{#l:' + file.name + '}}', '', '', '' ); // Insert link
					} else {
						mw.toolbar.insertTags( '[[:File:' + file.name + ']]', '', '', '' ); // Insert link
					}
				}).appendTo( file.li );
				if ( file.group === 'pic' ) {
					galleryArray.push( file.name );
					if ( galleryArray.length === 2 ) { // Bind click function only the first time
						galleryInsert.click( addGallery ).text( mw.msg( 'msu-insert-gallery' ) ).show();
					}
					$( '<span>' ).text( ' | ' ).appendTo( file.li );
					$( '<a>' ).text( mw.msg('msu-insert-picture' ) ).click( function () {
						mw.toolbar.insertTags( '[[File:' + file.name + msuVars.imgParams + ']]', '', '', '' );
					}).appendTo( file.li );
				} else if ( file.group === 'mov' ) {
					$( '<span>' ).text(' | ').appendTo( file.li );
					$( '<a>' ).text( mw.msg( 'msu-insert-movie' ) ).click( function () {
						mw.toolbar.insertTags( '[[File:' + file.name + ']]', '', '', '' );
					}).appendTo( file.li );
				}
				filesArray.push( file.name );
				if ( filesArray.length === 2 ) { // Bind click function only the first time
					filesInsert.click( addFiles ).text( mw.msg( 'msu-insert-files' ) ).show();
					linksInsert.click( addLinks ).text( mw.msg( 'msu-insert-links' ) ).show();
				}
			}
		} catch( error ) {
			fileError( uploader, file, 'Error: ' + success.response.replace( /(<([^>]+)>)/ig, '' ) ); // Remove html tags
		}
		uploader.removeFile( file ); // For preventing a second upload afterwards
	});

	uploader.bind( 'UploadComplete', function ( uploader, files ) {
		uploader.trigger( 'CheckFiles' );
		//startButton.hide();
	});

	uploader.bind( 'CheckFiles', function () {
		var filesLength = uploader.files.length;
		var listLength = $( '#upload-list li' ).length;
		mw.log( 'files: ' + filesLength + ', gallery: ' + galleryArray.length + ', list: ' + listLength );

		if ( filesLength > 0 ) {
			bottomDiv.show();
			if ( filesLength === 1 ) {
				startButton.text( mw.msg( 'msu-upload-this' ) ).show();
			} else {
				startButton.text( mw.msg( 'msu-upload-all' ) ).show();
			}
			spacer1.show();
		} else { // 0 files in list
			startButton.hide();
			spacer1.hide();
		}

		if ( unconfirmedReplacements ) {
			startButton.hide();
			spacer1.hide();
		}

		if ( filesArray.length > 1 ) {
			filesInsert.show();
			spacer3.show();
			linksInsert.show();
			spacer4.show();
		} else {
			filesInsert.hide();
			spacer3.hide();
			linksInsert.hide();
			spacer4.hide();
		}

		if ( galleryArray.length > 1 ) {
			spacer2.show();
			galleryInsert.show();
			bottomDiv.show();
		} else {
			galleryInsert.hide();
			spacer2.hide();
		}

		if ( listLength > 0 ) {
			bottomDiv.show();
			cleanAll.text( mw.msg( 'msu-clean-all' ) ).click( function () {
				galleryArray.length = 0; // Reset
				uploader.splice( 0, uploader.files.length );
				$( '#upload-list .file' ).hide( 'slow', function () {
					$( this ).remove();
					$( this ).hide(); // clear_all button
					galleryInsert.unbind( 'click' );
					bottomDiv.hide();
				});
				//uploader.trigger( 'CheckFiles', uploader );
			}).show();
		} else {
			bottomDiv.hide();
		}
		uploader.refresh(); // Reposition Flash/Silverlight
	});

	$( '#upload-files' ).click( function ( event ) {
		uploader.start();
		event.preventDefault();
	});

	uploader.init();
}

$( function () {
	// Check if we are in edit mode and the required modules are available and then customize the toolbar
	if ( $.inArray( mw.config.get( 'wgAction' ), [ 'edit', 'submit' ] ) !== -1 ) {
		if ( mw.user.options.get( 'usebetatoolbar' ) ) {
			mw.loader.using( 'ext.wikiEditor.toolbar', function () {
				createUpload( true );
			});
		} else {
			createUpload( false );
		}
	}
});
