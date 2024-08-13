<?php

namespace MsUpload;

use EditPage;
use MediaWiki\MediaWikiServices;
use OutputPage;

class Hooks {

	/**
	 * Main Function
	 *
	 * @param EditPage $editPage
	 * @param OutputPage $out
	 * @return bool
	 */
	public static function onEditPageShowEditFormInitial( EditPage $editPage, OutputPage $out ) {
		global $wgFileExtensions, $wgExtensionAssetsPath;

		// Check if the page is editable
		$title = $out->getTitle();
		if ( $title->isSpecialPage() ) {
			return true;
		}

		// Only show the upload bar in wikitext pages (T267563)
		$services = MediaWikiServices::getInstance();
		$wikiPage = $services->getWikiPageFactory()->newFromTitle( $title );
		$contentModel = $wikiPage->getContentModel();
		if ( $contentModel !== CONTENT_MODEL_WIKITEXT ) {
			return true;
		}

		// Add some general config that we'll need
		$out->addJsConfigVars( 'wgFileExtensions', $wgFileExtensions );

		// Add extension-specific config that we'll need
		$config = $out->getConfig();
		$msuConfig = [
			'flash_swf_url' => __DIR__ . '/../resources/plupload/Moxie.swf',
			'silverlight_xap_url' => __DIR__ . '/../resources/plupload/Moxie.xap',
			'useDragDrop' => $config->get( 'MSU_useDragDrop' ),
			'showAutoCat' => $config->get( 'MSU_showAutoCat' ),
			'checkAutoCat' => $config->get( 'MSU_checkAutoCat' ),
			'useMsLinks' => $config->get( 'MSU_useMsLinks' ),
			'confirmReplace' => $config->get( 'MSU_confirmReplace' ),
			'imgParams' => $config->get( 'MSU_imgParams' ),
			'uploadsize' => $config->get( 'MSU_uploadsize' ),
		];
		$out->addJsConfigVars( 'msuConfig', $msuConfig );

		// Add the extension module
		$out->addModules( 'ext.MsUpload' );

		// @todo Figure out how to load this in a module without resource loader crashing
		$out->addScriptFile( "$wgExtensionAssetsPath/MsUpload/resources/plupload/plupload.full.min.js" );

		return true;
	}
}
