/* global plupload, moxie */
const MsUpload = {

	uploader: null,
	createUploader: function ( $textarea ) {
		MsUpload.$textarea = $textarea;
		MsUpload.config = mw.config.get( 'msuConfig' );

		// Define the GUI elements
		const $uploadDiv = $( '<div>' ).attr( 'id', 'msupload-div' );
		const $uploadContainer = $( '<div>' ).attr( { id: 'msupload-container', class: 'start-loading', title: mw.msg( 'msu-button-title' ) } );
		const $uploadButton = $( '<div>' ).attr( 'id', 'msupload-select' );
		const $statusDiv = $( '<div>' ).attr( 'id', 'msupload-status' ).hide();
		const $uploadList = $( '<ul>' ).attr( 'id', 'msupload-list' );
		const $bottomDiv = $( '<div>' ).attr( 'id', 'msupload-bottom' ).hide();
		const $startButton = $( '<a>' ).attr( 'id', 'msupload-files' ).hide();
		const $cleanAll = $( '<a>' ).attr( 'id', 'msupload-clean-all' ).text( mw.msg( 'msu-clean-all' ) ).hide();
		const $galleryInsert = $( '<a>' ).attr( 'id', 'msupload-insert-gallery' ).hide();
		const $filesInsert = $( '<a>' ).attr( 'id', 'msupload-insert-files' ).hide();
		const $linksInsert = $( '<a>' ).attr( 'id', 'msupload-insert-links' ).hide();
		const $uploadDrop = $( '<div>' ).attr( 'id', 'msupload-dropzone' ).hide();

		// Add them to the DOM
		$bottomDiv.append( $startButton, $cleanAll, $galleryInsert, $filesInsert, $linksInsert );
		$uploadDiv.append( $statusDiv, $uploadDrop, $uploadList, $bottomDiv );
		$( '#wikiEditor-ui-toolbar' ).after( $uploadDiv );
		$uploadContainer.append( $uploadButton );
		$( '#wikiEditor-section-main .group-insert' ).append( $uploadContainer );

		// Create the Uploader object
		MsUpload.uploader = new plupload.Uploader( {
			runtimes: 'html5,flash,silverlight,html4',
			browse_button: 'msupload-select',
			container: 'msupload-container',
			max_file_size: MsUpload.config.uploadsize,
			drop_element: 'msupload-dropzone',
			url: mw.config.get( 'wgScriptPath' ) + '/api.php',
			flash_swf_url: MsUpload.config.flash_swf_url,
			silverlight_xap_url: MsUpload.config.silverlight_xap_url
		} );

		// Bind events
		MsUpload.uploader.bind( 'PostInit', MsUpload.onPostInit );
		MsUpload.uploader.bind( 'FilesAdded', MsUpload.onFilesAdded );
		MsUpload.uploader.bind( 'QueueChanged', MsUpload.onQueueChanged );
		MsUpload.uploader.bind( 'StateChanged', MsUpload.onStateChanged );
		MsUpload.uploader.bind( 'FilesRemoved', MsUpload.onFilesRemoved );
		MsUpload.uploader.bind( 'BeforeUpload', MsUpload.onBeforeUpload );
		MsUpload.uploader.bind( 'UploadProgress', MsUpload.onUploadProgress );
		MsUpload.uploader.bind( 'Error', MsUpload.onError );
		MsUpload.uploader.bind( 'FileUploaded', MsUpload.onFileUploaded );
		MsUpload.uploader.bind( 'CheckFiles', MsUpload.onCheckFiles );
		MsUpload.uploader.bind( 'UploadComplete', MsUpload.onCheckFiles );

		// Handle upload good request
		$startButton.on( 'click', function ( event ) {
			if ( this.text === mw.msg( 'msu-upload-good' ) ) {
				for ( const file of MsUpload.uploader.files ) {
					if ( typeof file.li.unconfirmed !== 'undefined' && file.li.unconfirmed !== false ) {
						MsUpload.uploader.removeFile( file );
						$( '#' + file.id ).hide( 'fast', function () {
							$( this ).remove();
						} );
					}
				}
				MsUpload.countUnconfirmed( MsUpload.uploader );
			}
			MsUpload.uploader.start();
			event.preventDefault();
		} );

		// Initialize
		MsUpload.uploader.init();
	},

	fileError: function ( uploader, file, errorText ) {
		file.li.warning.text( errorText );
		file.li.addClass( 'yellow' );
		file.li.type.addClass( 'error' );
		file.li.on( 'click', () => { // Remove li at click
			file.li.fadeOut( 'fast', function () {
				$( this ).remove();
				uploader.trigger( 'CheckFiles' );
			} );
		} );
	},

	galleryArray: [],
	insertGallery: function () {
		const galleryText = 'File:' + MsUpload.galleryArray.join( '\nFile:' );
		MsUpload.insertText( '<gallery>\n' + galleryText + '\n</gallery>\n' );
	},

	filesArray: [],
	insertFiles: function () {
		MsUpload.insertText( '[[File:' + MsUpload.filesArray.join( ']]\n[[File:' ) + ']]\n' );
	},

	insertLinks: function () {
		if ( MsUpload.config.useMsLinks === true ) {
			MsUpload.insertText( '*{{#l:' + MsUpload.filesArray.join( '}}\n*{{#l:' ) + '}}\n' );
		} else {
			MsUpload.insertText( '*[[:File:' + MsUpload.filesArray.join( ']]\n*[[:File:' ) + ']]\n' );
		}
	},

	/**
	 * Add text to selection in the main textarea.
	 *
	 * @param {string} text
	 */
	insertText: function ( text ) {
		MsUpload.$textarea.textSelection( 'encapsulateSelection', { pre: text } );
	},

	unconfirmedReplacements: 0,
	countUnconfirmed: function ( uploader ) {
		let count = 0;
		for ( const file of uploader.files ) {
			if ( file.li.unconfirmed ) {
				count++;
			}
		}
		MsUpload.unconfirmedReplacements = count;
	},

	warningText: function ( fileItem, warning, uploader ) {
		switch ( warning ) {
			case '':
			case '&nbsp;':
			case '&#160;':
				$( fileItem.warning ).empty()
					.siblings( '.file-name' ).show()
					.siblings( '.file-name-input' ).hide()
					.siblings( '.file-extension' ).hide();
				break;

			case 'Error: Unknown result from API':
			case 'Error: Request failed':
				$( fileItem.warning ).text( warning );
				break;

			default:
				// IMPORTANT! The code below assumes that every warning not captured by the code above is about a file being replaced
				$( fileItem.warning ).html( warning );

				// We break when the particular warning when a file name starts with IMG
				if ( warning.indexOf( 'The name of the file you are uploading begins with' ) === 0 ) {
					break; // When the file name starts with "IMG", MediaWiki issues this warning. Display it and continue.
				}
				if ( warning.indexOf( 'Der Dateiname beginnt mit' ) === 0 ) {
					break; // Make it work for German too. Must be done this way because the error response doesn't include an error code.
				}

				// When hovering over the link to the file about to be replaced, show the thumbnail
				$( fileItem.warning ).find( 'a' ).on( 'mouseover', () => {
					$( fileItem.warning ).find( 'figure, div.thumb' ).show();
				} ).on( 'mouseout', () => {
					$( fileItem.warning ).find( 'figure, div.thumb' ).hide();
				} );

				/**
				 * If a file with the same name already exists, add a checkbox to confirm the replacement
				 * This checkbox will also appear when the file name differs only in the file extension
				 * so the confirmation message must be kept generic enough
				 */
				if ( MsUpload.config.confirmReplace ) {
					fileItem.unconfirmed = true;

					const $title = $( fileItem.warning ).siblings( '.file-name' );

					const $checkbox = $( '<input>' ).attr( 'type', 'checkbox' ).on( 'click', function () {
						if ( $( this ).is( ':checked' ) ) {
							$title.show().next().hide();
							fileItem.unconfirmed = false;
						} else {
							$title.hide().next().show().select();
							fileItem.unconfirmed = true;
						}
						uploader.trigger( 'CheckFiles' );
					} );
					$( '<label>' ).append( $checkbox ).append( mw.message( 'msu-continue' ).escaped() ).appendTo( fileItem.warning );
				}
				break;
		}
		uploader.trigger( 'CheckFiles' );
		fileItem.loading.hide();
	},

	checkUploadWarning: function ( filename, fileItem, uploader ) {
		$.ajax( {
			url: mw.util.wikiScript( 'api' ), dataType: 'json', type: 'POST',
			data: {
				format: 'json',
				formatversion: 2,
				action: 'query',
				titles: 'File:' + filename,
				prop: 'imageinfo',
				iiprop: 'uploadwarning'
			}, success: function ( data ) {
				if ( data && data.query && data.query.pages ) {
					const message = data.query.pages[ 0 ].imageinfo[ 0 ].html;
					MsUpload.warningText( fileItem, message, uploader ); // Pass on the warning message
				} else {
					MsUpload.warningText( fileItem, 'Error: Unknown result from API', uploader );
				}
			}, error: function () {
				MsUpload.warningText( fileItem, 'Error: Request failed', uploader );
			}
		} );
	},

	build: function ( file, uploader ) {

		// Show auto-category (AutoCat) checkbox?
		if ( MsUpload.config.showAutoCat && mw.config.get( 'wgCanonicalNamespace' ) === 'Category' ) {
			file.cat = MsUpload.config.checkAutoCat; // Predefined
			$( '<input>' ).attr( {
				class: 'msupload-check-index',
				type: 'checkbox',
				checked: file.cat
			} ).on( 'change', function () {
				file.cat = this.checked; // Save
			} ).insertBefore( file.li.warning );

			$( '<span>' ).attr( 'class', 'msupload-check-span' ).text( mw.config.get( 'wgPageName' ).replace( /_/g, ' ' ) ).insertBefore( file.li.warning );
		}

		// Insert an input field for changing the file title
		const $fileNameInput = $( '<input>' ).attr( {
			class: 'file-name-input',
			size: file.name.length,
			name: 'filename',
			value: file.name.slice( 0, Math.max( 0, file.name.length - file.extension.length - 1 ) )
		} ).on( 'change', function () {
			file.name = this.value + '.' + file.extension;
			$( this ).prev().text( file.name );
			file.li.unconfirmed = false;
			MsUpload.countUnconfirmed( uploader );
			MsUpload.checkUploadWarning( this.value, file.li, uploader );
		} ).on( 'keydown', function ( event ) {
			// For convenience, when pressing enter, save the new title
			if ( event.keyCode === 13 ) {
				$( this ).trigger( 'change' );
				event.preventDefault();
			}
		} ).hide().insertAfter( file.li.title );

		const $fileExtension = $( '<span>' ).addClass( 'file-extension' ).text( '.' + file.extension ).hide().insertAfter( $fileNameInput );

		file.li.title.on( 'click', () => {
			file.li.title.hide();
			$fileNameInput.show().select();
			$fileExtension.show();
		} );

		// Insert the progress bar
		const progressState = $( '<span>' ).addClass( 'file-progress-state' );
		file.li.children().first().after( progressState );
	},

	checkExtension: function ( file, uploader ) {
		mw.log( file );

		file.li.loading.show();
		file.extension = file.name.split( '.' ).pop().toLowerCase();

		const fileExtensions = mw.config.get( 'wgFileExtensions' );
		if ( fileExtensions.indexOf( file.extension ) !== -1 ) {
			switch ( file.extension ) {
				case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'tif': case 'tiff':
					file.group = 'image';
					try {
						const image = new moxie.image.Image();
						image.onload = function () {
							this.embed( file.li.type.get( 0 ), {
								width: 30,
								height: 30,
								crop: true
							} );
						};
						image.load( file.getSource() );
						file.li.type.addClass( 'file-load' );
					} catch ( event ) {
						file.li.type.addClass( 'image' );
					}
					break;

				case 'mov': case 'avi':
					file.group = 'video';
					file.li.type.addClass( 'video' );
					break;

				case 'pdf':
					file.li.type.addClass( 'pdf' );
					break;
			}
			MsUpload.checkUploadWarning( file.name, file.li, uploader );

			file.li.cancel = $( '<span>' ).attr( { class: 'file-cancel', title: mw.msg( 'msu-cancel-upload' ) } );
			file.li.cancel.on( 'click', () => {
				uploader.removeFile( file );
				if ( file.group === 'image' ) {
					const index = MsUpload.galleryArray.indexOf( file.name );
					if ( index !== -1 ) {
						MsUpload.galleryArray.splice( index, 1 );
					}
					uploader.trigger( 'CheckFiles' );
				}
				file.li.fadeOut( 'fast', () => {
					$( this ).remove();
					uploader.trigger( 'CheckFiles' );
				} );
			} );
			file.li.prepend( file.li.cancel );

			MsUpload.build( file, uploader );
		} else { // Wrong datatype
			file.li.loading.hide( 'fast', () => {
				uploader.removeFile( file );
				uploader.refresh();
			} );
			MsUpload.fileError( uploader, file, mw.msg( 'msu-ext-not-allowed', mw.config.get( 'wgFileExtensions' ).length ) + ' ' + mw.config.get( 'wgFileExtensions' ).join( ',' ) );
		}
	},

	cleanAll: function () {
		MsUpload.unconfirmedReplacements = 0;
		MsUpload.galleryArray.length = 0; // Reset
		MsUpload.uploader.splice( 0, MsUpload.uploader.files.length );
		$( '#msupload-list .file' ).hide( 'fast', function () {
			$( this ).remove();
			$( '#msupload-insert-gallery' ).off( 'click' );
			$( '#msupload-bottom' ).hide();
		} );
	},

	onPostInit: function ( uploader ) {
		mw.log( 'MsUpload DEBUG: runtime: ' + uploader.runtime + ' features: ' + JSON.stringify( uploader.features ) );
		$( '#msupload-container' ).removeClass( 'start-loading' );
		if ( uploader.features.dragdrop && MsUpload.config.useDragDrop ) {
			$( '#msupload-dropzone' ).text( mw.msg( 'msu-dropzone' ) ).show();
			$( '#msupload-dropzone' ).on( 'dragover', function () {
				$( this ).addClass( 'drop-over' ).css( 'padding', 20 );
			} ).on( 'dragleave', function () {
				$( this ).removeClass( 'drop-over' ).css( 'padding', 0 );
			} ).on( 'drop', function () {
				$( this ).removeClass( 'drop-over' ).css( 'padding', 0 );
			} );
		} else {
			$( '#msupload-div' ).addClass( 'nodragdrop' );
		}
	},

	editComment: null,
	onFilesAdded: function ( uploader, files ) {
		if ( !MsUpload.editComment ) {
			// Prefer content language rather than user language for the edit comment
			const contentLanguage = mw.config.get( 'wgContentLanguage' );
			new mw.Api().getMessages( 'msu-comment', { amlang: contentLanguage } ).done( ( data ) => {
				if ( data[ 'msu-comment' ] ) {
					MsUpload.editComment = data[ 'msu-comment' ];
				}
			} );
		}

		files.forEach( ( file, index ) => {
			// iOS6 by SLBoat
			if ( ( navigator.platform === 'iPad' || navigator.platform === 'iPhone' ) ) {
				if ( file.name.indexOf( 'image' ) !== -1 && file.name.length < 11 ) {
					const date = new Date();
					const fileNameApple = navigator.platform + '_image_' + date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '-' + date.getTime(); // Because each image is named 'image.jpg' in iOS6
					file.name = fileNameApple + '_' + index + '.' + file.name.split( '.' ).pop(); // image_Y-M-D_0.jpg
				}
			}
			file.li = $( '<li>' ).attr( 'id', file.id ).addClass( 'file' ).appendTo( $( '#msupload-list' ) );
			file.li.type = $( '<span>' ).addClass( 'file-type' ).appendTo( file.li );
			file.li.title = $( '<span>' ).addClass( 'file-name' ).text( file.name ).appendTo( file.li );
			file.li.size = $( '<span>' ).addClass( 'file-size' ).text( plupload.formatSize( file.size ) ).appendTo( file.li );
			file.li.loading = $( '<span>' ).addClass( 'file-loading' ).appendTo( file.li );
			file.li.warning = $( '<span>' ).addClass( 'file-warning' ).appendTo( file.li );
			MsUpload.checkExtension( file, uploader );
		} );
		uploader.refresh(); // Reposition Flash/Silverlight
		uploader.trigger( 'CheckFiles' );
	},

	onQueueChanged: function ( uploader ) {
		uploader.trigger( 'CheckFiles' );
	},

	onStateChanged: function ( uploader ) {
		mw.log( uploader.state );
		if ( uploader.files.length === ( uploader.total.uploaded + uploader.total.failed ) ) {
			// mw.log( 'State: ' + uploader.files.length ) // All files uploaded
		}
	},

	onFilesRemoved: function ( /* uploader, files */ ) {
		mw.log( 'Files removed' );
		// uploader.trigger( 'CheckFiles' );
	},

	onBeforeUpload: function ( uploader, file ) {
		let editComment = MsUpload.editComment || mw.message( 'msu-comment' ).plain();
		file.li.title.text( file.name ).show(); // Show title
		$( '#' + file.id + ' .file-name-input' ).hide(); // Hide the file name input
		$( '#' + file.id + ' .file-extension' ).hide(); // Hide the file extension
		// Add auto-category (AutoCat) to the edit-comment if requested and we're in a Category page.
		if ( file.cat && mw.config.get( 'wgCanonicalNamespace' ) === 'Category' ) {
			// wgPageName already includes the 'Category:' prefix.
			editComment += '\n\n[[' + mw.config.get( 'wgPageName' ) + ']]';
		}
		uploader.setOption( 'multipart_params', {
			format: 'json',
			action: 'upload',
			filename: file.name,
			ignorewarnings: true,
			comment: editComment,
			token: mw.user.tokens.get( 'csrfToken' )
		} ); // Set multipart_params
		$( '#' + file.id + ' .file-progress-state' ).text( '0%' );
	},

	onUploadProgress: function ( uploader, file ) {
		$( '#' + file.id + ' .file-progress-state' ).text( file.percent + '%' );
	},

	onError: function ( uploader, error ) {
		mw.log( error );
		$( '#' + error.file.id + ' .file-warning' ).html(
			'Error ' + error.code + ', ' + error.message + ( error.file ? ', File: ' + error.file.name : '' )
		);
		$( '#msupload-status' ).append( error.message );
		uploader.refresh(); // Reposition Flash/Silverlight
	},

	onFileUploaded: function ( uploader, file, success ) {
		mw.log( success );
		file.li.title.off( 'click' );
		file.li.title.off( 'mouseover' );
		$( '#' + file.id + ' .file-cancel' ).fadeOut( 'fast' );
		$( '#' + file.id + ' .file-progress-state' ).fadeOut( 'fast' );

		try {
			const result = JSON.parse( success.response );
			if ( result.error ) {
				MsUpload.fileError( uploader, file, result.error.info );
			} else {
				file.li.type.addClass( 'ok' );
				file.li.addClass( 'green' );
				file.li.warning.fadeOut( 'fast' );

				$( '<a>' ).text( mw.msg( 'msu-insert-link' ) ).on( 'click', () => {
					if ( MsUpload.config.useMsLinks === true ) {
						MsUpload.insertText( '{{#l:' + file.name + '}}' ); // Insert link
					} else {
						MsUpload.insertText( '[[:File:' + file.name + ']]' ); // Insert link
					}
				} ).appendTo( file.li );
				if ( file.group === 'image' ) {
					MsUpload.galleryArray.push( file.name );
					if ( MsUpload.galleryArray.length === 2 ) { // Bind click function only the first time
						$( '#msupload-insert-gallery' ).on( 'click', MsUpload.insertGallery ).text( mw.msg( 'msu-insert-gallery' ) ).show();
					}
					$( '<span>' ).text( ' | ' ).appendTo( file.li );
					$( '<a>' ).text( mw.msg( 'msu-insert-image' ) ).on( 'click', () => {
						MsUpload.insertText( '[[File:' + file.name + '|' + MsUpload.config.imgParams + ']]' );
					} ).appendTo( file.li );
				} else if ( file.group === 'video' ) {
					$( '<span>' ).text( ' | ' ).appendTo( file.li );
					$( '<a>' ).text( mw.msg( 'msu-insert-video' ) ).on( 'click', () => {
						MsUpload.insertText( '[[File:' + file.name + ']]' );
					} ).appendTo( file.li );
				}
				MsUpload.filesArray.push( file.name );
				if ( MsUpload.filesArray.length === 2 ) { // Bind click function only the first time
					$( '#msupload-insert-files' ).on( 'click', MsUpload.insertFiles ).text( mw.msg( 'msu-insert-files' ) ).show();
					$( '#msupload-insert-links' ).on( 'click', MsUpload.insertLinks ).text( mw.msg( 'msu-insert-links' ) ).show();
				}
			}
		} catch ( error ) {
			let message = success.response.replace( /(<([^>]+)>)/ig, '' ); // Remove html tags
			if ( message.length > 999 ) {
				message = 'Unknown error.';
			}
			MsUpload.fileError( uploader, file, 'Error: ' + message );
		}
		uploader.removeFile( file ); // For preventing a second upload afterwards
	},

	onCheckFiles: function ( uploader ) {
		MsUpload.countUnconfirmed( uploader );
		const filesLength = uploader.files.length;
		const listLength = $( '#msupload-list li' ).length;
		mw.log( 'files: ' + filesLength + ', gallery: ' + MsUpload.galleryArray.length + ', list: ' + listLength + ', unconfirmed: ' + MsUpload.unconfirmedReplacements );

		let showUpload = false;
		let uploadMsg = '';
		// Show Upload This File when only one file and its confirmed
		if ( filesLength === 1 && MsUpload.unconfirmedReplacements === 0 ) {
			showUpload = true;
			uploadMsg = mw.msg( 'msu-upload-this' );
		}

		if ( filesLength > 1 ) {
			// Show Upload All Files when more than one file and all are confirmed
			if ( MsUpload.unconfirmedReplacements === 0 ) {
				showUpload = true;
				uploadMsg = mw.msg( 'msu-upload-all' );
			}

			// Show Upload Good Files when there are a mix of good and unconfirmed files
			if ( filesLength > MsUpload.unconfirmedReplacements && MsUpload.unconfirmedReplacements !== 0 ) {
				showUpload = true;
				uploadMsg = mw.msg( 'msu-upload-good', filesLength - MsUpload.unconfirmedReplacements, filesLength );
			}
		}

		if ( showUpload ) {
			$( '#msupload-bottom' ).show();
			$( '#msupload-files' ).text( uploadMsg ).show();
		} else {
			$( '#msupload-files' ).hide();
		}

		if ( MsUpload.filesArray.length > 1 ) {
			$( '#msupload-insert-files' ).show();
			$( '#msupload-insert-links' ).show();
		} else {
			$( '#msupload-insert-files' ).hide();
			$( '#msupload-insert-links' ).hide();
		}

		if ( MsUpload.galleryArray.length > 1 ) {
			$( '#msupload-insert-gallery' ).show();
			$( '#msupload-bottom' ).show();
		} else {
			$( '#msupload-insert-gallery' ).hide();
		}

		if ( listLength ) {
			$( '#msupload-bottom' ).show();
			$( '#msupload-clean-all' ).text( mw.msg( 'msu-clean-all' ) ).on( 'click', MsUpload.cleanAll ).show();
		} else {
			$( '#msupload-bottom' ).hide();
		}
		uploader.refresh(); // Reposition Flash/Silverlight
	}
};

mw.hook( 'wikiEditor.toolbarReady' ).add( MsUpload.createUploader );
