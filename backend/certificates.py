import base64
import uuid
from datetime import datetime
from database import get_db

def save_certificate(
    user_id:     str,
    event_name:  str,
    issuer:      str,
    event_date:  str,
    cert_type:   str,
    file_base64: str,
    file_name:   str,
):
    db = get_db()

    # Store base64 in MongoDB (free, no S3 needed)
    # Limit: 16MB per document — fine for certificates
    cert_id = str(uuid.uuid4())
    doc = {
        "id":          cert_id,
        "user_id":     user_id,
        "event_name":  event_name,
        "issuer":      issuer,
        "event_date":  event_date,
        "cert_type":   cert_type,
        "file_base64": file_base64,   # base64 encoded file
        "file_name":   file_name,
        "status":      "pending",     # pending | approved | rejected
        "mar_points":  0,             # set by admin on approval
        "submitted_at": datetime.now().isoformat(),
        "reviewed_at": None,
        "admin_note":  None,
    }
    db.certificates.insert_one(doc)
    return cert_id

def get_user_certificates(user_id: str):
    db   = get_db()
    docs = list(db.certificates.find(
        {"user_id": user_id},
        {"_id": 0, "file_base64": 0}  # exclude file from list view
    ).sort("submitted_at", -1))
    return docs

def get_all_pending(admin_id: str):
    """For admin use."""
    db = get_db()
    return list(db.certificates.find(
        {"status": "pending"},
        {"_id": 0, "file_base64": 0}
    ).sort("submitted_at", 1))

def approve_certificate(cert_id: str, mar_points: int, admin_note: str = ""):
    db = get_db()
    cert = db.certificates.find_one({"id": cert_id})
    if not cert:
        return False

    db.certificates.update_one(
        {"id": cert_id},
        {"$set": {
            "status":      "approved",
            "mar_points":  mar_points,
            "admin_note":  admin_note,
            "reviewed_at": datetime.now().isoformat(),
        }}
    )
    # Add MAR points to user
    db.users.update_one(
        {"id": cert["user_id"]},
        {"$inc": {"points": mar_points}}
    )
    return True

def reject_certificate(cert_id: str, admin_note: str = ""):
    db = get_db()
    db.certificates.update_one(
        {"id": cert_id},
        {"$set": {
            "status":      "rejected",
            "admin_note":  admin_note,
            "reviewed_at": datetime.now().isoformat(),
        }}
    )
    return True

def get_certificate_file(cert_id: str, user_id: str):
    """Returns base64 file for download — only for owner."""
    db   = get_db()
    cert = db.certificates.find_one(
        {"id": cert_id, "user_id": user_id},
        {"_id": 0}
    )
    return cert
