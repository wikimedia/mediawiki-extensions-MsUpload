<?php

namespace MsUpload;

use EditPage;
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
		global $wgScriptPath, $wgMSU_useMsLinks, $wgMSU_showAutoCat, $wgMSU_checkAutoCat,
			$wgMSU_confirmReplace, $wgMSU_useDragDrop, $wgMSU_imgParams, $wgFileExtensions,
			$wgMSU_uploadsize, $wgMSU_flash_swf_url, $wgMSU_silverlight_xap_url;

		// Don't show the upload bar outside of wikitext pages (T267563)
		if ( $out->getWikiPage()->getContentModel() !== CONTENT_MODEL_WIKITEXT ) {
			return true;
		}

		$wgMSU_flash_swf_url = __DIR__ . '/../resources/plupload/Moxie.swf';
		$wgMSU_silverlight_xap_url = __DIR__ . '/../resources/plupload/Moxie.xap';

		$out->addJsConfigVars( [
			'wgFileExtensions' => array_values( array_unique( $wgFileExtensions ) )
		] );

		if ( $wgMSU_imgParams ) {
			$wgMSU_imgParams = '|' . $wgMSU_imgParams;
		}

		$msuVars = [
			'scriptPath' => $wgScriptPath,
			'flash_swf_url' => $wgMSU_flash_swf_url,
			'silverlight_xap_url' => $wgMSU_silverlight_xap_url,
			'useDragDrop' => $wgMSU_useDragDrop,
			'showAutoCat' => $wgMSU_showAutoCat,
			'checkAutoCat' => $wgMSU_checkAutoCat,
			'useMsLinks' => $wgMSU_useMsLinks,
			'confirmReplace' => $wgMSU_confirmReplace,
			'imgParams' => $wgMSU_imgParams,
			'uploadsize' => $wgMSU_uploadsize,
		];

		$out->addJsConfigVars( 'msuVars', $msuVars );
		$out->addModules( 'ext.MsUpload' );

		// @todo Figure out how to load this in a module without resource loader crashing.
		$out->addScriptFile(
			"$wgScriptPath/extensions/MsUpload/resources/plupload/plupload.full.min.js"
		);
		return true;
	}
}
