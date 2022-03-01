CKEDITOR.editorConfig = function( config ) {
  config.toolbarGroups = [
		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
		{ name: 'forms', groups: [ 'forms' ] },
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'links', groups: [ 'links' ] },
		{ name: 'insert', groups: [ 'insert' ] },
		{ name: 'tools', groups: [ 'tools' ] },
		{ name: 'paragraph', groups: [ 'indent', 'list', 'outdent', 'blocks', 'align', 'bidi', 'paragraph' ] },
		{ name: 'styles', groups: [ 'styles' ] },
		{ name: 'colors', groups: [ 'colors' ] },
		'/',
		{ name: 'others', groups: [ 'others' ] },
		{ name: 'about', groups: [ 'image', 'about' ] }
	];
	config.removeButtons = 'About,NewPage,ExportPdf,Templates,Replace,Find,Scayt,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Language,Iframe,ShowBlocks';
	config.fontSize_sizes ='14/14px;16/16px;20/20px;28/28px;8/8px;9/9px;10/10px;11/11px;12/12px;18/18px;22/22px;24/24px;26/26px;36/36px;48/48px;72/72px';
	config.font_names = '微软雅黑/Microsoft YaHei;宋体/SimSun;新宋体/NSimSun;仿宋/FangSong;楷体/KaiTi;仿宋_GB2312/FangSong_GB2312;'+  
        '楷体_GB2312/KaiTi_GB2312;黑体/SimHei;华文细黑/STXihei;华文楷体/STKaiti;华文宋体/STSong;华文中宋/STZhongsong;'+  
        '华文仿宋/STFangsong;华文彩云/STCaiyun;华文琥珀/STHupo;华文隶书/STLiti;华文行楷/STXingkai;华文新魏/STXinwei;'+  
        '方正舒体/FZShuTi;方正姚体/FZYaoti;细明体/MingLiU;新细明体/PMingLiU;微软正黑/Microsoft JhengHei;'+  
        'Arial Black/Arial Black;'+ config.font_names;  
	//config.allowedContent = true
    config.extraPlugins = 'uploadimage,tableresize,contextmenu,lineheight'
	config.filebrowserImageUploadUrl ='./ckupload?'
	config.removePlugins = 'exportpdf';
	config.colorButton_colors = 'CCA84D,00923E,F8C100,28166F,000,800000,8B4513,2F4F4F,008080,000080,4B0082,696969,' +
    'B22222,A52A2A,DAA520,006400,40E0D0,0000CD,800080,808080,' +
    'F00,FF8C00,FFD700,008000,0FF,00F,EE82EE,A9A9A9,' +
    'FFA07A,FFA500,FFFF00,00FF00,AFEEEE,ADD8E6,DDA0DD,D3D3D3,' +
    'FFF0F5,FAEBD7,FFFFE0,F0FFF0,F0FFFF,F0F8FF,E6E6FA,FFF';
	//config.removeButtons = 'About,NewPage,ExportPdf,Preview,Templates,Replace,Find,Scayt,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Outdent,Blockquote,CreateDiv,BidiLtr,BidiRtl,Language,Anchor,SpecialChar,PageBreak,Iframe,Styles,ShowBlocks';
};
