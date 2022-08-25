
<template>
  <div class="upload-tab">
    <button type="button" class="btn btn-danger float-right btn-is-option" @click.prevent="isOption = !isOption">
      <i class="fa fa-cog" aria-hidden="true"></i>
      Options
    </button>

    <div v-show="$refs.upload && $refs.upload.dropActive" class="drop-active">
      <h3>Drop files to upload</h3>
    </div>
    <div class="upload" v-show="!isOption">
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
          <tr>
            <th>#</th>
            <th>Thumb</th>
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="!files.length">
            <td colspan="9">
              <div class="text-center p-5">
                <h4>Drop files anywhere to upload<br/>or</h4>
                <label :for="name" class="btn btn-lg btn-primary">Select Files</label>
              </div>
            </td>
          </tr>
          <tr v-for="(file, index) in files" :key="file.id">
            <td>{{index}}</td>
            <td>
              <img class="td-image-thumb" v-if="file.thumb" :src="file.thumb" />
              <span v-else>No Image</span>
            </td>
            <td>
              <div class="filename">
                {{file.name}}
              </div>
              <div class="progress" v-if="file.active || file.progress !== '0.00'">
                <div :class="{'progress-bar': true, 'progress-bar-striped': true, 'bg-danger': file.error, 'progress-bar-animated': file.active}" role="progressbar" :style="{width: file.progress + '%'}">{{file.progress}}%</div>
              </div>
            </td>

            <td v-if="file.error">{{file.error}}</td>
            <td v-else-if="file.success">success</td>
            <td v-else-if="file.active">active</td>
            <td v-else></td>
            <td>
              <div class="btn-group">
                <button class="btn btn-secondary btn-sm dropdown-toggle" type="button">
                  Action
                </button>
                <div class="dropdown-menu">
                  <a :class="{'dropdown-item': true, disabled: file.active || file.success || file.error === 'compressing' || file.error === 'image parsing'}" href="#" @click.prevent="file.active || file.success || file.error === 'compressing' ? false :  onEditFileShow(file)">Edit</a>
                  <a :class="{'dropdown-item': true, disabled: !file.active}" href="#" @click.prevent="file.active ? $refs.upload.update(file, {error: 'cancel'}) : false">Cancel</a>

                  <a class="dropdown-item" href="#" v-if="file.active" @click.prevent="$refs.upload.update(file, {active: false})">Abort</a>
                  <a class="dropdown-item" href="#" v-else-if="file.error && file.error !== 'compressing' && file.error !== 'image parsing' && $refs.upload.features.html5" @click.prevent="$refs.upload.update(file, {active: true, error: '', progress: '0.00'})">Retry upload</a>
                  <a :class="{'dropdown-item': true, disabled: file.success || file.error === 'compressing' || file.error === 'image parsing'}" href="#" v-else @click.prevent="file.success || file.error === 'compressing' || file.error === 'image parsing' ? false : $refs.upload.update(file, {active: true})">Upload</a>

                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item" href="#" @click.prevent="$refs.upload.remove(file)">Remove</a>
                </div>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="example-foorer">
        <div class="footer-status float-right">
          Drop: {{$refs.upload ? $refs.upload.drop : false}},
          Active: {{$refs.upload ? $refs.upload.active : false}},
          Uploaded: {{$refs.upload ? $refs.upload.uploaded : true}},
          Drop active: {{$refs.upload ? $refs.upload.dropActive : false}}
        </div>
        <div class="btn-group">
          <file-upload
              class="btn btn-primary dropdown-toggle"
              :post-action="postAction"
              :custom-action="customAction"
              :extensions="extensions"
              :accept="accept"
              :multiple="multiple"
              :directory="directory"
              :create-directory="createDirectory"
              :size="size || 0"
              :thread="thread < 1 ? 1 : (thread > 5 ? 5 : thread)"
              :headers="headers"
              :data="data"
              :drop="drop"
              :drop-directory="dropDirectory"
              :add-index="addIndex"
              v-model="files"
              @input-filter="inputFilter"
              @input-file="inputFile"
              ref="upload">
            <i class="fa fa-plus"></i>
            Select
          </file-upload>
          <div class="dropdown-menu">
            <label class="dropdown-item" :for="name">Add files</label>
            <a class="dropdown-item" href="#" @click="onAddFolder">Add folder</a>
            <a class="dropdown-item" href="#" @click.prevent="addData.show = true">Add data</a>
          </div>
        </div>
        <button type="button" class="btn btn-success" v-if="!$refs.upload || !$refs.upload.active" @click.prevent="$refs.upload.active = true">
          <i class="fa fa-arrow-up" aria-hidden="true"></i>
          Start Upload
        </button>
        <button type="button" class="btn btn-danger"  v-else @click.prevent="$refs.upload.active = false">
          <i class="fa fa-stop" aria-hidden="true"></i>
          Stop Upload
        </button>
      </div>
    </div>





    <div class="option" v-show="isOption">
      <div class="form-group">
        <label for="accept">Accept:</label>
        <input type="text" id="accept" class="form-control" v-model="accept">
        <small class="form-text text-muted">Allow upload mime type</small>
      </div>
      <div class="form-group">
        <label for="extensions">Extensions:</label>
        <input type="text" id="extensions" class="form-control" v-model="extensions">
        <small class="form-text text-muted">Allow upload file extension</small>
      </div>
      <div class="form-group">
        <label>PUT Upload:</label>
        <div class="form-check">
          <label class="form-check-label">
            <input class="form-check-input" type="radio" name="put-action" id="put-action" value="" v-model="putAction"> Off
          </label>
        </div>
        <div class="form-check">
          <label class="form-check-label">
            <input class="form-check-input" type="radio" name="put-action" id="put-action" value="/upload/put" v-model="putAction"> On
          </label>
        </div>
        <small class="form-text text-muted">After the shutdown, use the POST method to upload</small>
      </div>
      <div class="form-group">
        <label for="thread">Thread:</label>
        <input type="number" max="5" min="1" id="thread" class="form-control" v-model.number="thread">
        <small class="form-text text-muted">Also upload the number of files at the same time (number of threads)</small>
      </div>
      <div class="form-group">
        <label for="size">Max size:</label>
        <input type="number" min="0" id="size" class="form-control" v-model.number="size">
      </div>
      <div class="form-group">
        <label for="minSize">Min size:</label>
        <input type="number" min="0" id="minSize" class="form-control" v-model.number="minSize">
      </div>

      <div class="form-group">
        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="add-index" class="form-check-input" v-model="addIndex"> Start position to add
          </label>
        </div>
        <small class="form-text text-muted">Add a file list to start the location to add</small>
      </div>

      <div class="form-group">
        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="drop" class="form-check-input" v-model="drop"> Drop
          </label>
        </div>
        <small class="form-text text-muted">Drag and drop upload</small>
      </div>
      <div class="form-group">
        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="drop-directory" class="form-check-input" v-model="dropDirectory"> Drop directory
          </label>
        </div>
        <small class="form-text text-muted">Not checked, filter the dragged folder</small>
      </div>
      <div class="form-group">
        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="create-directory" class="form-check-input" v-model="createDirectory"> Create Directory
          </label>
        </div>
        <small class="form-text text-muted">The directory file will send an upload request. The mime type is <code>text/directory</code></small>
      </div>
      <div class="form-group">
        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="upload-auto" class="form-check-input" v-model="uploadAuto"> Auto start
          </label>
        </div>
        <small class="form-text text-muted">Automatically activate upload</small>
      </div>
      <div class="form-group">
        <button type="button" class="btn btn-primary btn-lg btn-block" @click.prevent="isOption = !isOption">Confirm</button>
      </div>
    </div>





