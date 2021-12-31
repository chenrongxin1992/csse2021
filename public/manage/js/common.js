		
$(function(){
    setTimeout(function(){
        $(".selectpage").each(function(){
            //$(this).after("<span class='additem' url='"+$(this).attr('addurl')+"'>+</span>")
            $(this).selectPage({
                showField : $(this).attr('showField'),
                keyField :  $(this).attr('keyField'),
                data : $(this).attr('url'),
                params : {},
                //ajax请求后服务端返回的数据格式处理
                //返回的数据里必须包含list（Array）和totalRow（number|string）两个节点
                eAjaxSuccess : function(d){
                    console.log(d)
                    return d.data;
                }
            });
        });

        $(".input-box").each(function(){
            var showField = $(this).children('.wx-input').attr("showField")
            var keyField = $(this).children('.wx-input').attr("keyField")
            let that = this
            $.ajax({
                url: $(this).children('.wx-input').attr("url"),
                data: {pageSize:10000},
                type: "POST",
                dataType: 'json',
                success: function(re) {
                    if(re.code == 0 ){
                        console.log(showField)
                        console.log(keyField)
                        re.data.list.map(d=>{
                            d.name = d[showField]
                            d.value = d[keyField]
                            return d
                        })
                        $(that).wxSelect({
                            data:re.data.list
                        });
                    }
                }
            });
            
        });
    },1000)
    layui.use(['jquery','layer','form','layedit','upload','laydate'], function(){ 
    //图标上传
	let worduploadrender = layui.upload.render({
	    elem: '#wordimport'
        //本地与服务器
	     ,url: './wordupload'
       // ,url:'https://mashu.shubiao.store/index/index/upload'
		,accept:"file"
        ,exts: 'docx'
	    ,before: function(obj){
			console.log('try......')
			layer.msg('上传中...', {
                icon: 16,
                shade: 0.01,
                time: 0
            })
	    }
	    ,done: function(res){
			layer.close(layer.msg());//关闭上传提示窗口
	        console.log('upload success',res)
            layer.msg('上传成功')
            if(CKEDITOR.instances[$("#wordimport").attr('toid')])
                CKEDITOR.instances.pageContent.setData(res.data)
	       //上传成功
	    }
	    ,error: function(err,info){
	      layer.msg('上传失败，请联系CRX')
	    }
	  });
    })


    
})

