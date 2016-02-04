<?php

class MsUpload {

	static function start() {
		global $wgOut, $wgScriptPath, $wgJsMimeType, $wgMSL_FileTypes, $wgMSU_useMsLinks, $wgMSU_showAutoCat, $wgMSU_autoIndex, $wgMSU_checkAutoCat, $wgMSU_confirmReplace, $wgMSU_useDragDrop, $wgMSU_imgParams, $wgFileExtensions;

		$wgOut->addModules( 'ext.MsUpload' );
		$wgOut->addJsConfigVars( array(
			'wgFileExtensions' => array_values( array_unique( $wgFileExtensions ) ),
		));

		if ( $wgMSU_imgParams ) {
			$wgMSU_imgParams = '|' . $wgMSU_imgParams;
		}

		$msuVars = array(
			'scriptPath' => $wgScriptPath,
			'useDragDrop' => $wgMSU_useDragDrop,
			'showAutoCat' => $wgMSU_showAutoCat,
			'checkAutoCat' => $wgMSU_checkAutoCat,
			'useMsLinks' => $wgMSU_useMsLinks,
			'confirmReplace' => $wgMSU_confirmReplace,
			'imgParams' => $wgMSU_imgParams,
		);

		$msuVars = json_encode( $msuVars );
		$wgOut->addScript( "<script type=\"$wgJsMimeType\">window.msuVars = $msuVars;</script>\n" );

		return true;
	}

	static function saveCat( $filename, $category ) {
        global $wgContLang, $wgUser;
		$mediaString = strtolower( $wgContLang->getNsText( NS_FILE ) );
		$title = $mediaString . ':' . $filename;
		$text = "\n[[" . $category . "]]";
		$wgEnableWriteAPI = true;    
		$params = new FauxRequest(array (
			'action' => 'edit',
			'section'=> 'new',
			'title' =>  $title,
			'text' => $text,
			'token' => $wgUser->editToken(),//$token."%2B%5C",
		), true, $_SESSION );
		$enableWrite = true;
		$api = new ApiMain( $params, $enableWrite );
		$api->execute();
		if ( defined( 'ApiResult::META_CONTENT' ) ) {
			$data = $api->getResult()->getResultData();
		} else {
			$data = &$api->getResultData();
		}
		return $mediaString;

/* The code below does the same and is better, but for some reason it doesn't update the categorylinks table, so it's no good
		global $wgContLang, $wgUser;
		$title = Title::newFromText( $filename, NS_FILE );
		$page = new WikiPage( $title );
		$text = $page->getText();
		$text .= "\n\n[[" . $category . "]]";
		$summary = wfMessage( 'msu-comment' );
		$status = $page->doEditContent( $text, $summary, EDIT_UPDATE, false, $wgUser );
		$value = $status->value;
		$revision = $value['revision'];
		$page->doEditUpdates( $revision, $wgUser );
		return true;
*/
	}
}