<!--    <div :class="{'modal-backdrop': true, 'fade': true, show: addData.show}"></div>-->
<!--    <div :class="{modal: true, fade: true, show: addData.show}" id="modal-add-data" tabindex="-1" role="dialog">-->
<!--      <div class="modal-dialog" role="document">-->
<!--        <div class="modal-content">-->
<!--          <div class="modal-header">-->
<!--            <h5 class="modal-title">Add data</h5>-->
<!--            <button type="button" class="close"  @click.prevent="addData.show = false">-->
<!--              <span>&times;</span>-->
<!--            </button>-->
<!--          </div>-->
<!--          <form @submit.prevent="onAddData">-->
<!--            <div class="modal-body">-->
<!--              <div class="form-group">-->
<!--                <label for="data-name">Name:</label>-->
<!--                <input type="text" class="form-control" required id="data-name"  placeholder="Please enter a file name" v-model="addData.name">-->
<!--                <small class="form-text text-muted">Such as <code>filename.txt</code></small>-->
<!--              </div>-->
<!--              <div class="form-group">-->
<!--                <label for="data-type">Type:</label>-->
<!--                <input type="text" class="form-control" required id="data-type"  placeholder="Please enter the MIME type" v-model="addData.type">-->
<!--                <small class="form-text text-muted">Such as <code>text/plain</code></small>-->
<!--              </div>-->
<!--              <div class="form-group">-->
<!--                <label for="content">Content:</label>-->
<!--                <textarea class="form-control" required id="content" rows="3" placeholder="Please enter the file contents" v-model="addData.content"></textarea>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="modal-footer">-->
<!--              <button type="button" class="btn btn-secondary" @click.prevent="addData.show = false">Close</button>-->
<!--              <button type="submit" class="btn btn-primary">Save</button>-->
<!--            </div>-->
<!--          </form>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->






