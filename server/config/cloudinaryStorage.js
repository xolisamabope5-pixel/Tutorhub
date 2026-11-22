const path = require("path");
const { v2: defaultCloudinary } = require("cloudinary");

class CloudinaryMulterStorage {
  constructor({ cloudinary, params = {} } = {}) {
    this.cloudinary = cloudinary || defaultCloudinary;

    this.folder = params.folder;
    this.resource_type = params.resource_type || "auto";
    this.allowed_formats = (params.allowed_formats || []).map((format) =>
      format.toLowerCase()
    );

    this.use_filename = params.use_filename;
    this.unique_filename = params.unique_filename;
  }

  _handleFile(req, file, callback) {
    const extension = path
      .extname(file.originalname || "")
      .replace(".", "")
      .toLowerCase();

    if (
      this.allowed_formats.length > 0 &&
      !this.allowed_formats.includes(extension)
    ) {
      return callback(
        new Error(`File format .${extension} is not allowed.`)
      );
    }

    const options = {
      resource_type: this.resource_type,
    };

    if (this.folder) options.folder = this.folder;

    if (this.use_filename !== undefined) {
      options.use_filename = this.use_filename;
    }

    if (this.unique_filename !== undefined) {
      options.unique_filename = this.unique_filename;
    }

    let completed = false;

    const finish = (error, result) => {
      if (completed) return;
      completed = true;

      if (error) return callback(error);

      callback(null, {
        path: result.secure_url,
        secure_url: result.secure_url,
        filename: result.public_id,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
      });
    };

    try {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return finish(error);
          if (!result) {
            return finish(new Error("Cloudinary returned no upload result."));
          }
          finish(null, result);
        }
      );

      file.stream.on("error", (error) => finish(error));
      uploadStream.on("error", (error) => finish(error));

      file.stream.pipe(uploadStream);
    } catch (error) {
      finish(error);
    }
  }

  _removeFile(req, file, callback) {
    const publicId = file.public_id || file.filename;

    if (!publicId) {
      return callback(new Error("Cloudinary public ID is missing."));
    }

    this.cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: file.resource_type || this.resource_type,
      },
      (error) => callback(error || null)
    );
  }
}

module.exports = CloudinaryMulterStorage;