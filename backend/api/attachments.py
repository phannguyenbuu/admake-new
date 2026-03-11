import mimetypes
import os

from flask import Blueprint, abort, jsonify, send_file

from models import DocumentCenterAttachment, db, generate_datetime_id, upload_a_file_to_vps


attachments_bp = Blueprint("attachments", __name__, url_prefix="/api/attachments")


def _get_upload_root():
    return os.path.join(os.getcwd(), "static")


def _resolve_file_path(storage_key: str):
    if not storage_key:
        return None
    return os.path.join(_get_upload_root(), storage_key)


@attachments_bp.route("/upload", methods=["POST"])
def upload_attachment():
    from flask import request  # local import to keep this module lean

    file = request.files.get("file")
    if not file:
        abort(400, description="file is required")

    filename, _filepath, _thumb = upload_a_file_to_vps(file)
    mime_type = file.mimetype or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    size = 0
    try:
        size = int(request.content_length or 0)
    except Exception:
        size = 0

    uploaded_by = request.form.get("uploadedBy") or request.headers.get("X-User-Id")

    attachment = DocumentCenterAttachment(
        id=generate_datetime_id(),
        document_id=None,
        filename=filename,
        mimeType=mime_type,
        size=size,
        storageKey=filename,
        url=f"/static/{filename}",
        uploadedBy=uploaded_by,
    )
    db.session.add(attachment)
    db.session.commit()
    return jsonify(attachment.tdict()), 201


@attachments_bp.route("/<string:attachment_id>/download", methods=["GET"])
def download_attachment(attachment_id):
    attachment = DocumentCenterAttachment.query.filter(
        DocumentCenterAttachment.id == attachment_id, DocumentCenterAttachment.deletedAt.is_(None)
    ).first()
    if not attachment:
        abort(404, description="Attachment not found")

    file_path = _resolve_file_path(attachment.storageKey)
    if not file_path or not os.path.exists(file_path):
        abort(404, description="File not found")

    return send_file(
        file_path,
        as_attachment=True,
        download_name=attachment.filename or os.path.basename(file_path),
        mimetype=attachment.mimeType or "application/octet-stream",
    )


@attachments_bp.route("/<string:attachment_id>/preview", methods=["GET"])
def preview_attachment(attachment_id):
    attachment = DocumentCenterAttachment.query.filter(
        DocumentCenterAttachment.id == attachment_id, DocumentCenterAttachment.deletedAt.is_(None)
    ).first()
    if not attachment:
        abort(404, description="Attachment not found")

    file_path = _resolve_file_path(attachment.storageKey)
    if not file_path or not os.path.exists(file_path):
        abort(404, description="File not found")

    return send_file(file_path, as_attachment=False, mimetype=attachment.mimeType or "application/octet-stream")