<!--    <div :class="{'modal-backdrop': true, 'fade': true, show: editFile.show}"></div>-->
<!--    <div :class="{modal: true, fade: true, show: editFile.show}" id="modal-edit-file" tabindex="-1" role="dialog">-->
<!--      <div class="modal-dialog modal-lg" role="document">-->
<!--        <div class="modal-content">-->
<!--          <div class="modal-header">-->
<!--            <h5 class="modal-title">Edit file</h5>-->
<!--            <button type="button" class="close"  @click.prevent="editFile.show = false">-->
<!--              <span>&times;</span>-->
<!--            </button>-->
<!--          </div>-->
<!--          <form @submit.prevent="onEditorFile">-->
<!--            <div class="modal-body">-->
<!--              <div class="form-group">-->
<!--                <label for="name">Name:</label>-->
<!--                <input type="text" class="form-control" required id="name"  placeholder="Please enter a file name" v-model="editFile.name">-->
<!--              </div>-->
<!--              <div class="form-group" v-if="editFile.show && editFile.blob && editFile.type && editFile.type.substr(0, 6) === 'image/'">-->
<!--                <label>Image: </label>-->
<!--                <div class="edit-image">-->
<!--                  <img :src="editFile.blob" ref="editImage" />-->
<!--                </div>-->

<!--              </div>-->
<!--            </div>-->
<!--            <div class="modal-footer">-->
<!--              <button type="button" class="btn btn-secondary" @click.prevent="editFile.show = false">Close</button>-->
<!--              <button type="submit" class="btn btn-primary">Save</button>-->
<!--            </div>-->
<!--          </form>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->

    <div class="pt-5 source-code">
      Source code: <a href="https://github.com/lian-yue/vue-upload-component/blob/master/docs/views/examples/Full.vue">/docs/views/examples/Full.vue</a>
    </div>

  </div>
</template>

<style>
div.table-responsive {
  overflow: clip;
}
.upload-tab .btn-group .dropdown-menu {
  display: block;
  visibility: hidden;
  transition: all .2s
}
.upload-tab .btn-group:hover > .dropdown-menu {
  visibility: visible;
}

.upload-tab label.dropdown-item {
  margin-bottom: 0;
}

.upload-tab .btn-group .dropdown-toggle {
  margin-right: .6rem
}

.td-image-thumb {
  max-width: 4em;
  max-height: 4em;
}

.upload-tab .filename {
  margin-bottom: .3rem
}

.upload-tab .btn-is-option {
  margin-top: 0.25rem;
}
.upload-tab .example-foorer {
  padding: .5rem 0;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}


.upload-tab .edit-image img {
  max-width: 100%;
}

.upload-tab .edit-image-tool {
  margin-top: .6rem;
}

.upload-tab .edit-image-tool .btn-group{
  margin-right: .6rem;
}

.upload-tab .footer-status {
  padding-top: .4rem;
}

.upload-tab .drop-active {
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  position: fixed;
  z-index: 9999;
  opacity: .6;
  text-align: center;
  background: #000;
}

.upload-tab .drop-active h3 {
  margin: -.5em 0 0;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  font-size: 40px;
  color: #fff;
  padding: 0;
}
</style>

