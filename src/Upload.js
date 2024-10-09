import './Upload.css'
import {useEffect, useState} from "react";
import pdf from './icons/PDF.svg'
import word from './icons/word.svg'
import txt from './icons/txt.svg'
import other from './icons/other.svg'
import deleteIcon from './icons/delete.svg'
import success from './icons/success.svg'
import fail from './icons/fail.svg'
import uploading from './icons/uploading.svg'
import {Button, Message, Popover} from "@arco-design/web-react";

const Upload=()=>{
    const [text,setText]=useState('拖拽文件到此处上传') //上传文件区域文字提醒
    const [ifDragOver,setIfDragOver]=useState(false)//是否正在区域上方拖拽文件，用以控制区域css样式
    const [ifUpload,setIfUpload]=useState(false)//是否正在上传文件
    const [progressWidth,setProgressWith]=useState(0) //模拟已上传进度条的进度
    const [progressId,setProgressId]=useState(null)//存储定时器id

    //初始数据
    const [fileList,setFileList]=useState([])

    //对ifUpload进行监听，从而修改拖拽区域的提示文字
    useEffect(()=>{
        if(ifUpload) {
            setText('文件上传中...')
        } else {
            setText('拖拽文件到此处上传')
        }
    },[ifUpload])

    //返回文件类型对应的图片
    function getImageType(value){
        switch (value){
            case 'pdf': return pdf;
            case 'doc': return word;
            case 'docx': return word;
            case 'txt': return txt;
            default : return other
        }
    }

    //生成文件的随机编号。采用过1,2,3,4...为文件编号，但测试时有几率出现bug：删除一个文件时会同时删除另一个文件，猜测是编号原因。于是采用随机编号方式修复bug。
    //基于年月日时分秒+随机数生成随机编号
    function randomID() {
        const now = new Date()
        let month = now.getMonth() + 1
        let day = now.getDate()
        let hour = now.getHours()
        let minutes = now.getMinutes()
        let seconds = now.getSeconds()
        return now.getFullYear().toString() + month.toString() + day + hour + minutes + seconds + (Math.round(Math.random() * 1000000)).toString();
    }

    //上传文件的回调函数
    function uploadFile(e){
        let uploadFileLength=0 //此次有效上传的文件数量

        //对上传的文件数组循环
        for (let i=0;i<e.dataTransfer.items.length;i++){
            // 获取文件
            const item=e.dataTransfer.items[i].getAsFile()

            //通过带后缀名的文件名字获取不带后缀名的文件名字、文件类型、文件大小
            const fileName=item.name.substring(0,item.name.indexOf('.'))
            const fileType=item.name.substring(item.name.indexOf('.')+1,item.name.length)
            const fileSize=(item.size/1024).toFixed(2)+'kb'

            //判断当前文件类型是否支持上传，若不支持跳到下一次循环
            if(fileType!=='pdf'&&fileType!=='docx'&&fileType!=='doc'&&fileType!=='txt'){
                Message.error({
                    closable: true,
                    duration: 10000,
                    content:`暂不支持 ${fileName+'.'+fileType}（${fileType}类型） 此类文件上传`
                })
                continue
            }

            //判断当前文件是否过大，若过大跳到下一次循环
            if(item.size/1024>1024){
                Message.error({
                    closable: true,
                    duration: 10000,
                    content:`文件 ${fileName+'.'+fileType} 超出指定大小，无法上传！(此文件为${fileSize}，最大为1024kb)`
                })
                continue
            }

            setIfUpload(true) //表示本次有文件上传
            uploadFileLength+=1//此次有效上传的文件数量+1
            //更新数组
            fileList.push({
                id: randomID(),
                name: fileName.toString(),
                type: fileType.toString(),
                size: fileSize.toString(),
                state:0.5 //0.5表示正在上传状态
            })
        }
        setFileList(fileList)//重新渲染界面,先展示上传时文件的状态为上传中

        //模拟上传进度条的变化与上传状态
        let currentProgress = 0;
        setProgressWith(0)
        //采用定时器模拟进度条变化
        let tempProgressId=setInterval(()=>{
            setProgressId(tempProgressId)
            currentProgress += 1;//进度条+1
            //上传完成时，修改文件状态并提示用户
            if (currentProgress > 100) {
                //对上传的文件数组循环，修改状态为成功上传或失败上传
                for (let i=fileList.length-uploadFileLength;i<fileList.length;i++){
                    fileList[i].state=Math.random()<0.4?0:1  //0表示失败，1表示成功
                }
                // setFileList(fileList)//重新渲染界面，展示最终上传文件的状态

                Message.info({
                    closable: true,
                    duration: 5000,
                    content:'上传完毕！'
                })
                clearInterval(tempProgressId)//清除定时器
                setIfUpload(false)//上传完毕
                setProgressWith(0)//进度条归零
            }

            setProgressWith(currentProgress);
        },100)
    }

    function cancelUpload(){
        //对上传的文件数组循环，过滤出正在上传的文件
        setFileList(fileList.filter(item=>item.state!==0.5))//重新渲染界面，展示已上传文件
        Message.error({
            closable: true,
            duration: 5000,
            content:'已取消上传！'
        })
        clearInterval(progressId)//清除定时器
        setIfUpload(false)//取消上传
        setProgressWith(0)//进度条归零
    }

    return (
        <div className={'container'}>
            {/*拖拽文件上传区域*/}
            <div
                className={ifDragOver?'dragAreaDragging':'dragArea'}

                // 拖拽文件在上传区域上方移动时的事件
                onDragOver={(e)=>{
                    e.preventDefault()
                    setIfDragOver(true)
                    if(!ifUpload) setText('释放文件')
                }}

                // 拖拽文件离开上传区域上方时的事件
                onDragLeave={(e)=>{
                    e.preventDefault()
                    setIfDragOver(false)
                    if(!ifUpload) setText('拖拽文件到此处上传')
                }}

                // 在上传区域上方释放拖拽文件时的事件
                onDrop={(e)=>{
                    setIfDragOver(false)
                    e.preventDefault()
                    e.stopPropagation()
                    if (ifUpload){
                        Message.error('当前正在上传文件，请此次上传完毕后再进行上传！')
                    } else {
                        uploadFile(e)
                    }
                }}
            >
                <div>
                    <p>{text}</p>
                    {
                        ifUpload?
                            <>
                                <br/>
                                {/*模拟上传进度条*/}
                                <div className={'progress-container'}>
                                    <div
                                        className={'progress-bar'}
                                        style={{width:`${progressWidth}%`}}
                                    />
                                </div>
                                <div
                                    style={{fontSize:'1.5vw'}}
                                >
                                    {progressWidth}%
                                </div>
                                {/*取消上传*/}
                                <Button
                                    status={'danger'}
                                    style={{marginLeft:'20vw'}}
                                    onClick={cancelUpload}
                                >
                                    取消上传
                                </Button>
                            </>
                            :
                            null
                    }
                </div>
            </div>

            {/*展示已上传文件区域*/}
            <div className={'text'}>
                <h3>已上传列表</h3>
            </div>
            <div className={'fileArea'}>
                {/*已上传文件以卡片列表展示*/}
                {
                    //对文件列表进行循环，返回每一个文件的卡片
                    fileList.map((value, index) => {
                        return  (
                            // 鼠标悬浮在卡片上时的文字气泡提示
                            <Popover
                                title={value.name+'.'+value.type+' , '+value.size}
                            >
                                {/*文件卡片*/}
                                <div className="file-info" key={index}>
                                    {/*右上角的删除文件图标*/}
                                    <img
                                        alt={'deleteIcon'}
                                        src={deleteIcon}
                                        className={'deleteIcon'}
                                        onClick={()=>{
                                            //删除某一项文件
                                            setFileList(fileList.filter(item=>item.id!==value.id))
                                        }}
                                    />

                                    {/*左边的文件类型对应的类型图片*/}
                                    <div className={'file-type'}>
                                        <img
                                            alt={'type'}
                                            src={getImageType(value.type)}
                                            style={{width:'100%',height:'100%'}}
                                        />
                                    </div>

                                    {/*中间的文件名字、文件类型与文件大小，名字过长时溢出部分用省略号展示*/}
                                    <div className={'file-text'}>
                                        <div style={{fontSize:'0.9vw',fontWeight:'bold',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                            {value.name}
                                        </div>
                                        <div style={{fontSize:'0.9vw',color:'grey'}}>
                                            {value.type} , {value.size}
                                        </div>
                                    </div>

                                    {/*右边的文件上传的状态*/}
                                    <div className={'file-state'}>
                                        <img
                                            alt={'state'}
                                            src={value.state===1?success:value.state===0.5?uploading:fail}
                                            style={{width:'60%',height:'60%'}}
                                        />
                                    </div>
                                </div>
                            </Popover>
                        )
                    })
                }
            </div>
    </div>
    )
}

export default Upload