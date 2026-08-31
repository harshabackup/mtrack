import os
from fastapi import HTTPException

# Base URL where the backend is hosted. 
# We'll use the API_URL env if available, else fallback.
STORAGE_DIR = "storage"

def get_base_url() -> str:
    """Read API_URL at request time so env vars set after startup are picked up."""
    return os.getenv("API_URL", "https://api.harsharoyal.in")

def upload_file_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Saves a file to the local storage directory and returns the public URL.
    (Kept the function name `upload_file_to_supabase` to avoid refactoring the entire codebase)
    """
    try:
        # Create full path ensuring directories exist
        full_path = os.path.join(STORAGE_DIR, filename)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, "wb") as f:
            f.write(file_bytes)
            
        # Return the public URL - read base URL at request time, not module load time
        import urllib.parse
        encoded_filename = urllib.parse.quote(filename)
        base_url = get_base_url()
        return f"{base_url}/storage/{encoded_filename}"
    except Exception as e:
        print(f"Local Storage Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file to local storage: {str(e)}")

def delete_file_from_supabase(filename: str):
    """
    Deletes a file from the local storage directory.
    """
    try:
        full_path = os.path.join(STORAGE_DIR, filename)
        if os.path.exists(full_path):
            os.remove(full_path)
    except Exception as e:
        print(f"Local Storage Delete Error: {str(e)}")