<script>
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import {getToken} from "../http.service"
import FileUpload from 'vue-upload-component'

export default {
  components: {
    FileUpload,
  },

  data() {
    return {
      files: [],
      // accept: 'image/png,image/gif,image/jpeg,image/webp,application/json,text/html',
      // extensions: 'gif,jpg,jpeg,png,webp,json,html',
      // extensions: ['gif', 'jpg', 'jpeg','png', 'webp'],
      // extensions: /\.(gif|jpe?g|png|webp)$/i,
      // minSize: 1024,
      // size: 1024 * 1024 * 100,
      multiple: true,
      directory: true,
      drop: true,
      dropDirectory: true,
      createDirectory: true,
      addIndex: true,
      html5: true,
      name: 'file',
      postAction: '/api/upload',
      headers: {
        'X-Csrf-Token': 'xxxx',
        'Authorization': 'Bearer '+getToken()
      },
      data: {
        '_csrf_token': 'xxxxxx',
      },

      autoCompress: 1024 * 1024,
      uploadAuto: false,
      isOption: false,

      addData: {
        show: false,
        name: '',
        type: '',
        content: '',
      },


      editFile: {
        show: false,
        name: '',
      },

      // Custom action to have the full (relative) path of field included in the upload and not just
      // the file name
      customAction: async function customAction(file, component) {
        // This is copied from component.uploadHtml5 to fix the filename setting
        const form = new window.FormData()
        let value
        for (const key in file.data) {
          value = file.data[key]
          if (value && typeof value === 'object' && typeof value.toString !== 'function') {
            if (value instanceof File) {
              form.append(key, value, value.name)
            } else {
              form.append(key, JSON.stringify(value))
            }
          } else if (value !== null && value !== undefined) {
            form.append(key, value)
          }
        }
        // Moved file.name as the first option to set the filenname of the uploaded file, since file.name
        // contains the full (relative) path of the file not just the filename as file.file.filename
        // @ts-ignore
        form.append(this.name, file.file, file.name || file.file.name || file.file.filename)
        const xhr = new XMLHttpRequest()
        xhr.open('POST', file.postAction || '')
        return component.uploadXhr(xhr, file, form)
      }
    }
  },

  watch: {
    'editFile.show'(newValue, oldValue) {
      // 关闭了 自动删除 error
      if (!newValue && oldValue) {
        this.$refs.upload.update(this.editFile.id, { error: this.editFile.error || '' })
      }

    },

    'addData.show'(show) {
      if (show) {
        this.addData.name = ''
        this.addData.type = ''
        this.addData.content = ''
      }
    },
  },

  methods: {
    inputFilter(newFile, oldFile, prevent) {
      if (newFile && !oldFile) {
        // Before adding a file
        // 添加文件前

        // Filter system files or hide files
        // 过滤系统文件 和隐藏文件
        if (/(\/|^)(Thumbs\.db|desktop\.ini|\..+)$/.test(newFile.name)) {
          return prevent()
        }

        // Filter php html js file
        // 过滤 php html js 文件
        if (/\.(php5?|html?|jsx?)$/i.test(newFile.name)) {
          return prevent()
        }
      }


      if (newFile && newFile.error === "" && newFile.file && (!oldFile || newFile.file !== oldFile.file)) {
        // Create a blob field
        // 创建 blob 字段
        newFile.blob = ''
        let URL = (window.URL || window.webkitURL)
        if (URL) {
          newFile.blob = URL.createObjectURL(newFile.file)
        }

        // Thumbnails
        // 缩略图
        newFile.thumb = ''
        if (newFile.blob && newFile.type.substr(0, 6) === 'image/') {
          newFile.thumb = newFile.blob
        }
      }

      // image size
      // image 尺寸
      if (newFile && newFile.error === '' && newFile.type.substr(0, 6) === "image/" && newFile.blob && (!oldFile || newFile.blob !== oldFile.blob)) {
        newFile.error = 'image parsing'
        let img = new Image();
        img.onload = () => {
          this.$refs.upload.update(newFile, {error: '', height: img.height, width: img.width})
        }
        img.οnerrοr = (e) => {
          this.$refs.upload.update(newFile, { error: 'parsing image size'})
        }
        img.src = newFile.blob
      }
    },

    // add, update, remove File Event
    inputFile(newFile, oldFile) {
      if (newFile && oldFile) {
        // update

        if (newFile.active && !oldFile.active) {
          // beforeSend

          // min size
          if (newFile.size >= 0 && this.minSize > 0 && newFile.size < this.minSize) {
            this.$refs.upload.update(newFile, { error: 'size' })
          }
        }

        if (newFile.progress !== oldFile.progress) {
          // progress
        }

        if (newFile.error && !oldFile.error) {
          // error
        }

        if (newFile.success && !oldFile.success) {
          // success
        }
      }


      if (!newFile && oldFile) {
        // remove
        if (oldFile.success && oldFile.response.id) {
          // $.ajax({
          //   type: 'DELETE',
          //   url: '/upload/delete?id=' + oldFile.response.id,
          // })
        }
      }


      // Automatically activate upload
      if (Boolean(newFile) !== Boolean(oldFile) || oldFile.error !== newFile.error) {
        if (this.uploadAuto && !this.$refs.upload.active) {
          this.$refs.upload.active = true
        }
      }
    },


    alert(message) {
      alert(message)
    },


    onEditFileShow(file) {
      this.editFile = { ...file, show: true }
      this.$refs.upload.update(file, { error: 'edit' })
    },

    onEditorFile() {
      if (!this.$refs.upload.features.html5) {
        this.alert('Your browser does not support')
        this.editFile.show = false
        return
      }

      let data = {
        name: this.editFile.name,
        error: '',
      }
      this.$refs.upload.update(this.editFile.id, data)
      this.editFile.error = ''
      this.editFile.show = false
    },

    // add folder
    onAddFolder() {
      if (!this.$refs.upload.features.directory) {
        this.alert('Your browser does not support')
        return
      }
      let input = document.createElement('input')
      input.style = "background: rgba(255, 255, 255, 0);overflow: hidden;position: fixed;width: 1px;height: 1px;z-index: -1;opacity: 0;"
      input.type = 'file'
      input.setAttribute('allowdirs', true)
      input.setAttribute('directory', true)
      input.setAttribute('webkitdirectory', true)
      input.multiple = true
      document.querySelector("body").appendChild(input)
      input.click()
      input.onchange = (e) => {
        this.$refs.upload.addInputFile(input).then(function() {
          document.querySelector("body").removeChild(input)
        })
      }
    },

    onAddData() {
      this.addData.show = false
      if (!this.$refs.upload.features.html5) {
        this.alert('Your browser does not support')
        return
      }

      let file = new window.File([this.addData.content], this.addData.name, {
        type: this.addData.type,
      })
      this.$refs.upload.add(file)
    }
  }
}
</script>


