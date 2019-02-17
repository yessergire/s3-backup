const AWS = require('aws-sdk')
const md5File = require('md5-file')
const fs = require('fs')
const chokidar = require('chokidar');
const config = require('./utils/config');

const files = {}

const s3 = new AWS.S3()

const hashFromETag = ETag => ETag.slice(1, ETag.length - 1)

const fileHasChanged = filename =>
        !files[filename] ||
        files[filename].hash !== files[filename].remoteHash

const backupFile = filename => {
    try {
    const filepath = config.BASE_DIR + '/' + filename
    const options = {
        Bucket: config.BUCKET,
        Key: filename,
        Body: fs.createReadStream(filepath)
    }

    s3.upload(options, (error, data) => {
        if (error) throw error
        console.log("uploaded file", filepath)
        files[filename] = files[filename] || {}
        files[filename].remoteHash = hashFromETag(data.ETag)
    })
  } catch (error) {
      console.log(error)
  }
}

const init = (error, data) => {
    if (error) throw error

    const remoteFiles = data.Contents
    remoteFiles.forEach(file => {
        const filename = file.Key
        files[filename] = files[filename] || {}
        files[filename].remoteHash = hashFromETag(file.ETag)
    })

    for (const file in files) {
        if (fileHasChanged(file))
          backupFile(file)
    }

    const onChange = path => {
      const filename = path.split('/').pop()
      files[filename] = files[filename] || {}
      files[filename].hash = md5File.sync(path)
      if (fileHasChanged(filename)) {
          console.log(filename, "has changed", files[filename])
        backupFile(filename)
      }
    }

    const watcher = chokidar.watch(config.BASE_DIR, {ignored: /(^|[\/\\])\../})
    watcher
      .on('add', onChange)
      .on('change', onChange)
}

const test = () => {
  var mock_data = JSON.parse(fs.readFileSync('mock-data.json', 'utf8'));
  init(null, mock_data)
}

const main = () => {
  const filelist = fs.readdirSync(config.BASE_DIR)
  filelist.forEach(file => {
    files[file] = {hash: md5File.sync(config.BASE_DIR + '/' + file)}
  })
  s3.listObjectsV2({Bucket: config.BUCKET}, init)
}

main()