<template>
    <div class="container">
        <div class="row small-padding">
            <div class="col-md-12">
                <h2>Upload a new data source</h2>
            </div>
            <div class="col-md-12">
                <div class="resumable-drop" ref="drop">
                    Drop files here to upload or
                    <a class="resumable-browse" ref="browse">
                        <u>select from your computer</u>
                    </a>
                    <br/>
                    <small>Each file will create a new data source with default parameters (you will be able to change them later).</small>
                </div>
            </div>
            <div class="resumable-progress col-md-12">
                <table v-if="showProgress">
                    <tr>
                        <td width="100%"><div class="progress-container"><div class="progress-bar" ref="progress"></div></div></td>
                        <td class="progress-text" nowrap="nowrap"></td>
                        <td class="progress-pause" nowrap="nowrap">
                            <a href="#" @click.prevent="resume" class="progress-resume-link" v-if="showResume"><span class="fa fa-2x fa-play"></span></a>
                            <a href="#" @click.prevent="pause" class="progress-pause-link" v-if="showPause"><span class="fa fa-2x fa-pause"></span></a>
                        </td>
                    </tr>
                </table>
            </div>
            <div v-if="resumableList.length" >
                <h3>Uploading log</h3>
                <table class="table table-bordered table-stripped" v-if="resumableList.length > 0">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Message</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="fileInfo in resumableList" v-bind:ref="'resumable-file-' + fileInfo.file.uniqueIdentifier" :class="fileStatus(fileInfo)">
                            <td>{{fileInfo.file.fileName}}</td>
                            <td>
                                {{fileInfo.message.message}}
                            </td>
                            <td>
                                <span class="resumable-file-progress">{{Math.floor(100*fileInfo.file.progress()) }}%</span>
                            </td>
                        </li>
                    </tbody>
                </ul>
            </div>
        </div>
    </div>
</template>
<style>
.resumable-browse {
    cursor: pointer;
}
.resumable-progress {
    height: 20px;
}
.resumable-error {font-size:14px; font-style:italic;}
.resumable-drop {
    background-color:#eee; 
    border:2px dashed #aaa; 
    border-radius:10px; 
    color:#666; 
    font-size:20px; 
    font-weight:bold;
    padding:50px; 
    margin-top:40px; 
    text-align:center; 
    z-index:9999; 
}
.resumable-list {overflow:auto; margin-right:-20px;}
.resumable-dragover {padding:30px; color:#555; background-color:#ddd; border:1px solid #999;}
/* Uploader: Progress bar */
.resumable-progress {margin:30px 0 30px 0; width:100%;}
.progress-container {height:7px; background:#9CBD94; position:relative; }
.progress-bar {position:absolute; top:0; left:0; bottom:0; background:#45913A; width:0;}
.progress-text {font-size:11px; line-height:9px; padding-left:10px;}
.progress-pause {padding:0 0 0 7px;}
</style>
<script>
    import Vue from 'vue';
    import Resumable from 'resumablejs';
    import { standUrl, tahitiUrl, authToken, caipirinhaUrl, limoneroUrl } from '../config';
    const DataSourceUploadComponent = Vue.extend({
        store,
        mounted: function () {
            let selfComponent = this;
            let resumable = new Resumable({
                target: `${limoneroUrl}/datasources/upload?token=${authToken}`,
                chunkSize: 1*1024*1024,
                simultaneousUploads: 1,
                testChunks: true,
                throttleProgressCallbacks: 1,
                method: "octet",
                query: selfComponent.extraParams,
                permanentErrors:[400, 401, 404, 415, 500, 501],
                chunkRetryInterval: 5000,
            });
            selfComponent.resumable = resumable;
            selfComponent.supported = resumable.support;
            if (selfComponent.supported) {
                resumable.assignDrop(selfComponent.$refs.drop);
                resumable.assignBrowse(selfComponent.$refs.browse);
            }

            let getFileRef = (file) => {
                return selfComponent.resumableList.filter(
                    (f) => f.file.uniqueIdentifier === file.uniqueIdentifier)[0];
            };
            // Handle file add event
            resumable.on('fileAdded', (file) =>{
                // Show progress pabr
                selfComponent.showProgress = true;
                // Show pause, hide resume
                selfComponent.showPause = true;
                selfComponent.showResume = false;
                // Add the file to the list
                selfComponent.resumableList.splice(0, 0,
                    {file, done: false, progress: '0', message: ''});
                // Actually start the upload
                resumable.upload();
            });
            resumable.on('pause', () =>{
                // Show resume, hide pause
                selfComponent.showResume = true;
                selfComponent.showPause = false;
            });
            resumable.on('complete', () =>{
                // Hide pause/resume when the upload has completed
                selfComponent.showPause = false;
                selfComponent.showResume = false;
                selfComponent.showProgress = false;
            });
            resumable.on('fileSuccess', (file,message) =>{
                // Reflect that the file upload has completed
                let fileRef = getFileRef(file);
                fileRef.done = true;
            });
             resumable.on('error', (message, file) =>{
                let fileRef = getFileRef(file);
                fileRef.message = JSON.parse(message);
                selfComponent.showPause = false;
                selfComponent.showProgress = false;
            });
            resumable.on('fileError', (file, message) =>{
                let fileRef = getFileRef(file);
                fileRef.message = JSON.parse(message);
                selfComponent.showPause = false;
                selfComponent.showProgress = false;
            });
            resumable.on('fileProgress', (file) =>{
                // Handle progress for both the file and the overall upload
                let fileRef = getFileRef(file);
                fileRef.progress = Math.floor(file.progress()*100) + '%';
                selfComponent.showProgress = true;
                if (selfComponent.$refs.progress){
                    selfComponent.$refs.progress.style.width = Math.floor(resumable.progress()*100) + '%';
                }
            });
        },
        ready() {
            console.log(this.$refs);
        },
        components: {
        },
        /* Data */
        data() {
            return {
                supported: true,
                showProgress: false,
                showPause: false,
                showResume: false,
                resumableList: [],
            };
        },
        /* Methods */
        methods: {
            fileStatus(fileInfo) {
                return fileInfo.message.status !== undefined && 
                    fileInfo.message.status.toLowerCase() === 'error' ? 'danger' : 'success'
            },
            extraParams(){
                return {'storage_id': 1};
            },
            performLoad() {

            },
            pause(){
                this.resumable.pause();
                return false;
            },
            resume(){
                this.resumable.upload(); 
                this.showResume = false;
                this.showPause = true;
                return false;
            },
        },
        mixins: [],
    });
    export default DataSourceUploadComponent;
</script>