<!--<template>-->
<!--	<div>-->
<!--    <div id="upload2">-->
<!--      <ul>-->
<!--        <li v-for="file in files">{{file.name}} - Error: {{file.error}}, Success: {{file.success}}</li>-->
<!--      </ul>-->
<!--      &lt;!&ndash; Note: need to add the Authorization header to the VueUploadComponent's HTTP handler &ndash;&gt;-->
<!--      <VueUploadComponent-->
<!--          ref="upload"-->
<!--          v-model="files"-->
<!--          post-action="/api/upload"-->
<!--          :headers="{'Authorization': 'Bearer '+getToken()}"-->
<!--          @input-file="inputFile"-->
<!--          @input-filter="inputFilter"-->
<!--      >-->
<!--        Upload file-->
<!--      </VueUploadComponent>-->
<!--      <button v-show="!$refs.upload || !$refs.upload.active" @click.prevent="$refs.upload.active = true" type="button">Start upload</button>-->
<!--      <button v-show="$refs.upload && $refs.upload.active" @click.prevent="$refs.upload.active = false" type="button">Stop upload</button>-->
<!--    </div>-->
<!--	</div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { useStore } from "vuex";-->
<!--import { ref } from "vue";-->
<!--import {getToken} from "../http.service";-->
<!--// https://lian-yue.github.io/vue-upload-component/#/en/documents-->
<!--import VueUploadComponent from 'vue-upload-component'-->

<!--const store = useStore();-->
<!--const resource = ref(store.state.target.resource);-->
<!--const folder = ref(store.state.target.folder);-->
<!--</script>-->


