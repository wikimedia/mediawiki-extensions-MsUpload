MsUpload
========

Installation
------------
To install MsUpload, add the following to your LocalSettings.php:

# If necessary, adjust the global configuration:
$wgEnableWriteAPI = true; // Enable the API
$wgEnableUploads = true; // Enable uploads
$wgFileExtensions = array('png','gif','jpg','jpeg','doc','xls','mpp','pdf','ppt','tiff','bmp','docx', 'xlsx','pptx','ps','odt','ods','odp','odg');
$wgAllowJavaUploads = true; // Solves problem with Office 2007 and newer files (docx, xlsx, etc.)

# Then include the extension and set its configuration. The values shown below are the defaults:
require_once "$IP/extensions/MsUpload/MsUpload.php";
$wgMSU_useDragDrop = true;
$wgMSU_showAutoCat = true;
$wgMSU_checkAutoCat = true;
$wgMSU_imgParams = '400px'; // Default 400px
$wgMSU_useMsLinks = false;

Credits
-------
* Developed and coded by Martin Schwindl (wiki@ratin.de)
* Idea, project management and bug fixing by Martin Keyler (wiki@keyler-consult.de)
* Updated, debugged and enhanced by Luis Felipe Schenone (schenonef@gmail.com)
* Some icons by Yusuke Kamiyamane (http://p.yusukekamiyamane.com). All rights reserved. Licensed under a Creative Commons Attribution 3.0 License.