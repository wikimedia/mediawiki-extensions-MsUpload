<?php

$wgExtensionCredits['parserhook'][] = array(
	'name' => 'MsUpload',
	'url' => 'http://www.mediawiki.org/wiki/Extension:MsUpload',
	'version' => 10,
	'license-name' => 'GPLv2+',
	'author' => array( '[mailto:msupload@ratin.de Martin Schwindl]', '[https://www.mediawiki.org/wiki/User:Luis_Felipe_Schenone Luis Felipe Schenone]' ),
	'descriptionmsg' => 'msu-desc',
);

$wgResourceModules['ext.MsUpload'] = array(
	'scripts' => array(
		'plupload/plupload.full.min.js',
		'MsUpload.js'
	),
	'dependencies' => 'jquery.ui.progressbar',
	'styles' => 'MsUpload.css',
	'messages' => array(
		'msu-desc',
		'msu-button-title',
		'msu-insert-link',
		'msu-insert-gallery',
		'msu-insert-files',
		'msu-insert-picture',
		'msu-insert-movie',
		'msu-cancel-upload',
		'msu-clean-all',
		'msu-upload-possible',
		'msu-ext-not-allowed',
		'msu-upload-this',
		'msu-upload-all',
		'msu-dropzone',
		'msu-comment',
	),
	'localBasePath' => __DIR__,
	'remoteExtPath' => 'MsUpload',
);

$wgExtensionMessagesFiles['MsUpload'] = __DIR__ . '/MsUpload.i18n.php';
$wgMessagesDirs['MsUpload'] = __DIR__ . '/i18n';

$wgAutoloadClasses['MsUpload'] = __DIR__ . '/MsUpload.body.php';

$wgHooks['EditPage::showEditForm:initial'][] = 'MsUpload::start';

$wgAjaxExportList[] = 'MsUpload::saveCat';

//Configuration defaults
$wgMSU_useDragDrop = true;
$wgMSU_showAutoCat = true;
$wgMSU_checkAutoCat = true;
$wgMSU_imgParams = '';
$wgMSU_useMsLinks = false;