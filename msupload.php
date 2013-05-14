<?php
############################################################
#Author:
#Martin Schwindl, msupload@ratin.de
#
#Icons: 
#Some icons by Yusuke Kamiyamane. All rights reserved. Licensed under a Creative Commons Attribution 3.0 License.
#http://p.yusukekamiyamane.com
#
#Usage:
#LocalSettings.php:
#
##Start --------------------------------------- MsUpload
##if necessary
##$wgEnableWriteAPI = true; //API
##$wgEnableUploads = true; // Enable uploads
##$wgFileExtensions = array('png','gif','jpg','jpeg','doc','xls','mpp','pdf','ppt','tiff','bmp','docx', 'xlsx', 'pptx','ps','odt','ods','odp','odg');
#
#$wgMSU_ShowAutoKat = true;     #autokategorisierung
#$wgMSU_CheckedAutoKat = true;  #checkbox: checked = true/false
#$wgMSU_debug = false;
#$wgMSU_ImgParams = "400px";	
#require_once("$IP/extensions/MsUpload/msupload.php");
##End  --------------------------------------- MsUpload
#
#
############################################################
# Setup and Hooks for the MsUpload extension
if( !defined( 'MEDIAWIKI' ) ) {
 	echo( "This file is an extension to the MediaWiki software and cannot be used standalone.\n" );
 	die( 1 );
}

## Register extension setup hook and credits:
$wgExtensionCredits['parserhook'][] = array(
	'name' => 'MsUpload',
	'url'  => 'http://www.mediawiki.org/wiki/Extension:MsUpload',
	'descriptionmsg' => 'msu-desc',
	'version' => '9.5.1',
	'author' => '[mailto:msupload@ratin.de info@ratin.de] | [http://www.ratin.de/msupload.html Ratin]',
);

$dir = dirname(__FILE__).'/';
//$wgAvailableRights[] = 'msupload';
$wgExtensionMessagesFiles['msu'] = $dir . 'msupload.i18n.php';

$wgHooks['EditPage::showEditForm:initial'][] = 'MSLSetup';
require_once($dir.'msupload.body.php');

$wgResourceModules['ext.MsUpload'] = array(
        'scripts' => array( 'js/plupload/plupload.full.min.js', 'js/msupload.js' ),
        'styles' => array( 'css/msupload.css' ),
        'messages' => array( 'msu-description', 'msu-button_title', 'msu-insert_link', 'msu-insert_gallery', 'msu-insert_picture', 'msu-insert_movie', 'msu-cancel_upload', 'msu-clean_all', 'msu-upload_possible', 'msu-ext_not_allowed', 'msu-upload_this', 'msu-upload_all', 'msu-dropzone', 'msu-comment' ),
        'dependencies' => array( 'jquery.ui.progressbar' ),
        'localBasePath' => dirname( __FILE__ ),
        'remoteExtPath' => 'MsUpload'
);

 
function MSLSetup() {

  global $wgOut, $wgScriptPath, $wgJsMimeType, $wgMSL_FileTypes;
  $path =  $wgScriptPath.'/extensions/MsUpload';
  //load module
  $wgOut->addModules( 'ext.MsUpload' );
  
  global $wgMSU_ShowAutoKat, $wgMSU_AutoIndex, $wgMSU_CheckedAutoKat, $wgMSU_debug, $wgMSU_ImgParams, $wgMSU_UseDragDrop;

  $use_MsLinks = 'false';
  if(isset($wgMSL_FileTypes)) $use_MsLinks = 'true'; //check whether the extension MsLinks is installed
  if(!is_null($wgMSU_ImgParams)) $wgMSU_ImgParams = '|'.$wgMSU_ImgParams; //default image params
    
	$msu_vars = array(
		'path' => $path,
    	'use_mslinks' => $use_MsLinks,
    	'autoKat' => $wgMSU_ShowAutoKat,
    	'autoIndex' => 'false', #$wgMSU_AutoIndex;
		'autoChecked' => $wgMSU_CheckedAutoKat,
		'debugMode' => $wgMSU_debug,
		'imgParams' => $wgMSU_ImgParams,
		'dragdrop' => $wgMSU_UseDragDrop
	);

	$msu_vars = json_encode($msu_vars);
	$wgOut->addScript( "<script type=\"{$wgJsMimeType}\">var msu_vars = $msu_vars;</script>\n" );

  return true;
}