<?php

namespace MsUpload;

class Hooks {
	/**
	 * Main Function
	 *
	 * @return bool
	 */
	public static function start() {
		global $wgOut, $wgScriptPath, $wgMSU_useMsLinks, $wgMSU_showAutoCat, $wgMSU_checkAutoCat,
			$wgMSU_confirmReplace, $wgMSU_useDragDrop, $wgMSU_imgParams, $wgFileExtensions,
			$wgMSU_uploadsize, $wgMSU_flash_swf_url, $wgMSU_silverlight_xap_url;

		$wgMSU_flash_swf_url = __DIR__ . '/../resources/plupload/Moxie.swf';
		$wgMSU_silverlight_xap_url = __DIR__ . '/../resources/plupload/Moxie.xap';

		$wgOut->addJsConfigVars( [
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

		$wgOut->addJsConfigVars( 'msuVars', $msuVars );
		$wgOut->addModules( 'ext.MsUpload' );

		// @todo Figure out how to load this in a module without resource loader crashing.
		$wgOut->addScriptFile(
			"$wgScriptPath/extensions/MsUpload/resources/plupload/plupload.full.min.js"
		);
		return true;
	}
}
