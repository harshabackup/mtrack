import os
from supabase import create_client, Client
from fastapi import HTTPException

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BUCKET_NAME = "proposal_files"

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase Storage credentials are not configured properly.")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def upload_file_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Uploads a file to Supabase Storage and returns the public URL.
    """
    supabase = get_supabase_client()
    try:
        # Upload the file
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(filename)
        return public_url
    except Exception as e:
        print(f"Supabase Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file to cloud storage: {str(e)}")

def delete_file_from_supabase(filename: str):
    """
    Deletes a file from Supabase Storage.
    """
    supabase = get_supabase_client()
    try:
        supabase.storage.from_(BUCKET_NAME).remove([filename])
    except Exception as e:
        print(f"Supabase Delete Error: {str(e)}")
        # We don't raise here because deleting from storage shouldn't break the DB deletion
