MsUpload
========

Installation
------------
To install, add the following to your LocalSettings.php:

# Start------------------------MsUpload
# If necessary, adjust the global configuration:
$wgEnableWriteAPI = true; // Enable the API
$wgEnableUploads = true; // Enable uploads
$wgFileExtensions = array('png','gif','jpg','jpeg','doc','xls','mpp','pdf','ppt','tiff','bmp','docx', 'xlsx','pptx','ps','odt','ods','odp','odg');

# Then include the extension and set its configuration. The values shown below are the defaults:
require_once "$IP/extensions/MsUpload/MsUpload.php";
$wgMSU_useDragDrop = true;
$wgMSU_showAutoCat = true;
$wgMSU_checkAutoCat = true;
$wgMSU_imgParams = '';
$wgMSU_useMsLinks = false;
# Start------------------------MsUpload

Credits
-------
* Created by Martin Schwindl, msupload@ratin.de
* Updated, debugged and normalised by Luis Felipe Schenone (schenonef@gmail.com) in 2014
* Some icons by Yusuke Kamiyamane. All rights reserved. Licensed under a Creative Commons Attribution 3.0 License. http://p.yusukekamiyamane.com