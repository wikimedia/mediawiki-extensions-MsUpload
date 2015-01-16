<?php

$wgExtensionCredits['parserhook'][] = array(
	'name' => 'MsUpload',
	'url' => 'http://www.mediawiki.org/wiki/Extension:MsUpload',
	'version' => '10.0',
	'descriptionmsg' => 'msu-desc',
	'license-name' => 'GPL-2.0+',
	'author' => array( '[mailto:wiki@ratin.de Martin Schwindl]', '[mailto:wiki@keyler-consult.de Martin Keyler]', '[https://www.mediawiki.org/wiki/User:Luis_Felipe_Schenone Luis Felipe Schenone]' ),
);

$wgResourceModules['ext.MsUpload'] = array(
	'scripts' => array(
		'plupload/plupload.full.min.js',
		'MsUpload.js'
	),
	'dependencies' => 'jquery.ui.progressbar',
	'styles' => 'MsUpload.css',
	'messages' => array(
		'msu-description',
		'msu-button-title',
		'msu-insert-link',
		'msu-insert-gallery',
		'msu-insert-files',
		'msu-insert-links',
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

// Default configuration
$wgMSU_useDragDrop = true;
$wgMSU_showAutoCat = true;
$wgMSU_checkAutoCat = true;
$wgMSU_imgParams = '400px';
$wgMSU_useMsLinks = false;