function InitImgCropping(clickid,showid,ratio=1/1,callback){
    var htmlstr = ''
     +' <div style="display: none" class="tailoring-container">'
     +'    <div class="black-cloth" onclick="closeTailor(this)"></div>'
     +'   <div class="tailoring-content">'
     +'           <div class="tailoring-content-one">'
     +'               <label title="上传图片" for="chooseImg" class="crop-btn choose-btn">'
     +'                   <input type="file" accept="image/jpg,image/jpeg,image/png" name="file" id="chooseImg" class="hidden" onchange="selectImg(this)">'
     +'                   选择图片'
     +'               </label>'
     +'               <div class="close-tailoring"  onclick="closeTailor(this)">×</div>'
     +'            </div>'
     +'            <div class="tailoring-content-two">'
     +'                <div class="tailoring-box-parcel">'
     +'                    <img id="tailoringImg">'
     +'                </div>'
     +'               <div class="preview-box-parcel">'
     +'                    <p>图片预览：</p>'
     +'                    <div class="square previewImg"></div>'
     +'                    <div class="circular previewImg"></div>'
     +'                </div>'
     +'            </div>'
     +'            <div class="tailoring-content-three">'
     +'                <button class="crop-btn cropper-reset-btn">复位</button>'
     +'               <button class="crop-btn cropper-rotate-btn">旋转</button>'
     +'                <button class="crop-btn cropper-scaleX-btn">换向</button>'
     +'                <button class="crop-btn sureCut" id="sureCut">确定</button>'
     +'            </div>'
     +'        </div>'
     +'</div>'
     $("body").append(htmlstr)
     //弹出图片裁剪框
     //$("#uploadarea").attr("type",'file');

     $("#"+clickid).unbind().bind("click",function () {
         $("#sureCut").attr("imgid",showid);
         $(".tailoring-container").toggle();
     });
     
     //cropper图片裁剪
     $('#tailoringImg').cropper({
         aspectRatio: ratio,//默认比例
         preview: '.previewImg',//预览视图
         guides: true,  //裁剪框的虚线(九宫格)
         autoCropArea: 1,  //0-1之间的数值，定义自动剪裁区域的大小，默认0.8
         movable: true, //是否允许移动图片
         dragCrop: true,  //是否允许移除当前的剪裁框，并通过拖动来新建一个剪裁框区域
         movable: true,  //是否允许移动剪裁框
         resizable: true,  //是否允许改变裁剪框的大小
         zoomable: true,  //是否允许缩放图片大小
         mouseWheelZoom: true,  //是否允许通过鼠标滚轮来缩放图片
         touchDragZoom: true,  //是否允许通过触摸移动来缩放图片
         rotatable: true,  //是否允许旋转图片
         crop: function(e) {
             // 输出结果数据裁剪图像。
         }
     });
     //旋转
     $(".cropper-rotate-btn").on("click",function () {
         $('#tailoringImg').cropper("rotate", 45);
     });
     //复位
     $(".cropper-reset-btn").on("click",function () {
         $('#tailoringImg').cropper("reset");
     });
     //换向
     var flagX = true;
     $(".cropper-scaleX-btn").on("click",function () {
         if(flagX){
             $('#tailoringImg').cropper("scaleX", -1);
             flagX = false;
         }else{
             $('#tailoringImg').cropper("scaleX", 1);
             flagX = true;
         }
         flagX != flagX;
     });

     //裁剪后的处理
     $("#sureCut").unbind().bind("click",function () {
         var thisid  =$(this).attr("imgid");
         if ($("#tailoringImg").attr("src") == null ){
             closeTailor();
             return false;
         }else{
             var cas = $('#tailoringImg').cropper('getCroppedCanvas');//获取被裁剪后的canvas
             var base64url = cas.toDataURL('image/png'); //转换为base64地址形式
             $("#finalImg").prop("src",base64url);//显示为图片的形式
             closeTailor();
             imagesAjax(thisid,base64url,callback);
             //关闭裁剪框
             
         }
     });
     
 }

//图像上传
function selectImg(file) {
    if (!file.files || !file.files[0]){
        return;
    }
    var reader = new FileReader();
    reader.onload = function (evt) {
        var replaceSrc = evt.target.result;
        //更换cropper的图片
        $('#tailoringImg').cropper('replace', replaceSrc,false);//默认false，适应高度，不失真
    }
    reader.readAsDataURL(file.files[0]);
}

//关闭裁剪框
function closeTailor() {
    $(".tailoring-container").toggle();
}

function imagesAjax(id,src,callback) {
    var data = {};
    data.image = src;
    data.type = 'data';
    //data.jid = $('#jid').val();
    var url = "./base64upload";
    url = url+"?&tm="+new Date().getTime();
    $.ajax({
        url: url,
        data: data,
        type: "POST",
        dataType: 'json',
        success: function(re) {
            callback(re)
        }
    });
}

async function translate(file) {
    const ext = '.html'
    const inputPath = path.join(__dirname, '/resources/example.docx');
    const outputPath = path.join(__dirname, `/example${ext}`);

    // Read file
    const docxBuf = await fs.readFile(file);

    // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
    let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);
    
    // Here in done you have pdf file which you can save or transfer in another stream
    await fs.writeFile(outputPath, pdfBuf);
}

function AddTab(title,id,url){
    id = id+''+new Date().getTime()
    layui.use(['jquery','table','form','element'], function(){ 
        let $ = layui.$ //重点处
        let element = parent.layui.element
        let openTitle =  '<i class="layui-icon">' + "&#xe66c;" + '</i>'+'<cite>' + title+ '</cite>';
        openTitle += '<i class="layui-icon layui-unselect layui-tab-close" data-id="' + id + '">&#x1006;</i>';
		element.tabAdd("bodyTab", {
			title: openTitle,
			content: "<iframe src='" + url + "' data-id='" + id + "'></frame>",
			id: id
		})
		element.tabChange('bodyTab', id);
    });
}

function DeleteTab(id){
    id = id+''+new Date().getTime()
    layui.use(['jquery','table','form','element'], function(){ 
        let $ = layui.$ //重点处
        let element = parent.layui.element
        element.tabDelete("bodyTab",id).init();
    });
}


