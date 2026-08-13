<?php

namespace MediaWiki\Extension\MsUpload;

use MediaWiki\Config\Config;
use MediaWiki\Hook\EditPage__showEditForm_initialHook;
use MediaWiki\MainConfigNames;
use MediaWiki\Page\WikiPageFactory;

class Hooks implements EditPage__showEditForm_initialHook {

	public function __construct(
		private readonly Config $config,
		private readonly WikiPageFactory $wikiPageFactory,
	) {
	}

	/** @inheritDoc */
	public function onEditPage__showEditForm_initial( $editor, $out ) {
		// Check if the page is editable
		$title = $out->getTitle();
		if ( $title->isSpecialPage() ) {
			return true;
		}

		// Only show the upload bar in wikitext pages (T267563)
		$wikiPage = $this->wikiPageFactory->newFromTitle( $title );
		$contentModel = $wikiPage->getContentModel();
		if ( $contentModel !== CONTENT_MODEL_WIKITEXT ) {
			return true;
		}

		// Add extension-specific config that we'll need
		$config = $out->getConfig();
		$msuConfig = [
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
		$extensionAssetsPath = $this->config->get( MainConfigNames::ExtensionAssetsPath );
		$out->addScriptFile( "$extensionAssetsPath/MsUpload/resources/lib/plupload/plupload.full.min.js" );

		return true;
	}
}
