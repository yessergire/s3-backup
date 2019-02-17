# S3 backup
A simple backup software that will periodically
upload any changed files in a directory to a S3 bucket.

## How?
The code lists files in the given directory,
calculates and stores it's hash. This hash is compared
with the hash of the remote file stored at the S3 bucket.
The file is uploaded to the bucket, if it isn't there
or it's hash differs from the hash of it's remote counter part.
The hashes of the remote files are retrieved using AWS SDK's listObjectsV2 method.
No other functionalities are used.

## Getting started
Set the directory and S3 bucket names in `utils/config.js`.

Install with npm:

    git clone https://github.com/yessergire/s3-backup.git
    npm install
    npm start
